import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmbeddingProvider } from "../Week 06 — Embeddings & Vector Search/embeddingProvider";
import { chunkDocuments } from "./chunking";
import type {
  IndexedKnowledgeChunk,
  KnowledgeDocument,
} from "./types";

export const DEFAULT_RAG_INDEX_PATH = path.resolve(
  process.cwd(),
  ".data",
  "rag-knowledge-index.json"
);

export type RagIndexMetadata = {
  version: 1;
  model: string;
  dimensions: number;
  createdAt: string;
  documentCount: number;
  chunkCount: number;
  chunkSize: number;
  overlap: number;
};

export type RagIndex = {
  metadata: RagIndexMetadata;
  chunks: IndexedKnowledgeChunk[];
};

function positiveInteger(name: string, value: number, maximum?: number) {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    (maximum !== undefined && value > maximum)
  ) {
    const upper = maximum === undefined ? "" : ` and at most ${maximum}`;
    throw new RangeError(`${name} must be a positive integer${upper}`);
  }
}

function validateEmbedding(embedding: readonly number[], dimensions: number) {
  return (
    embedding.length === dimensions &&
    embedding.every((value) => Number.isFinite(value))
  );
}

export async function buildRagIndex(options: {
  documents: readonly KnowledgeDocument[];
  embedder: EmbeddingProvider;
  outputPath?: string;
  chunkSize?: number;
  overlap?: number;
  batchSize?: number;
}) {
  if (options.documents.length === 0) {
    throw new Error("At least one knowledge document is required");
  }
  const outputPath = path.resolve(options.outputPath ?? DEFAULT_RAG_INDEX_PATH);
  const chunkSize = options.chunkSize ?? 600;
  const overlap = options.overlap ?? 100;
  const batchSize = options.batchSize ?? 64;
  positiveInteger("batchSize", batchSize, 256);

  const chunks = chunkDocuments(options.documents, { chunkSize, overlap });
  if (chunks.length === 0) throw new Error("Knowledge documents produced no chunks");

  const indexedChunks: IndexedKnowledgeChunk[] = [];
  for (let offset = 0; offset < chunks.length; offset += batchSize) {
    const batch = chunks.slice(offset, offset + batchSize);
    const embeddings = await options.embedder.embed(
      batch.map((chunk) => `${chunk.title}\n\n${chunk.text}`)
    );
    if (embeddings.length !== batch.length) {
      throw new Error("Embedding provider returned an unexpected result count");
    }
    batch.forEach((chunk, index) => {
      const embedding = embeddings[index];
      if (!validateEmbedding(embedding, options.embedder.dimensions)) {
        throw new Error("Embedding provider returned an invalid vector");
      }
      indexedChunks.push({ ...chunk, embedding: [...embedding] });
    });
  }

  const index: RagIndex = {
    metadata: {
      version: 1,
      model: options.embedder.model,
      dimensions: options.embedder.dimensions,
      createdAt: new Date().toISOString(),
      documentCount: options.documents.length,
      chunkCount: indexedChunks.length,
      chunkSize,
      overlap,
    },
    chunks: indexedChunks,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(index)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
  return { outputPath, index };
}

function validateRagIndex(value: unknown): RagIndex {
  const index = value as Partial<RagIndex>;
  const metadata = index?.metadata as Partial<RagIndexMetadata> | undefined;
  if (
    metadata?.version !== 1 ||
    typeof metadata.model !== "string" ||
    !Number.isInteger(metadata.dimensions) ||
    Number(metadata.dimensions) < 1 ||
    !Number.isInteger(metadata.chunkCount) ||
    !Array.isArray(index.chunks) ||
    index.chunks.length !== metadata.chunkCount
  ) {
    throw new Error("RAG index metadata is invalid");
  }

  for (const chunk of index.chunks) {
    if (
      !chunk?.id ||
      !chunk.title ||
      !chunk.sourcePath ||
      !chunk.text ||
      !validateEmbedding(chunk.embedding, Number(metadata.dimensions))
    ) {
      throw new Error("RAG index contains an invalid chunk");
    }
  }
  return index as RagIndex;
}

export async function readRagIndex(indexPath = DEFAULT_RAG_INDEX_PATH) {
  try {
    const content = await readFile(path.resolve(indexPath), "utf8");
    return validateRagIndex(JSON.parse(content));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("RAG index is missing. Run npm run week8:index first.");
    }
    throw error;
  }
}
