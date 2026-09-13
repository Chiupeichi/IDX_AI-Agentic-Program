import type { EmbeddingProvider } from "../Week 06 — Embeddings & Vector Search/embeddingProvider";
import {
  OpenAIResponsesGenerator,
  type GroundedAnswerGenerator,
} from "./generator";
import { retrieveRelevantChunks } from "./retrieval";
import type { RagAnswer, RagSource } from "./types";

export async function answerRagQuestion(
  question: string,
  options: {
    topK?: number;
    indexPath?: string;
    embedder?: EmbeddingProvider;
    generator?: GroundedAnswerGenerator;
  } = {}
): Promise<RagAnswer> {
  const retrieved = await retrieveRelevantChunks(question, {
    topK: options.topK ?? 4,
    indexPath: options.indexPath,
    embedder: options.embedder,
  });
  const generator = options.generator ?? new OpenAIResponsesGenerator();
  const answer = await generator.generate(question, retrieved);

  const sources: RagSource[] = [];
  const seen = new Set<string>();
  for (const chunk of retrieved) {
    if (seen.has(chunk.documentId)) continue;
    seen.add(chunk.documentId);
    sources.push({
      id: chunk.documentId,
      title: chunk.title,
      sourcePath: chunk.sourcePath,
    });
  }
  return { answer, sources, retrieved };
}

export function formatRagAnswer(result: RagAnswer) {
  const sourceLines = result.sources.map(
    (source, index) => `${index + 1}. ${source.title}`
  );
  return `${result.answer}\n\nSources:\n${sourceLines.join("\n")}`;
}
