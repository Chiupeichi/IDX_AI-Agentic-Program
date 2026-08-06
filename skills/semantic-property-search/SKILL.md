---
name: semantic-property-search
description: Find active California properties whose listing descriptions are semantically similar to a user's free-text lifestyle, architectural, view, character, or feature request using OpenAI embeddings and cosine similarity.
metadata: { "openclaw": { "emoji": "🔎", "requires": { "bins": ["node", "npm"] } } }
---

# Semantic Property Search

Use this skill when a user describes the feel, architecture, lifestyle, setting, or qualitative features of a desired property and keyword or structured filtering alone is insufficient.

## Required input

- Obtain one meaningful free-text property description.
- Do not replace the user's wording with invented preferences.
- Return at most five results.

## Run

From the workspace root:

```bash
npm run week6:search -- --query "charming craftsman with mountain views and character"
```

Replace only the quoted description with the user's request and preserve shell quoting.

The command uses the prebuilt local embedding index and makes one OpenAI embeddings request for the query. Do not run `week6:index` during a user conversation: rebuilding sends listing text to an external API, may incur cost, and is an operator maintenance action.

## Response rules

- Return the five cosine-ranked active listings without changing their values.
- Preserve address, city, price, beds, baths, square footage, match percentage, and listing ID.
- Explain that semantic match indicates description similarity, not price suitability.
- If the index is missing or incompatible, say semantic search is temporarily unavailable and ask the operator to rebuild it. Do not expose credentials, stack traces, or internal paths.
