import assert from "node:assert/strict";
import {
  parsePropertyQuery,
  type PropertyFilters,
} from "./propertySearch";

const cases: Array<{
  query: string;
  expected: Partial<PropertyFilters>;
}> = [
  {
    query: "Show me 3-bedroom condos in Irvine under $1.5M with a pool.",
    expected: {
      city: "Irvine",
      maxPrice: 1_500_000,
      beds: 3,
      type: "Condominium",
      pool: true,
    },
  },
  {
    query: "Looking for a single family home in Newport Beach under 2m with a view",
    expected: {
      city: "Newport Beach",
      maxPrice: 2_000_000,
      type: "SingleFamilyResidence",
      hasView: true,
    },
  },
  {
    query: "2 bed 2.5 bath townhome in Pasadena at least 1800 sqft",
    expected: {
      city: "Pasadena",
      beds: 2,
      baths: 2.5,
      sqft: 1_800,
      type: "Townhouse",
    },
  },
  {
    query: "Under $800k in San Diego",
    expected: { city: "San Diego", maxPrice: 800_000 },
  },
  {
    query: "3 bedroom house with a pool and view under 950000",
    expected: {
      maxPrice: 950_000,
      beds: 3,
      type: "SingleFamilyResidence",
      pool: true,
      hasView: true,
    },
  },
  {
    query: "Condo in Los Angeles",
    expected: { city: "Los Angeles", type: "Condominium" },
  },
  {
    query: "5 bed 4 bath single family in Beverly Hills under $10,000,000 with pool and view",
    expected: {
      city: "Beverly Hills",
      maxPrice: 10_000_000,
      beds: 5,
      baths: 4,
      type: "SingleFamilyResidence",
      pool: true,
      hasView: true,
    },
  },
  {
    query: "2500 square feet land parcel in Riverside",
    expected: {
      city: "Riverside",
      sqft: 2_500,
      type: "UnimprovedLand",
    },
  },
  {
    query: "Townhouse under 1.2m in Irvine with 3 bedrooms and 2 baths",
    expected: {
      city: "Irvine",
      maxPrice: 1_200_000,
      beds: 3,
      baths: 2,
      type: "Townhouse",
    },
  },
  {
    query: "Show me homes near Irvine",
    expected: { city: "Irvine" },
  },
  {
    query: "Show me 2b2b near USC",
    expected: { near: "USC", city: null, beds: 2, baths: 2 },
  },
  {
    query: "我想找 USC 附近的 2b2b",
    expected: { near: "USC", city: null, beds: 2, baths: 2 },
  },
];

for (const { query, expected } of cases) {
  const actual = parsePropertyQuery(query);
  for (const [key, expectedValue] of Object.entries(expected)) {
    assert.deepEqual(
      actual[key as keyof PropertyFilters],
      expectedValue,
      `${query}: unexpected ${key}`
    );
  }
}

console.log(`Week 2 parser: ${cases.length}/${cases.length} cases passed.`);
