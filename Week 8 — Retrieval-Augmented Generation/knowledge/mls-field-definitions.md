# Trestle RESO Field Definitions

Source authority: IDX Exchange, `Trestle Property MetaData`, dated May 13, 2024. This document summarizes the RESO-standard fields used by the project; it does not claim that IDX legacy field names appear in Trestle.

## Record and status fields

- `ListingKey`: Unique identifier for a property record from the immediate source. It is the primary key of the Trestle Property resource.
- `ListingId`: Human-oriented listing identifier. It may require the originating provider to be globally unique.
- `StandardStatus`: Contract-level listing state, including Active, Active Under Contract, Canceled, Closed, Expired, Pending, and Withdrawn.
- `ModificationTimestamp`: MLS system timestamp for the most recent record modification.
- `ListingContractDate`: Effective date of the agreement between the seller and listing broker.
- `CloseDate`: Date the sale or lease agreement requirements were fulfilled.

## Price and property fields

- `ClosePrice`: Amount paid by the purchaser to the seller under the agreement.
- `BedroomsTotal`: Total bedrooms in the dwelling.
- `BathroomsTotalInteger`: Integer sum of bathrooms. Decimal bathroom counts require a non-standard extension.
- `LivingArea`: Finished living area used by the project's sold-data analysis.
- `YearBuilt`: Year the structure was built or became initially habitable.
- `AssociationFee`: Homeowners association fee used for association-related upkeep or benefits.
- `PoolPrivateYN`: Indicates that a privately owned pool is included in the sale or lease.
- `AttachedGarageYN`: Indicates that at least one garage is attached to the primary dwelling.
- `ParkingTotal`: Total parking spaces included in the sale.
- `SubdivisionName`: Neighborhood, community, complex, or builder tract name.
- `PostalCode`: Postal code portion of the property address.

## Project table coverage

The 46 fields in `california_sold` use RESO-standard names almost entirely, including `ListingKey`, `ClosePrice`, `BedroomsTotal`, `BathroomsTotalInteger`, `YearBuilt`, `AssociationFee`, and `PoolPrivateYN`. The separate complete-column reference preserves the exact local schema order.

Some `rets_property` fields also match Trestle directly, but its core search fields use IDX legacy names. Those legacy mappings are documented in `handbook-rets-property-schema.md`, not inferred from Trestle.
