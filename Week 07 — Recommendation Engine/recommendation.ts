import {
  cosineSimilarity,
} from "../Week 06 — Embeddings & Vector Search/embeddingProvider";
import {
  DEFAULT_INDEX_PATH,
  readIndexEntries,
} from "../Week 06 — Embeddings & Vector Search/indexStore";
import type { IndexedListing } from "../Week 06 — Embeddings & Vector Search/listingText";

export type HybridScore = {
  structuredScore: number;
  semanticScore: number;
  semanticSimilarity: number;
  totalScore: number;
};

export type CompValidation = {
  averagePricePerSqft: number | null;
  compPrice: number | null;
  listPrice: number;
  compCount: number;
  deltaPct: number | null;
  assessment: "below comps" | "within comp range" | "above comps" | "insufficient comps";
};

export type CompValidator = (
  city: string,
  sqft: number,
  price: number
) => Promise<CompValidation>;

export type Recommendation = {
  listing: IndexedListing;
  score: HybridScore;
  compValidation: CompValidation;
};

function rounded(value: number) {
  return Number(value.toFixed(2));
}

export function calculateHybridScore(
  target: IndexedListing,
  candidate: IndexedListing,
  targetEmbedding: readonly number[],
  candidateEmbedding: readonly number[]
): HybridScore {
  let structuredScore = 0;

  if (target.price > 0 && candidate.price > 0) {
    const priceDifference = Math.abs(target.price - candidate.price);
    if (priceDifference < 50_000) structuredScore += 20;
    else if (priceDifference < 150_000) structuredScore += 12;
    else if (priceDifference < 300_000) structuredScore += 5;
  }

  if (target.beds > 0 && target.beds === candidate.beds) structuredScore += 15;
  if (
    target.city.trim() &&
    target.city.localeCompare(candidate.city, undefined, { sensitivity: "accent" }) === 0
  ) {
    structuredScore += 15;
  }

  if (target.sqft > 0 && candidate.sqft > 0) {
    const sqftDifference = Math.abs(target.sqft - candidate.sqft);
    if (sqftDifference < 300) structuredScore += 10;
    else if (sqftDifference < 700) structuredScore += 5;
  }

  const semanticSimilarity = Math.max(
    0,
    Math.min(1, cosineSimilarity(targetEmbedding, candidateEmbedding))
  );
  const semanticScore = semanticSimilarity * 40;

  return {
    structuredScore,
    semanticScore: rounded(semanticScore),
    semanticSimilarity: rounded(semanticSimilarity),
    totalScore: rounded(structuredScore + semanticScore),
  };
}

export async function validateWithComps(
  city: string,
  sqft: number,
  price: number
): Promise<CompValidation> {
  const normalizedCity = city.trim();
  if (!normalizedCity) throw new Error("city is required for comp validation");
  if (!Number.isFinite(sqft) || sqft <= 0) {
    throw new Error("sqft must be positive for comp validation");
  }
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("price must be positive for comp validation");
  }

  const { query } = await import("../Week 03 — MLS Database Integration/mysql");
  const rows = await query<{
    averagePricePerSqft: number | string | null;
    compCount: number | string;
  }>(
    `
      SELECT
        AVG(ClosePrice / NULLIF(LivingArea, 0)) AS averagePricePerSqft,
        COUNT(*) AS compCount
      FROM california_sold
      WHERE City = ?
        AND PropertyType = 'Residential'
        AND ClosePrice > 0
        AND LivingArea BETWEEN ? AND ?
        AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND CloseDate <= CURDATE()
    `,
    [normalizedCity, sqft * 0.8, sqft * 1.2]
  );

  const averagePricePerSqft =
    rows[0]?.averagePricePerSqft === null ||
    rows[0]?.averagePricePerSqft === undefined
      ? null
      : Number(rows[0].averagePricePerSqft);
  const compCount = Number(rows[0]?.compCount ?? 0);
  if (!averagePricePerSqft || compCount === 0) {
    return {
      averagePricePerSqft: null,
      compPrice: null,
      listPrice: price,
      compCount,
      deltaPct: null,
      assessment: "insufficient comps",
    };
  }

  const compPrice = Math.round(averagePricePerSqft * sqft);
  const deltaPct = Number((((price - compPrice) / compPrice) * 100).toFixed(1));
  const assessment =
    deltaPct > 10
      ? "above comps"
      : deltaPct < -10
        ? "below comps"
        : "within comp range";

  return {
    averagePricePerSqft: Number(averagePricePerSqft.toFixed(2)),
    compPrice,
    listPrice: price,
    compCount,
    deltaPct,
    assessment,
  };
}

async function findTargetListing(listingId: string, indexPath: string) {
  let target:
    | { listing: IndexedListing; embedding: number[] }
    | undefined;
  for await (const entry of readIndexEntries(indexPath)) {
    if (entry.listing.listingId === listingId) {
      target = { listing: entry.listing, embedding: entry.embedding };
    }
  }
  if (!target) {
    throw new Error(
      `Listing ${listingId} is not in the embedding index. Rebuild the index if it is newly active.`
    );
  }
  return target;
}

export async function recommendSimilarListings(
  listingId: string,
  options: {
    topK?: number;
    indexPath?: string;
    compValidator?: CompValidator;
  } = {}
): Promise<{ target: IndexedListing; recommendations: Recommendation[] }> {
  const normalizedId = listingId.trim();
  if (!normalizedId) throw new Error("listingId is required");
  const topK = options.topK ?? 5;
  if (!Number.isInteger(topK) || topK < 1 || topK > 50) {
    throw new RangeError("topK must be an integer between 1 and 50");
  }

  const indexPath = options.indexPath ?? DEFAULT_INDEX_PATH;
  const target = await findTargetListing(normalizedId, indexPath);
  const ranked: { listing: IndexedListing; score: HybridScore }[] = [];

  for await (const candidate of readIndexEntries(indexPath)) {
    if (candidate.listing.listingId === normalizedId) continue;
    ranked.push({
      listing: candidate.listing,
      score: calculateHybridScore(
        target.listing,
        candidate.listing,
        target.embedding,
        candidate.embedding
      ),
    });
    ranked.sort((left, right) => right.score.totalScore - left.score.totalScore);
    if (ranked.length > topK) ranked.pop();
  }

  const compValidator = options.compValidator ?? validateWithComps;
  const recommendations = await Promise.all(
    ranked.map(async ({ listing, score }) => ({
      listing,
      score,
      compValidation: await compValidator(
        listing.city,
        listing.sqft,
        listing.price
      ),
    }))
  );
  return { target: target.listing, recommendations };
}

function money(value: number | null) {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRecommendations(
  target: IndexedListing,
  recommendations: readonly Recommendation[]
) {
  if (recommendations.length === 0) {
    return `No comparable active listings were found for ${target.address}.`;
  }

  const cards = recommendations.map(({ listing, score, compValidation }, index) => {
    const delta =
      compValidation.deltaPct === null
        ? "N/A"
        : `${compValidation.deltaPct > 0 ? "+" : ""}${compValidation.deltaPct.toFixed(1)}%`;
    return `${index + 1}. 🏠 ${listing.address}
📍 ${listing.city}, ${listing.zip}
💰 ${money(listing.price)} | 🛏 ${listing.beds} | 🛁 ${listing.baths} | 📐 ${listing.sqft} sqft
Hybrid match: ${score.totalScore.toFixed(1)}/100 (${score.structuredScore} structured + ${score.semanticScore.toFixed(1)} semantic)
Comp value: ${money(compValidation.compPrice)} | ${delta} | ${compValidation.assessment} (${compValidation.compCount} comps)
Listing ID: ${listing.listingId}`;
  });

  return `Similar listings to ${target.address}:\n\n${cards.join("\n\n")}`;
}
