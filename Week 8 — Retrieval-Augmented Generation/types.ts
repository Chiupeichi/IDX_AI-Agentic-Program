export type KnowledgeDocument = {
  id: string;
  title: string;
  sourcePath: string;
  content: string;
};

export type KnowledgeChunk = {
  id: string;
  documentId: string;
  title: string;
  sourcePath: string;
  chunkIndex: number;
  text: string;
};

export type IndexedKnowledgeChunk = KnowledgeChunk & {
  embedding: number[];
};

export type RetrievedChunk = KnowledgeChunk & {
  similarity: number;
};

export type RagSource = {
  id: string;
  title: string;
  sourcePath: string;
};

export type RagAnswer = {
  answer: string;
  sources: RagSource[];
  retrieved: RetrievedChunk[];
};
