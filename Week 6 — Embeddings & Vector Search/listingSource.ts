import { query } from "../Week 3 – MLS Database Integration/mysql";
import type { EmbeddingListing } from "./listingText";

type RawEmbeddingListing = {
  listingId: string;
  displayId: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  price: number | string | null;
  beds: number | string | null;
  baths: number | string | null;
  sqft: number | string | null;
  propertyType: string | null;
  yearBuilt: number | string | null;
  photoCount: number | string | null;
  remarks: string;
};

function asNumber(value: number | string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cityClause(city: string | undefined) {
  const normalized = city?.trim();
  return normalized
    ? { sql: " AND L_City = ?", params: [normalized] }
    : { sql: "", params: [] as string[] };
}

export async function countIndexableListings(city?: string) {
  const filter = cityClause(city);
  const rows = await query<{ count: number | string }>(
    `
      SELECT COUNT(*) AS count
      FROM rets_property
      WHERE L_Status = 'Active'
        AND L_Class = 'Residential'
        AND L_Remarks IS NOT NULL
        AND TRIM(L_Remarks) <> ''
        ${filter.sql}
    `,
    filter.params
  );
  return Number(rows[0]?.count ?? 0);
}

export async function fetchIndexableListings(
  offset: number,
  limit: number,
  city?: string
): Promise<EmbeddingListing[]> {
  if (!Number.isInteger(offset) || offset < 0) {
    throw new RangeError("offset must be a non-negative integer");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 256) {
    throw new RangeError("limit must be an integer between 1 and 256");
  }

  const filter = cityClause(city);
  const rows = await query<RawEmbeddingListing>(
    `
      SELECT
        CAST(L_ListingID AS CHAR) AS listingId,
        COALESCE(L_DisplayId, '') AS displayId,
        COALESCE(L_Address, '') AS address,
        COALESCE(L_City, '') AS city,
        COALESCE(L_Zip, '') AS zip,
        L_SystemPrice AS price,
        L_Keyword2 AS beds,
        LM_Dec_3 AS baths,
        LM_Int2_3 AS sqft,
        COALESCE(L_Type_, '') AS propertyType,
        YearBuilt AS yearBuilt,
        PhotoCount AS photoCount,
        L_Remarks AS remarks
      FROM rets_property
      WHERE L_Status = 'Active'
        AND L_Class = 'Residential'
        AND L_Remarks IS NOT NULL
        AND TRIM(L_Remarks) <> ''
        ${filter.sql}
      ORDER BY id
      LIMIT ? OFFSET ?
    `,
    [...filter.params, limit, offset]
  );

  return rows.map((row) => ({
    listingId: String(row.listingId),
    displayId: row.displayId ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    zip: row.zip ?? "",
    price: asNumber(row.price),
    beds: asNumber(row.beds),
    baths: asNumber(row.baths),
    sqft: asNumber(row.sqft),
    propertyType: row.propertyType ?? "",
    yearBuilt: asNumber(row.yearBuilt),
    photoCount: asNumber(row.photoCount),
    remarks: row.remarks,
  }));
}
