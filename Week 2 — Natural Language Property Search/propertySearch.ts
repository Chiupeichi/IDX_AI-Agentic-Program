export async function parsePropertyQuery(query: string) {
  const cityMatch = query.match(/in\s+([A-Za-z\s]+?)(?:\s+under|\s+with|\s+at|$)/i);
  const priceMatch = query.match(/under\s+\$?([\d,.]+)(k|m)?/i);
  const bedsMatch = query.match(/(\d+)[\s-]*(bed|beds|bedroom|bedrooms)/i);
  const bathsMatch = query.match(/(\d+(?:\.\d+)?)[\s-]*(bath|baths|bathroom|bathrooms)/i);
  const sqftMatch = query.match(/(\d+)\s*(sqft|sq ft|square feet)/i);
  const poolMatch = /pool/i.test(query);
  const viewMatch = /view/i.test(query);

  const typeMap: Record<string, string> = {
    condo: "Condominium",
    townhouse: "Townhouse",
    "single family": "SingleFamilyResidence",
    land: "UnimprovedLand",
  };

  const typeKey = Object.keys(typeMap).find((k) =>
    query.toLowerCase().includes(k)
  );

  let maxPrice = null;
  if (priceMatch) {
    maxPrice = Number(priceMatch[1].replace(/,/g, ""));
    if (priceMatch[2]?.toLowerCase() === "k") maxPrice *= 1000;
    if (priceMatch[2]?.toLowerCase() === "m") maxPrice *= 1_000_000;
  }

  return {
    city: cityMatch?.[1]?.trim() || null,
    maxPrice,
    beds: bedsMatch ? Number(bedsMatch[1]) : null,
    baths: bathsMatch ? Number(bathsMatch[1]) : null,
    sqft: sqftMatch ? Number(sqftMatch[1]) : null,
    type: typeKey ? typeMap[typeKey] : null,
    pool: poolMatch ? true : null,
    hasView: viewMatch ? true : null,
  };
}

// ── Week 2 Validation: 10 test queries ──
const testQueries = [
  "Show me 3-bedroom condos in Irvine under $1.5M with a pool.",
  "Looking for a single family home in Newport Beach under 2m with a view",
  "2 bed 2.5 bath townhome in Pasadena at least 1800 sqft",
  "Under $800k in San Diego",
  "3 bedroom house with a pool and view under 950000",
  "Condo in Los Angeles",
  "5 bed 4 bath single family in Beverly Hills under $10,000,000 with pool and view",
  "2500 square feet land parcel in Riverside",
  "Townhouse under 1.2m in Irvine with 3 bedrooms and 2 baths",
  "Show me homes near Irvine",
];

async function runTests() {
  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    const result = await parsePropertyQuery(query);
    console.log(`\nTest ${i + 1}: "${query}"`);
    console.log(JSON.stringify(result, null, 2));
  }
}

runTests();
