# california_sold Complete Column Reference

Source authority: the actual read-only `SHOW COLUMNS FROM california_sold` result in the locally supplied `idx_exchange` schema. This compact reference is optimized so a RAG query asking for the table columns retrieves the complete schema rather than an incomplete excerpt.

## Columns 1–16

The first 16 columns, in exact schema order, are: `ListingKey`, `ViewYN`, `WaterfrontYN`, `BasementYN`, `PoolPrivateYN`, `OriginalListPrice`, `CloseDate`, `ClosePrice`, `ListAgentFirstName`, `ListAgentLastName`, `Latitude`, `Longitude`, `UnparsedAddress`, `PropertyType`, `LivingArea`, and `ListPrice`.

## Columns 17–32

The next 16 columns, in exact schema order, are: `DaysOnMarket`, `ListOfficeName`, `BuyerOfficeName`, `ListAgentFullName`, `BuyerAgentFirstName`, `BuyerAgentLastName`, `AttachedGarageYN`, `ParkingTotal`, `PropertySubType`, `LotSizeAcres`, `SubdivisionName`, `YearBuilt`, `BathroomsTotalInteger`, `City`, `BedroomsTotal`, and `PurchaseContractDate`.

## Columns 33–46

The final 14 columns, in exact schema order, are: `ListingContractDate`, `StateOrProvince`, `MiddleOrJuniorSchool`, `FireplaceYN`, `Stories`, `HighSchool`, `Levels`, `MainLevelBedrooms`, `NewConstructionYN`, `GarageSpaces`, `HighSchoolDistrict`, `PostalCode`, `AssociationFee`, and `LotSizeSquareFeet`.

Together, these three ordered groups are the complete 46-column `california_sold` schema.
