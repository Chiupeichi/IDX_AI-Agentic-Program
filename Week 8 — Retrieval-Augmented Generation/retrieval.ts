import {
  cosineSimilarity,
  OpenAIEmbeddingProvider,
  type EmbeddingProvider,
} from "../Week 6 — Embeddings & Vector Search/embeddingProvider";
import {
  DEFAULT_RAG_INDEX_PATH,
  readRagIndex,
  type RagIndex,
} from "./ragIndex";
import type { RetrievedChunk } from "./types";

function validateTopK(topK: number) {
  if (!Number.isInteger(topK) || topK < 1 || topK > 20) {
    throw new RangeError("topK must be an integer between 1 and 20");
  }
}

export function rankKnowledgeChunks(
  queryEmbedding: readonly number[],
  index: RagIndex,
  topK = 4
): RetrievedChunk[] {
  validateTopK(topK);
  return index.chunks
    .map(({ embedding, ...chunk }) => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, embedding),
    }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, topK);
}

export async function retrieveRelevantChunks(
  question: string,
  options: {
    topK?: number;
    indexPath?: string;
    embedder?: EmbeddingProvider;
  } = {}
) {
  const normalizedQuestion = question.trim();
  if (!normalizedQuestion) throw new Error("question is required");
  const topK = options.topK ?? 4;
  validateTopK(topK);
  const index = await readRagIndex(options.indexPath ?? DEFAULT_RAG_INDEX_PATH);
  const embedder =
    options.embedder ??
    new OpenAIEmbeddingProvider({
      model: index.metadata.model,
      dimensions: index.metadata.dimensions,
    });
  if (
    embedder.model !== index.metadata.model ||
    embedder.dimensions !== index.metadata.dimensions
  ) {
    throw new Error(
      `RAG index uses ${index.metadata.model}/${index.metadata.dimensions}; query provider must match`
    );
  }

  const [queryEmbedding] = await embedder.embed([normalizedQuestion]);
  return rankKnowledgeChunks(queryEmbedding, index, topK);
}
