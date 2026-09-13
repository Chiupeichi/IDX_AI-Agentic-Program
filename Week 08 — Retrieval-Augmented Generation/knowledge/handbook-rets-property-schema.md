# IDX Legacy rets_property Schema Reference

Source authority: IDX Exchange AI Agentic Engineer Intern Handbook 2026 v2, data schema reference on pages 4-5. This is the optional fourth Week 8 source recommended by the Handbook for legacy fields that are absent from Trestle's RESO metadata.

## Core search fields

- `L_ListingID`: MLS system listing identifier. It can be correlated with `california_sold.ListingKey` after compatible type conversion.
- `L_DisplayId`: Human-readable MLS number shown on portals.
- `L_Address`: Full street address.
- `L_City`: City used by structured property search.
- `L_Zip`: Postal code.
- `L_Class`: Broad property class, such as Residential, CommercialSale, or Land.
- `L_Type_`: Property subtype, such as SingleFamilyResidence or Condominium.
- `L_Keyword2`: Total bedrooms.
- `LM_Dec_3`: Total bathrooms, including decimal values such as 2.5.
- `L_SystemPrice`: Current list or display price.
- `LM_Int2_3`: Approximate finished living area in square feet.
- `L_Status`: Local listing status.
- `L_Remarks`: Full listing description used for keyword and semantic search.
- `L_Photos`: JSON array of listing photo URLs.
- `LMD_MP_Latitude` and `LMD_MP_Longitude`: Geographic coordinates.

## Additional project fields

- `YearBuilt`: Construction year.
- `AssociationFee`: Monthly HOA fee.
- `DaysOnMarket`: Days on market at the time of the data pull.
- `PhotoCount`: Number of listing photos.
- `PoolPrivateYN`, `ViewYN`, and `FireplaceYN`: Feature indicators.
- `PreviousListPrice`: Prior list price, used for price-reduction analysis.
- `StandardStatus`: RESO-standard status when populated.
- `CountyOrParish`: County name.
- `ParcelNumber`: Assessor parcel number.
- `ArchitecturalStyle`: Architectural style description.
- `ModificationTimestamp`: Most recent listing modification timestamp.

## Known limitation

Trestle defines RESO-standard fields such as `YearBuilt`, `AssociationFee`, `PoolPrivateYN`, and `StandardStatus`, but it does not define IDX legacy names such as `L_SystemPrice`, `L_Keyword2`, `LM_Dec_3`, `LM_Int2_3`, `L_City`, and `L_Address`. Questions about those names must retrieve this Handbook-derived schema source rather than extrapolate from Trestle.
