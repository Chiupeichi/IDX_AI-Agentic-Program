# Week 6 — Embeddings & Vector Search

This deliverable implements the handbook's semantic property-search requirement. It converts active `rets_property` listings into OpenAI embeddings, stores a local reusable index, embeds a free-text query, and returns the five listings with the highest cosine similarity.

## Design

- Uses the official OpenAI Node SDK with `text-embedding-3-small`.
- Builds listing text from property type, city, beds, baths, square footage, year, price, and `L_Remarks`.
- Reads only active residential listings that contain remarks.
- Stores vectors as compact Float32/base64 records under `.data/`; the index is local and ignored by Git.
- Streams the index during search so the entire vector set is not retained in memory.
- Requires the query embedding model and dimensions to match the index metadata.

## API key setup

An OpenAI API key is required for indexing and query embeddings. Codex/OpenClaw OAuth does not provide access to the embeddings endpoint.

On macOS, save the key in Keychain without putting it in Git:

```bash
security add-generic-password -U -s IDX_AI_OPENAI -a embeddings -w
```

Then configure the non-secret references in `.env`:

```dotenv
OPENAI_API_KEY_KEYCHAIN_SERVICE=IDX_AI_OPENAI
OPENAI_API_KEY_KEYCHAIN_ACCOUNT=embeddings
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=512
```

## Build and search

Build a smaller development index:

```bash
npm run week6:index -- --limit 500
```

Omit `--limit` to index every qualifying active listing. Indexing sends the constructed listing text to the OpenAI embeddings API and may incur API usage charges.

```bash
npm run week6:index
npm run week6:search -- --query "charming craftsman with mountain views and character"
```

For a large production rebuild, create bounded segments so completed work survives
execution time limits. `--offset` is zero-based and is applied to the stable database
ordering; each segment must use a different output path.

```bash
npm run week6:index -- --offset 0 --limit 10000 --batch-size 256 --output .data/week6-segments/segment-00000.jsonl
npm run week6:index -- --offset 10000 --limit 10000 --batch-size 256 --output .data/week6-segments/segment-10000.jsonl
```

After all segments finish, merge them in offset order. The merge validates every
segment's metadata, record count, and vector dimensions before atomically replacing
the final output.

```bash
npm run week6:merge -- \
  .data/week6-segments/segment-00000.jsonl \
  .data/week6-segments/segment-10000.jsonl \
  --output .data/listing-embeddings.jsonl
```

## Test

```bash
npm run week6
```

The automated tests use a deterministic in-memory embedding provider for indexing/cosine ranking and a read-only live MySQL query to verify the active-listing source. They do not make a paid embeddings API call.
