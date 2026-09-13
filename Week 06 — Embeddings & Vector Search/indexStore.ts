import { createReadStream } from "node:fs";
import { mkdir, open, rename, unlink } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import type { EmbeddingProvider } from "./embeddingProvider";
import {
  buildListingEmbeddingText,
  type EmbeddingListing,
  type IndexedListing,
  withoutRemarks,
} from "./listingText";

export const DEFAULT_INDEX_PATH = path.resolve(
  process.cwd(),
  ".data",
  "listing-embeddings.jsonl"
);

export type EmbeddingIndexMetadata = {
  kind: "metadata";
  version: 1;
  model: string;
  dimensions: number;
  createdAt: string;
  listingCount: number;
};

export type EmbeddingIndexEntry = {
  kind: "listing";
  listing: IndexedListing;
  embedding: string;
};

export type ListingBatchFetcher = (
  offset: number,
  limit: number
) => Promise<EmbeddingListing[]>;

function encodeEmbedding(embedding: readonly number[]) {
  const bytes = Buffer.allocUnsafe(embedding.length * Float32Array.BYTES_PER_ELEMENT);
  embedding.forEach((value, index) => bytes.writeFloatLE(value, index * 4));
  return bytes.toString("base64");
}

export function decodeEmbedding(encoded: string, dimensions: number) {
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.length !== dimensions * Float32Array.BYTES_PER_ELEMENT) {
    throw new Error("Index contains an embedding with unexpected dimensions");
  }
  const embedding = new Array<number>(dimensions);
  for (let index = 0; index < dimensions; index += 1) {
    embedding[index] = bytes.readFloatLE(index * 4);
  }
  return embedding;
}

function positiveInteger(name: string, value: number, maximum?: number) {
  if (!Number.isInteger(value) || value < 1 || (maximum !== undefined && value > maximum)) {
    const suffix = maximum === undefined ? "" : ` and at most ${maximum}`;
    throw new RangeError(`${name} must be a positive integer${suffix}`);
  }
}

export async function buildEmbeddingIndex(options: {
  embedder: EmbeddingProvider;
  fetchListings: ListingBatchFetcher;
  listingCount: number;
  outputPath?: string;
  batchSize?: number;
}) {
  const outputPath = path.resolve(options.outputPath ?? DEFAULT_INDEX_PATH);
  const batchSize = options.batchSize ?? 64;
  positiveInteger("listingCount", options.listingCount);
  positiveInteger("batchSize", batchSize, 256);

  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  const file = await open(temporaryPath, "w", 0o600);
  let written = 0;

  const metadata: EmbeddingIndexMetadata = {
    kind: "metadata",
    version: 1,
    model: options.embedder.model,
    dimensions: options.embedder.dimensions,
    createdAt: new Date().toISOString(),
    listingCount: options.listingCount,
  };

  try {
    try {
      await file.write(`${JSON.stringify(metadata)}\n`);
      while (written < options.listingCount) {
        const requested = Math.min(batchSize, options.listingCount - written);
        const listings = await options.fetchListings(written, requested);
        if (listings.length === 0) break;
        if (listings.length > requested) {
          throw new Error("Listing fetcher returned more records than requested");
        }

        const embeddings = await options.embedder.embed(
          listings.map(buildListingEmbeddingText)
        );
        if (embeddings.length !== listings.length) {
          throw new Error("Embedding provider returned an unexpected result count");
        }

        for (let index = 0; index < listings.length; index += 1) {
          const entry: EmbeddingIndexEntry = {
            kind: "listing",
            listing: withoutRemarks(listings[index]),
            embedding: encodeEmbedding(embeddings[index]),
          };
          await file.write(`${JSON.stringify(entry)}\n`);
        }
        written += listings.length;
      }

      if (written !== options.listingCount) {
        throw new Error(
          `Expected ${options.listingCount} listings but indexed ${written}`
        );
      }
    } finally {
      await file.close();
    }

    await rename(temporaryPath, outputPath);
    return { outputPath, listingCount: written, metadata };
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

function validateMetadata(value: unknown): EmbeddingIndexMetadata {
  const metadata = value as Partial<EmbeddingIndexMetadata>;
  if (
    metadata?.kind !== "metadata" ||
    metadata.version !== 1 ||
    typeof metadata.model !== "string" ||
    !Number.isInteger(metadata.dimensions) ||
    Number(metadata.dimensions) < 1 ||
    !Number.isInteger(metadata.listingCount) ||
    Number(metadata.listingCount) < 1
  ) {
    throw new Error("Embedding index metadata is invalid");
  }
  return metadata as EmbeddingIndexMetadata;
}

export async function readIndexMetadata(indexPath = DEFAULT_INDEX_PATH) {
  const input = createReadStream(path.resolve(indexPath), { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      if (!line.trim()) continue;
      return validateMetadata(JSON.parse(line));
    }
  } catch (error) {
    input.destroy();
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("Embedding index is missing. Run npm run week6:index first.");
    }
    throw error;
  } finally {
    lines.close();
    input.destroy();
  }
  throw new Error("Embedding index is empty");
}

export async function mergeEmbeddingIndexes(
  inputPaths: readonly string[],
  outputPath = DEFAULT_INDEX_PATH
) {
  if (inputPaths.length < 2) {
    throw new Error("At least two embedding indexes are required for merging");
  }

  const resolvedOutputPath = path.resolve(outputPath);
  const resolvedInputPaths = inputPaths.map((inputPath) => path.resolve(inputPath));
  if (resolvedInputPaths.includes(resolvedOutputPath)) {
    throw new Error("Merged output path must be different from every input path");
  }

  const metadataList = await Promise.all(resolvedInputPaths.map(readIndexMetadata));
  const [firstMetadata] = metadataList;
  for (const metadata of metadataList.slice(1)) {
    if (
      metadata.model !== firstMetadata.model ||
      metadata.dimensions !== firstMetadata.dimensions ||
      metadata.version !== firstMetadata.version
    ) {
      throw new Error("Embedding index segments use incompatible metadata");
    }
  }

  const listingCount = metadataList.reduce(
    (total, metadata) => total + metadata.listingCount,
    0
  );
  const metadata: EmbeddingIndexMetadata = {
    ...firstMetadata,
    createdAt: new Date().toISOString(),
    listingCount,
  };

  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  const temporaryPath = `${resolvedOutputPath}.tmp-${process.pid}`;
  const output = await open(temporaryPath, "w", 0o600);
  let written = 0;

  try {
    try {
      await output.write(`${JSON.stringify(metadata)}\n`);
      for (let segmentIndex = 0; segmentIndex < resolvedInputPaths.length; segmentIndex += 1) {
        const input = createReadStream(resolvedInputPaths[segmentIndex], {
          encoding: "utf8",
        });
        const lines = readline.createInterface({ input, crlfDelay: Infinity });
        let sawMetadata = false;
        let segmentCount = 0;
        try {
          for await (const line of lines) {
            if (!line.trim()) continue;
            if (!sawMetadata) {
              validateMetadata(JSON.parse(line));
              sawMetadata = true;
              continue;
            }
            const entry = JSON.parse(line) as EmbeddingIndexEntry;
            if (
              entry.kind !== "listing" ||
              !entry.listing ||
              typeof entry.embedding !== "string"
            ) {
              throw new Error("Embedding index segment contains an invalid listing entry");
            }
            decodeEmbedding(entry.embedding, firstMetadata.dimensions);
            await output.write(`${JSON.stringify(entry)}\n`);
            segmentCount += 1;
            written += 1;
          }
        } finally {
          lines.close();
          input.destroy();
        }

        if (!sawMetadata || segmentCount !== metadataList[segmentIndex].listingCount) {
          throw new Error(
            `Embedding index segment expected ${metadataList[segmentIndex].listingCount} listings but contains ${segmentCount}`
          );
        }
      }
    } finally {
      await output.close();
    }

    if (written !== listingCount) {
      throw new Error(`Expected ${listingCount} merged listings but wrote ${written}`);
    }
    await rename(temporaryPath, resolvedOutputPath);
    return { outputPath: resolvedOutputPath, listingCount, metadata };
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function* readIndexEntries(indexPath = DEFAULT_INDEX_PATH) {
  const input = createReadStream(path.resolve(indexPath), { encoding: "utf8" });
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  let metadata: EmbeddingIndexMetadata | undefined;
  let seen = 0;

  try {
    for await (const line of lines) {
      if (!line.trim()) continue;
      const parsed = JSON.parse(line) as EmbeddingIndexMetadata | EmbeddingIndexEntry;
      if (!metadata) {
        metadata = validateMetadata(parsed);
        continue;
      }
      if (parsed.kind !== "listing" || !parsed.listing || typeof parsed.embedding !== "string") {
        throw new Error("Embedding index contains an invalid listing entry");
      }
      seen += 1;
      yield {
        listing: parsed.listing,
        embedding: decodeEmbedding(parsed.embedding, metadata.dimensions),
        metadata,
      };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("Embedding index is missing. Run npm run week6:index first.");
    }
    throw error;
  } finally {
    lines.close();
  }

  if (!metadata) throw new Error("Embedding index is empty");
  if (seen !== metadata.listingCount) {
    throw new Error(
      `Embedding index expected ${metadata.listingCount} listings but contains ${seen}`
    );
  }
}
