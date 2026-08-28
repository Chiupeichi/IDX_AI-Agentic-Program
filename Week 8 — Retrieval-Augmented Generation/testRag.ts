import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { EmbeddingProvider } from "../Week 6 — Embeddings & Vector Search/embeddingProvider";
import { chunkText } from "./chunking";
import type { GroundedAnswerGenerator } from "./generator";
import { buildGroundedContext } from "./generator";
import { loadKnowledgeDocuments } from "./knowledgeLoader";
import { answerRagQuestion } from "./rag";
import { buildRagIndex, readRagIndex } from "./ragIndex";

const sample = `${"A".repeat(450)}. ${"B".repeat(450)}. ${"C".repeat(450)}`;
const chunks = chunkText(sample, 600, 100);
assert.ok(chunks.length >= 3);
assert.ok(chunks.every((chunk) => chunk.length <= 600));
assert.throws(() => chunkText(sample, 600, 600), /overlap/);

function categoryVector(text: string) {
  const normalized = text.toLowerCase();
  const dom = /\bdom\b|days on market/.test(normalized) ? 4 : 0;
  const schemaTerms = [
    "california_sold",
    "columns",
    "listingkey",
    "closeprice",
    "lotsizesquarefeet",
  ].filter((term) => normalized.includes(term)).length;
  const schema = schemaTerms * 2;
  const ratio = /list-to-close|closeprice\s*\/\s*listprice/.test(normalized)
    ? 6
    : 0;
  return [dom, schema, ratio, 0.1];
}

const embedder: EmbeddingProvider = {
  model: "test-rag-embedding",
  dimensions: 4,
  async embed(texts) {
    return texts.map(categoryVector);
  },
};

const generator: GroundedAnswerGenerator = {
  async generate(question, retrieved) {
    const context = retrieved.map((chunk) => chunk.text).join("\n");
    const normalized = question.toLowerCase();
    if (normalized.includes("dom")) {
      assert.match(context, /DOM means days on market/i);
      return "DOM means days on market: how long a property was marketed before going under contract. [SOURCE real-estate-glossary#1]";
    }
    if (normalized.includes("columns")) {
      assert.match(context, /ListingKey/);
      assert.match(context, /LotSizeSquareFeet/);
      return "california_sold contains 46 verified transaction, pricing, property, agent, location, and date columns, from ListingKey through LotSizeSquareFeet. [SOURCE mls-field-definitions#2]";
    }
    if (normalized.includes("list-to-close")) {
      assert.match(context, /ClosePrice\s*\/\s*ListPrice\s*\*\s*100/);
      return "List-to-close ratio is ClosePrice / ListPrice × 100; 100% is at list, above 100% is above list, and below 100% is below list. [SOURCE real-estate-glossary#3]";
    }
    throw new Error("Unexpected acceptance-test question");
  },
};

const documents = await loadKnowledgeDocuments();
assert.equal(documents.length, 5);
const schemaDocument = documents.find(
  (document) => document.id === "mls-field-definitions"
);
assert.ok(schemaDocument);
assert.match(schemaDocument.content, /46 fields/);
assert.match(schemaDocument.content, /`ListingKey`/);
assert.match(schemaDocument.content, /Trestle Property MetaData/);
const legacySchemaDocument = documents.find(
  (document) => document.id === "handbook-rets-property-schema"
);
assert.ok(legacySchemaDocument);
assert.match(legacySchemaDocument.content, /`L_SystemPrice`/);
assert.match(legacySchemaDocument.content, /`LM_Dec_3`/);
assert.match(legacySchemaDocument.content, /Known limitation/);

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "idx-week8-"));
const indexPath = path.join(temporaryDirectory, "rag-index.json");

try {
  const built = await buildRagIndex({
    documents,
    embedder,
    outputPath: indexPath,
    chunkSize: 600,
    overlap: 100,
    batchSize: 3,
  });
  assert.equal(built.index.metadata.documentCount, 5);
  assert.equal(built.index.metadata.chunkSize, 600);
  assert.equal(built.index.metadata.overlap, 100);

  const stored = await readRagIndex(indexPath);
  assert.equal(stored.metadata.chunkCount, stored.chunks.length);
  assert.ok(stored.chunks.every((chunk) => chunk.text.length <= 600));

  const questions = [
    "What does DOM mean?",
    "What columns are in california_sold?",
    "What is a list-to-close ratio?",
  ];
  for (const question of questions) {
    const result = await answerRagQuestion(question, {
      indexPath,
      topK: 4,
      embedder,
      generator,
    });
    assert.equal(result.retrieved.length, 4);
    assert.ok(result.answer.includes("[SOURCE"));
    assert.ok(result.sources.length >= 1);
    assert.match(buildGroundedContext(result.retrieved), /\[SOURCE .+\]/);
  }

  console.log(
    "Week 8 RAG: PASS (600/100 chunks, cosine top 4, grounded answers, three handbook questions)"
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
