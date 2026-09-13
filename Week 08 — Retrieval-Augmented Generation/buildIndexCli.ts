import "dotenv/config";
import { OpenAIEmbeddingProvider } from "../Week 06 — Embeddings & Vector Search/embeddingProvider";
import { loadKnowledgeDocuments } from "./knowledgeLoader";
import { buildRagIndex, DEFAULT_RAG_INDEX_PATH } from "./ragIndex";

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

async function main() {
  const documents = await loadKnowledgeDocuments(argument("knowledge-dir"));
  const embedder = new OpenAIEmbeddingProvider();
  const batchSize = optionalPositiveInteger("batch-size") ?? 64;
  if (batchSize > 256) throw new Error("--batch-size cannot exceed 256");

  console.log(
    `Building ${embedder.model}/${embedder.dimensions} RAG index from ${documents.length} documents...`
  );
  const { outputPath, index } = await buildRagIndex({
    documents,
    embedder,
    outputPath: argument("output") || DEFAULT_RAG_INDEX_PATH,
    batchSize,
    chunkSize: 600,
    overlap: 100,
  });
  console.log(
    `Indexed ${index.metadata.chunkCount} chunks from ${index.metadata.documentCount} documents at ${outputPath}`
  );
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
