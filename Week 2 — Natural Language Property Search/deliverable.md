# Week 2 Deliverable – Natural Language Property Search

## Overview

This project implements a simple TypeScript natural language parser for real estate search queries.

The parser converts free-text property search requests into structured filter objects that can be used in later database queries (Week 3).

---

## Supported Filters

The parser currently extracts:

- City
- Maximum Price
- Bedrooms
- Bathrooms
- Square Footage
- Property Type
- Pool
- View

Supported property types:

- Condominium
- Townhouse
- Single Family Residence
- Land

---

## Parsing Flow

User Query

↓

Regular Expressions

↓

Extract Individual Filters

↓

Normalize Values

↓

Return Structured Object

Example:

Input

Show me 3-bedroom condos in Irvine under $1.5M with a pool

↓

Output

```json
{
  "city": "Irvine",
  "maxPrice": 1500000,
  "beds": 3,
  "baths": null,
  "sqft": null,
  "type": "Condominium",
  "pool": true,
  "hasView": null
}
```

---

## Test Queries

| Test | Query |
|------|-------|
|1|Show me 3-bedroom condos in Irvine under $1.5M with a pool|
|2|Looking for a single family home in Newport Beach under 2m with a view|
|3|2 bed 2.5 bath townhouse in Pasadena at least 1800 sqft|
|4|Under $800k in San Diego|
|5|3 bedroom house with a pool and view under 950000|
|6|Condo in Los Angeles|
|7|5 bed 4 bath single family in Beverly Hills under $10,000,000 with pool and view|
|8|2500 square feet land parcel in Riverside|
|9|Townhouse under 1.2m in Irvine with 3 bedrooms and 2 baths|
|10|Show me homes near Irvine|

---

## Validation

The parser was successfully tested against all 10 queries.

Each query returned a structured filter object containing the recognized search parameters.
