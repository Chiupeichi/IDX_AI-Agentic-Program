import { query } from "./mysql";

export type PropertyFilters = {
  city?: string | null;
  near?: string | null;
  maxPrice?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  type?: string | null;
  pool?: boolean | null;
  hasView?: boolean | null;
};

export type ListingRow = {
  L_ListingID: string;
  L_DisplayId: string;
  L_Address: string;
  L_City: string;
  L_Zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  status: string;
  lat: number;
  lng: number;
  YearBuilt: number;
  AssociationFee: number;
  DaysOnMarket: number;
  PoolPrivateYN: string;
  ViewYN: string;
  FireplaceYN: string;
  PhotoCount: number;
  LA1_UserFirstName: string;
  LA1_UserLastName: string;
  LO1_OrganizationName: string;
  distanceMiles: number | null;
};

const landmarks: Record<
  string,
  { latitude: number; longitude: number; defaultRadiusMiles: number }
> = {
  USC: {
    latitude: 34.0224,
    longitude: -118.2851,
    defaultRadiusMiles: 5,
  },
};

export async function searchActiveListings(
  filters: PropertyFilters,
  page = 1,
  limit = 10
) {
  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError("page must be a positive integer");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new RangeError("limit must be an integer between 1 and 50");
  }

  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) {
    throw new RangeError("pagination offset is too large");
  }

  const landmark = filters.near ? landmarks[filters.near.toUpperCase()] : undefined;
  if (filters.near && !landmark) {
    throw new Error(`Unsupported landmark: ${filters.near}`);
  }

  const distanceSelect = landmark
    ? `,
      3959 * ACOS(LEAST(1,
        COS(RADIANS(?)) * COS(RADIANS(LMD_MP_Latitude)) *
        COS(RADIANS(LMD_MP_Longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(LMD_MP_Latitude))
      )) AS distanceMiles`
    : ", NULL AS distanceMiles";

  let sql = `
    SELECT
      L_ListingID,
      L_DisplayId,
      L_Address,
      L_City,
      L_Zip,
      L_SystemPrice AS price,
      L_Keyword2 AS beds,
      LM_Dec_3 AS baths,
      LM_Int2_3 AS sqft,
      L_Type_ AS type,
      L_Status AS status,
      LMD_MP_Latitude AS lat,
      LMD_MP_Longitude AS lng,
      YearBuilt,
      AssociationFee,
      DaysOnMarket,
      PoolPrivateYN,
      ViewYN,
      FireplaceYN,
      PhotoCount,
      LA1_UserFirstName,
      LA1_UserLastName,
      LO1_OrganizationName
      ${distanceSelect}
    FROM rets_property
    WHERE L_Status = "Active"
  `;

  const params: unknown[] = landmark
    ? [landmark.latitude, landmark.longitude, landmark.latitude]
    : [];

  if (filters.type !== "UnimprovedLand") {
    sql += " AND L_Class = 'Residential'";
  }

  if (filters.city) {
    sql += " AND L_City = ?";
    params.push(filters.city);
  }

  if (filters.maxPrice) {
    sql += " AND L_SystemPrice <= ?";
    params.push(filters.maxPrice);
  }

  if (filters.beds) {
    sql += " AND L_Keyword2 >= ?";
    params.push(filters.beds);
  }

  if (filters.baths) {
    sql += " AND LM_Dec_3 >= ?";
    params.push(filters.baths);
  }

  if (filters.sqft) {
    sql += " AND LM_Int2_3 >= ?";
    params.push(filters.sqft);
  }

  if (filters.type) {
    sql += " AND L_Type_ = ?";
    params.push(filters.type);
  }

  if (filters.pool) {
    sql += " AND PoolPrivateYN IN ('1', 'True', 'true', 'Y', 'Yes')";
  }

  if (filters.hasView) {
    sql += " AND ViewYN IN ('1', 'True', 'true', 'Y', 'Yes')";
  }

  if (landmark) {
    sql += `
      AND LMD_MP_Latitude IS NOT NULL
      AND LMD_MP_Longitude IS NOT NULL
      HAVING distanceMiles <= ?
    `;
    params.push(landmark.defaultRadiusMiles);
  }

  sql += landmark
    ? " ORDER BY distanceMiles ASC, L_SystemPrice ASC LIMIT ? OFFSET ?"
    : " ORDER BY L_SystemPrice ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  return query<ListingRow>(sql, params);
}

export function formatListingCard(home: ListingRow, index?: number) {
  const prefix = index === undefined ? "" : `${index + 1}. `;
  const distance =
    home.distanceMiles === null || home.distanceMiles === undefined
      ? ""
      : `\n📍 ${Number(home.distanceMiles).toFixed(1)} miles from landmark`;
  return `${prefix}🏠 ${home.L_Address}
📍 ${home.L_City}, ${home.L_Zip}
💰 $${Number(home.price).toLocaleString()}
🛏 ${home.beds} beds | 🛁 ${home.baths} baths
📐 ${home.sqft} sqft${distance}
📷 ${home.PhotoCount ?? 0} photos`;
}
