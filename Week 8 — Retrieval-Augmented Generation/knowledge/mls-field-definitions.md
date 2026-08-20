# MLS Field Definitions

Source authority: IDX Exchange AI Agentic Engineer Intern Handbook, Summer 2026, data schema reference (pages 4-6), verified against `SHOW COLUMNS FROM california_sold` in the locally supplied read-only `idx_exchange` schema.

## rets_property - active listings

`rets_property` is the live search and discovery table for active MLS listings.

- `L_ListingID`: MLS system listing identifier. It can be joined to `california_sold.ListingKey` after compatible type conversion.
- `L_DisplayId`: Human-readable MLS number shown on real-estate portals.
- `L_Address`: Full street address.
- `L_City`: City name.
- `L_Zip`: Postal code.
- `L_Class`: Broad property class, such as Residential, CommercialSale, or Land.
- `L_Type_`: Property subtype, such as SingleFamilyResidence or Condominium.
- `L_Keyword2`: Total bedrooms.
- `LM_Dec_3`: Total bathrooms, including fractional values such as 2.5.
- `L_SystemPrice`: Current list or display price.
- `LM_Int2_3`: Approximate finished living area in square feet.
- `L_Status`: Listing status.
- `L_Remarks`: Full listing description used for keyword and semantic search.
- `L_Photos`: JSON array of listing photo URLs.
- `LMD_MP_Latitude` and `LMD_MP_Longitude`: Geographic coordinates.
- `YearBuilt`: Construction year.
- `AssociationFee`: Monthly HOA fee.
- `DaysOnMarket`: Days on market at the time of the data pull.
- `PhotoCount`: Number of listing photos.
- `PoolPrivateYN`, `ViewYN`, and `FireplaceYN`: Feature indicators.

## california_sold - sold transactions and comps

`california_sold` is the historical closed-transaction and comparable-sales table. It contains the following 46 fields:

1. `ListingKey` - unique listing identifier.
2. `ViewYN` - view indicator.
3. `WaterfrontYN` - waterfront indicator.
4. `BasementYN` - basement indicator.
5. `PoolPrivateYN` - private pool indicator.
6. `OriginalListPrice` - original asking price.
7. `CloseDate` - date the transaction closed.
8. `ClosePrice` - final sale or close price.
9. `ListAgentFirstName` - listing agent first name.
10. `ListAgentLastName` - listing agent last name.
11. `Latitude` - geographic latitude.
12. `Longitude` - geographic longitude.
13. `UnparsedAddress` - full street address.
14. `PropertyType` - broad property type.
15. `LivingArea` - finished living area in square feet.
16. `ListPrice` - list price at the time of contract.
17. `DaysOnMarket` - days from listing to contract.
18. `ListOfficeName` - listing brokerage name.
19. `BuyerOfficeName` - buyer brokerage name.
20. `ListAgentFullName` - listing agent full name.
21. `BuyerAgentFirstName` - buyer agent first name.
22. `BuyerAgentLastName` - buyer agent last name.
23. `AttachedGarageYN` - attached-garage indicator.
24. `ParkingTotal` - total parking spaces.
25. `PropertySubType` - detailed property subtype.
26. `LotSizeAcres` - lot size in acres.
27. `SubdivisionName` - subdivision or community name.
28. `YearBuilt` - construction year.
29. `BathroomsTotalInteger` - bathroom count.
30. `City` - city name.
31. `BedroomsTotal` - bedroom count.
32. `PurchaseContractDate` - date the offer was accepted.
33. `ListingContractDate` - date the listing was entered.
34. `StateOrProvince` - state or province code.
35. `MiddleOrJuniorSchool` - middle or junior school name.
36. `FireplaceYN` - fireplace indicator.
37. `Stories` - number of stories.
38. `HighSchool` - high-school name.
39. `Levels` - property level description.
40. `MainLevelBedrooms` - bedrooms on the main level.
41. `NewConstructionYN` - new-construction indicator.
42. `GarageSpaces` - garage space count.
43. `HighSchoolDistrict` - school district name.
44. `PostalCode` - postal code.
45. `AssociationFee` - association or HOA fee.
46. `LotSizeSquareFeet` - lot size in square feet.

## Join pattern

For listing-level correlation, join `rets_property.L_ListingID` to `california_sold.ListingKey` after compatible type conversion. For market-level analysis, city, postal code, and coordinates can be used instead.
