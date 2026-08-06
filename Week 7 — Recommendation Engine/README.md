# Week 7 — Recommendation Engine

This deliverable implements the handbook's hybrid recommendation engine. Given an active listing in the Week 6 index, it returns five comparable active listings and validates each recommended price against recent `california_sold` transactions.

## Hybrid score

The score follows the handbook's 60/40 design:

- Structured similarity — up to 60 points from price difference, matching bedrooms, matching city, and square-footage difference.
- Semantic similarity — up to 40 points from embedding cosine similarity.

## Comp validation

For each recommended listing, the engine queries residential sales from the last six months in the same city and within 80–120% of the listing's living area. It returns:

- Average sold price per square foot
- Comp-supported price
- Number of qualifying comps
- Difference between list price and comp-supported price
- Below / within / above comp-range assessment

This is an automated market-data comparison, not a professional appraisal.

## Run

Build the Week 6 index first, then pass an active listing ID:

```bash
npm run week7:recommend -- --listing-id "LISTING_ID"
```

## Test

```bash
npm run week7
```

The first test validates hybrid ranking with deterministic vectors. The second performs a read-only comp query against the real local MySQL data.
