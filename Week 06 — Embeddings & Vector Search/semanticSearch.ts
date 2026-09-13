import {
  cosineSimilarity,
  OpenAIEmbeddingProvider,
  type EmbeddingProvider,
} from "./embeddingProvider";
import {
  DEFAULT_INDEX_PATH,
  readIndexEntries,
  readIndexMetadata,
} from "./indexStore";
import type { IndexedListing } from "./listingText";

export type SemanticSearchResult = {
  listing: IndexedListing;
  similarity: number;
};

function validateTopK(topK: number) {
  if (!Number.isInteger(topK) || topK < 1 || topK > 50) {
    throw new RangeError("topK must be an integer between 1 and 50");
  }
}

export function rankByCosineSimilarity(
  queryEmbedding: readonly number[],
  candidates: readonly { listing: IndexedListing; embedding: readonly number[] }[],
  topK = 5
) {
  validateTopK(topK);
  return candidates
    .map(({ listing, embedding }) => ({
      listing,
      similarity: cosineSimilarity(queryEmbedding, embedding),
    }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, topK);
}

export async function semanticPropertySearch(
  description: string,
  options: {
    topK?: number;
    indexPath?: string;
    embedder?: EmbeddingProvider;
  } = {}
): Promise<SemanticSearchResult[]> {
  const normalizedDescription = description.trim();
  if (!normalizedDescription) throw new Error("description is required");
  const topK = options.topK ?? 5;
  validateTopK(topK);
  const indexPath = options.indexPath ?? DEFAULT_INDEX_PATH;
  const metadata = await readIndexMetadata(indexPath);
  const embedder =
    options.embedder ??
    new OpenAIEmbeddingProvider({
      model: metadata.model,
      dimensions: metadata.dimensions,
    });

  if (
    embedder.model !== metadata.model ||
    embedder.dimensions !== metadata.dimensions
  ) {
    throw new Error(
      `Embedding index uses ${metadata.model}/${metadata.dimensions}; query provider must match`
    );
  }

  const [queryEmbedding] = await embedder.embed([normalizedDescription]);
  const best: SemanticSearchResult[] = [];
  for await (const entry of readIndexEntries(indexPath)) {
    best.push({
      listing: entry.listing,
      similarity: cosineSimilarity(queryEmbedding, entry.embedding),
    });
    best.sort((left, right) => right.similarity - left.similarity);
    if (best.length > topK) best.pop();
  }
  return best;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSemanticResults(
  description: string,
  results: readonly SemanticSearchResult[]
) {
  if (results.length === 0) {
    return `No semantically similar active listings were found for "${description}".`;
  }

  const cards = results.map(
    ({ listing, similarity }, index) => `${index + 1}. 🏠 ${listing.address}
📍 ${listing.city}, ${listing.zip}
💰 ${money(listing.price)} | 🛏 ${listing.beds} | 🛁 ${listing.baths} | 📐 ${listing.sqft} sqft
Semantic match: ${(similarity * 100).toFixed(1)}% | Listing ID: ${listing.listingId}`
  );
  return `Top ${results.length} semantic matches for "${description}":\n\n${cards.join("\n\n")}`;
}
