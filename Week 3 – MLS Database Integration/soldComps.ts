import { query } from "./mysql";

export type SoldRow = {
  ListingKey: string;
  UnparsedAddress: string;
  City: string;
  CloseDate: string;
  ClosePrice: number;
  OriginalListPrice: number;
  ListPrice: number;
  DaysOnMarket: number;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  PropertyType: string;
  PropertySubType: string;
  YearBuilt: number;
  ListAgentFullName: string;
  ListOfficeName: string;
  BuyerOfficeName: string;
};

export async function getSoldComps(city: string, months = 12) {
  const normalizedCity = city.trim();
  if (!normalizedCity) {
    throw new Error("city is required");
  }
  if (!Number.isInteger(months) || months < 1 || months > 60) {
    throw new RangeError("months must be an integer between 1 and 60");
  }

  const sql = `
    SELECT
      ListingKey,
      UnparsedAddress,
      City,
      CloseDate,
      ClosePrice,
      OriginalListPrice,
      ListPrice,
      DaysOnMarket,
      BedroomsTotal,
      BathroomsTotalInteger,
      LivingArea,
      PropertyType,
      PropertySubType,
      YearBuilt,
      ListAgentFullName,
      ListOfficeName,
      BuyerOfficeName
    FROM california_sold
    WHERE City = ?
      AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      AND CloseDate <= CURDATE()
      AND PropertyType = "Residential"
    ORDER BY CloseDate DESC
    LIMIT 50
  `;

  return query<SoldRow>(sql, [normalizedCity, months]);
}
