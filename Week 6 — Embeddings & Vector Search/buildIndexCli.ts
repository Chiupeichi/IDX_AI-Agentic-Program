import "dotenv/config";
import { closePool } from "../Week 3 – MLS Database Integration/mysql";
import { OpenAIEmbeddingProvider } from "./embeddingProvider";
import { buildEmbeddingIndex, DEFAULT_INDEX_PATH } from "./indexStore";
import {
  countIndexableListings,
  fetchIndexableListings,
} from "./listingSource";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function optionalPositiveInteger(name: string) {
  const value = argument(name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return parsed;
}

function optionalNonNegativeInteger(name: string) {
  const value = argument(name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`--${name} must be a non-negative integer`);
  }
  return parsed;
}

async function main() {
  const city = argument("city")?.trim() || undefined;
  const startOffset = optionalNonNegativeInteger("offset") ?? 0;
  const requestedLimit = optionalPositiveInteger("limit");
  const batchSize = optionalPositiveInteger("batch-size") ?? 64;
  if (batchSize > 256) throw new Error("--batch-size cannot exceed 256");

  const available = await countIndexableListings(city);
  if (available === 0) throw new Error("No active listings with remarks were found");
  if (startOffset >= available) {
    throw new Error(`--offset must be less than the ${available} available listings`);
  }
  const remaining = available - startOffset;
  const listingCount = Math.min(remaining, requestedLimit ?? remaining);
  const embedder = new OpenAIEmbeddingProvider();

  console.log(
    `Building ${embedder.model}/${embedder.dimensions} index for ${listingCount} active listings (offset ${startOffset})...`
  );
  const result = await buildEmbeddingIndex({
    embedder,
    listingCount,
    batchSize,
    outputPath: argument("output") || DEFAULT_INDEX_PATH,
    fetchListings: (offset, limit) =>
      fetchIndexableListings(startOffset + offset, limit, city),
  });
  console.log(`Indexed ${result.listingCount} listings at ${result.outputPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closePool();
}
