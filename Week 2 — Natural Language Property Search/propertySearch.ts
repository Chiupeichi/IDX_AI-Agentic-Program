export type PropertyFilters = {
  city: string | null;
  near: string | null;
  maxPrice: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  type: string | null;
  pool: boolean | null;
  hasView: boolean | null;
};

const landmarkPatterns = [
  {
    pattern: /\b(?:USC|University of Southern California)\b|南加大/i,
    value: "USC",
  },
] as const;

const propertyTypes = [
  { pattern: /\bcondos?\b/i, value: "Condominium" },
  { pattern: /\b(?:town\s*homes?|townhouses?)\b/i, value: "Townhouse" },
  {
    pattern: /\b(?:single[-\s]+family|detached\s+house|house)\b/i,
    value: "SingleFamilyResidence",
  },
  { pattern: /\b(?:land|lots?|parcels?)\b/i, value: "UnimprovedLand" },
] as const;

function parsePrice(query: string) {
  const match = query.match(
    /\b(?:under|below|max(?:imum)?|up\s+to)\s*\$?\s*([\d,.]+)\s*(k|m|million|thousand)?\b/i
  );
  if (!match) {
    return null;
  }

  let price = Number(match[1].replace(/,/g, ""));
  const suffix = match[2]?.toLowerCase();
  if (suffix === "k" || suffix === "thousand") {
    price *= 1_000;
  } else if (suffix === "m" || suffix === "million") {
    price *= 1_000_000;
  }

  return Number.isFinite(price) ? price : null;
}

export function parsePropertyQuery(query: string): PropertyFilters {
  const landmark = landmarkPatterns.find(({ pattern }) => pattern.test(query));
  const cityMatch = query.match(
    /\b(?:in|near|around)\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*)*?)(?=\s+(?:under|below|with|at|for|and|that|having)\b|[,.!?]|$)/i
  );
  const compactBedBathMatch = query.match(/(?:^|\s)(\d+)\s*b\s*(\d+(?:\.\d+)?)\s*b(?:\s|$)/i);
  const chineseBedBathMatch = query.match(/(\d+)\s*房\s*(\d+(?:\.\d+)?)\s*(?:衛|浴)/);
  const shorthandMatch = compactBedBathMatch ?? chineseBedBathMatch;
  const bedsMatch = query.match(/(\d+)\s*[- ]*bed(?:room)?s?\b/i);
  const bathsMatch = query.match(/(\d+(?:\.\d+)?)\s*[- ]*bath(?:room)?s?\b/i);
  const sqftMatch = query.match(/([\d,]+)\s*(?:sqft|sq\s*ft|square\s+feet)\b/i);
  const propertyType = propertyTypes.find(({ pattern }) => pattern.test(query));

  return {
    city: landmark ? null : cityMatch?.[1]?.trim() || null,
    near: landmark?.value || null,
    maxPrice: parsePrice(query),
    beds: shorthandMatch ? Number(shorthandMatch[1]) : bedsMatch ? Number(bedsMatch[1]) : null,
    baths: shorthandMatch
      ? Number(shorthandMatch[2])
      : bathsMatch
        ? Number(bathsMatch[1])
        : null,
    sqft: sqftMatch ? Number(sqftMatch[1].replace(/,/g, "")) : null,
    type: propertyType?.value || null,
    pool: /\bpool\b/i.test(query) ? true : null,
    hasView: /\bviews?\b/i.test(query) ? true : null,
  };
}
