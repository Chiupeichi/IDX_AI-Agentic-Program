import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  cosineSimilarity,
  type EmbeddingProvider,
} from "./embeddingProvider";
import { buildEmbeddingIndex, readIndexMetadata } from "./indexStore";
import type { EmbeddingListing } from "./listingText";
import { semanticPropertySearch } from "./semanticSearch";

function vectorFor(text: string) {
  const normalized = text.toLowerCase();
  if (/craftsman|mountain|character/.test(normalized)) return [1, 0, 0];
  if (/modern|pool/.test(normalized)) return [0, 1, 0];
  if (/ocean|coastal/.test(normalized)) return [0, 0, 1];
  return [0.2, 0.2, 0.2];
}

const embedder: EmbeddingProvider = {
  model: "test-embedding",
  dimensions: 3,
  async embed(texts) {
    return texts.map(vectorFor);
  },
};

const fixtures: EmbeddingListing[] = [
  ["A", "Charming craftsman with original character and mountain views"],
  ["B", "Modern new construction with a private pool"],
  ["C", "Coastal condominium with panoramic ocean views"],
  ["D", "Quiet ranch home with a large yard"],
  ["E", "Updated townhouse close to shopping"],
  ["F", "Craftsman bungalow with historic character"],
].map(([listingId, remarks], index) => ({
  listingId,
  displayId: `MLS-${listingId}`,
  address: `${index + 1} Test Street`,
  city: "Pasadena",
  zip: "91101",
  price: 800_000 + index * 25_000,
  beds: 3,
  baths: 2,
  sqft: 1_500 + index * 50,
  propertyType: "SingleFamilyResidence",
  yearBuilt: 1920 + index,
  photoCount: 20,
  remarks,
}));

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "idx-week6-"));
const indexPath = path.join(temporaryDirectory, "index.jsonl");

try {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.throws(() => cosineSimilarity([1], [1, 2]), /same non-zero dimensions/);

  await buildEmbeddingIndex({
    embedder,
    listingCount: fixtures.length,
    batchSize: 2,
    outputPath: indexPath,
    fetchListings: async (offset, limit) => fixtures.slice(offset, offset + limit),
  });

  const metadata = await readIndexMetadata(indexPath);
  assert.equal(metadata.listingCount, 6);
  assert.equal(metadata.dimensions, 3);

  const results = await semanticPropertySearch(
    "a character home with mountain scenery",
    { indexPath, embedder, topK: 5 }
  );
  assert.equal(results.length, 5);
  assert.equal(results[0].listing.listingId, "A");
  assert.ok(results[0].similarity > results[2].similarity);
  assert.ok(results.every((result) => result.listing.listingId));

  await assert.rejects(
    () => semanticPropertySearch(" ", { indexPath, embedder }),
    /description is required/
  );

  console.log("Week 6 semantic search: PASS (top 5 cosine-ranked active listings)");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
