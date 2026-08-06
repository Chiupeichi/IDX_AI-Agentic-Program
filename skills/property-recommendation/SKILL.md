---
name: property-recommendation
description: Recommend five comparable active listings for a selected property using a 60% structured and 40% semantic hybrid score, then validate each price with recent california_sold comps.
metadata: { "openclaw": { "emoji": "🏘️", "requires": { "bins": ["node", "npm"] } } }
---

# Property Recommendation

Use this skill after a user identifies a listing they like and asks for similar properties, alternatives, recommendations, or a comp-supported price comparison.

## Required input

- Obtain the selected listing's `listingId` from the prior search result or ask the user to choose a listing.
- Never guess an ID from an address.
- Return at most five recommendations.

## Run

From the workspace root:

```bash
npm run week7:recommend -- --listing-id "LISTING_ID"
```

Replace only the quoted ID with the validated selected listing ID.

## Response rules

- Preserve the hybrid score, structured/semantic breakdown, comp-supported price, delta, assessment, and comp count.
- State that comp validation is an automated market-data estimate and not an appraisal.
- If the listing is absent from the index, ask the operator to rebuild the Week 6 index; do not build it during the conversation.
- If recent comps are insufficient, report that limitation instead of inventing a value.
- Never expose credentials, stack traces, SQL, or internal paths to the WhatsApp user.
