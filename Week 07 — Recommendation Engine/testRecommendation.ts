import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { EmbeddingProvider } from "../Week 06 — Embeddings & Vector Search/embeddingProvider";
import { buildEmbeddingIndex } from "../Week 06 — Embeddings & Vector Search/indexStore";
import type {
  EmbeddingListing,
  IndexedListing,
} from "../Week 06 — Embeddings & Vector Search/listingText";
import {
  calculateHybridScore,
  recommendSimilarListings,
} from "./recommendation";

const target: IndexedListing = {
  listingId: "TARGET",
  displayId: "MLS-TARGET",
  address: "100 Target Street",
  city: "Pasadena",
  zip: "91101",
  price: 1_000_000,
  beds: 3,
  baths: 2,
  sqft: 1_800,
  propertyType: "SingleFamilyResidence",
  yearBuilt: 1925,
  photoCount: 25,
};

const identical = { ...target, listingId: "MATCH", address: "101 Match Street" };
const perfectScore = calculateHybridScore(target, identical, [1, 0], [1, 0]);
assert.equal(perfectScore.structuredScore, 60);
assert.equal(perfectScore.semanticScore, 40);
assert.equal(perfectScore.totalScore, 100);

const semanticOnly = calculateHybridScore(
  target,
  {
    ...target,
    listingId: "SEMANTIC",
    city: "Irvine",
    price: 2_000_000,
    beds: 5,
    sqft: 3_500,
  },
  [1, 0],
  [1, 0]
);
assert.equal(semanticOnly.structuredScore, 0);
assert.equal(semanticOnly.totalScore, 40);

const fixtures: EmbeddingListing[] = [
  { ...target, remarks: "Historic craftsman with mountain views" },
  { ...identical, remarks: "Historic craftsman with mountain views" },
  {
    ...target,
    listingId: "C2",
    address: "102 Similar Street",
    price: 1_080_000,
    sqft: 1_950,
    remarks: "Character home with mountain scenery",
  },
  {
    ...target,
    listingId: "C3",
    address: "103 Pool Street",
    price: 1_200_000,
    remarks: "Modern home with pool",
  },
  {
    ...target,
    listingId: "C4",
    address: "104 Ocean Street",
    city: "Long Beach",
    remarks: "Oceanfront coastal residence",
  },
  {
    ...target,
    listingId: "C5",
    address: "105 Ranch Street",
    beds: 4,
    remarks: "Traditional ranch home",
  },
  {
    ...target,
    listingId: "C6",
    address: "106 Garden Street",
    price: 1_400_000,
    remarks: "Private garden retreat",
  },
];

function vectorFor(text: string) {
  const normalized = text.toLowerCase();
  if (/craftsman|mountain|character/.test(normalized)) return [1, 0, 0];
  if (/modern|pool/.test(normalized)) return [0, 1, 0];
  return [0.2, 0.2, 0.2];
}

const embedder: EmbeddingProvider = {
  model: "test-embedding",
  dimensions: 3,
  async embed(texts) {
    return texts.map(vectorFor);
  },
};

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "idx-week7-"));
const indexPath = path.join(temporaryDirectory, "index.jsonl");

try {
  await buildEmbeddingIndex({
    embedder,
    listingCount: fixtures.length,
    batchSize: 3,
    outputPath: indexPath,
    fetchListings: async (offset, limit) => fixtures.slice(offset, offset + limit),
  });

  const result = await recommendSimilarListings("TARGET", {
    indexPath,
    topK: 5,
    compValidator: async (_city, sqft, price) => ({
      averagePricePerSqft: 500,
      compPrice: sqft * 500,
      listPrice: price,
      compCount: 12,
      deltaPct: Number((((price - sqft * 500) / (sqft * 500)) * 100).toFixed(1)),
      assessment: "within comp range",
    }),
  });

  assert.equal(result.recommendations.length, 5);
  assert.equal(result.recommendations[0].listing.listingId, "MATCH");
  assert.ok(
    result.recommendations.every(
      (recommendation) => recommendation.listing.listingId !== "TARGET"
    )
  );
  assert.ok(
    result.recommendations.every(
      (recommendation, index) =>
        index === 0 ||
        result.recommendations[index - 1].score.totalScore >=
          recommendation.score.totalScore
    )
  );
  assert.ok(result.recommendations.every((item) => item.compValidation.compCount === 12));

  console.log("Week 7 recommendation engine: PASS (hybrid top 5 + comp validation)");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
