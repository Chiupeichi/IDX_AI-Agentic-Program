import { query } from "./mysql";

export type PropertyFilters = {
  city?: string | null;
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
};

export async function searchActiveListings(
  filters: PropertyFilters,
  page = 1,
  limit = 10
) {
  const offset = (page - 1) * limit;

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
    FROM rets_property
    WHERE L_Status = "Active"
  `;

  const params: any[] = [];

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

  sql += ` ORDER BY L_SystemPrice ASC LIMIT ${limit} OFFSET ${offset}`;

  return query<ListingRow>(sql, params);
}
