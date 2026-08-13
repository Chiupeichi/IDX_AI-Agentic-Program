import type { KnowledgeChunk, KnowledgeDocument } from "./types";

export function chunkText(text: string, chunkSize = 600, overlap = 100) {
  if (!Number.isInteger(chunkSize) || chunkSize < 100) {
    throw new RangeError("chunkSize must be an integer of at least 100 characters");
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new RangeError("overlap must be a non-negative integer smaller than chunkSize");
  }

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(start + chunkSize, normalized.length);
    if (end < normalized.length) {
      const paragraphBoundary = normalized.lastIndexOf("\n\n", end);
      const sentenceBoundary = Math.max(
        normalized.lastIndexOf(". ", end),
        normalized.lastIndexOf("? ", end),
        normalized.lastIndexOf("! ", end)
      );
      const boundary = Math.max(paragraphBoundary, sentenceBoundary);
      if (boundary > start + Math.floor(chunkSize * 0.6)) {
        end = boundary + (boundary === paragraphBoundary ? 0 : 1);
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}

export function chunkDocuments(
  documents: readonly KnowledgeDocument[],
  options: { chunkSize?: number; overlap?: number } = {}
): KnowledgeChunk[] {
  const seenIds = new Set<string>();
  const chunks: KnowledgeChunk[] = [];
  for (const document of documents) {
    if (!document.id.trim() || seenIds.has(document.id)) {
      throw new Error(`Knowledge document ID must be unique: ${document.id}`);
    }
    seenIds.add(document.id);
    chunkText(document.content, options.chunkSize, options.overlap).forEach(
      (text, chunkIndex) => {
        chunks.push({
          id: `${document.id}#${chunkIndex + 1}`,
          documentId: document.id,
          title: document.title,
          sourcePath: document.sourcePath,
          chunkIndex,
          text,
        });
      }
    );
  }
  return chunks;
}
