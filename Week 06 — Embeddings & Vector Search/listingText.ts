export type EmbeddingListing = {
  listingId: string;
  displayId: string;
  address: string;
  city: string;
  zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: string;
  yearBuilt: number;
  photoCount: number;
  remarks: string;
};

export type IndexedListing = Omit<EmbeddingListing, "remarks">;

function display(value: string | number | null | undefined, fallback = "unknown") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

export function buildListingEmbeddingText(listing: EmbeddingListing) {
  return [
    `${display(listing.propertyType, "Property")} in ${display(listing.city)}, California.`,
    `${display(listing.beds)} beds, ${display(listing.baths)} baths, ${display(listing.sqft)} square feet.`,
    `Built ${display(listing.yearBuilt)}. Price $${display(listing.price)}.`,
    listing.remarks,
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8_000);
}

export function withoutRemarks(listing: EmbeddingListing): IndexedListing {
  const { remarks: _remarks, ...indexed } = listing;
  return indexed;
}
