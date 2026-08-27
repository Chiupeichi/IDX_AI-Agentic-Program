# Week 8 — Retrieval-Augmented Generation

This deliverable adds a document-aware real-estate assistant. It embeds curated Markdown knowledge, retrieves the four most relevant chunks with cosine similarity, and gives only those chunks to the OpenAI Responses API for a grounded answer.

## Handbook mapping

1. Collect authoritative documents in `knowledge/`.
2. Split each document into 600-character chunks with 100-character overlap.
3. Embed and save the chunks in a local JSON index.
4. Embed the user's question and retrieve the top four chunks by cosine similarity.
5. Generate a concise answer only from retrieved context, cite source IDs, and say when the context is insufficient.

The corpus follows the clarified 2026 v2 Handbook guidance:

1. The **Real Estate Data Analyst Primer** supplies terminology such as DOM, escrow, comps, and sale-to-list ratio.
2. **Trestle Property MetaData** supplies RESO-standard field definitions and covers almost all `california_sold` names.
3. The implemented **Week 5 market summaries** supply calculation definitions and data-quality rules.
4. The Handbook pages 4-5 schema table is the optional fourth source for IDX legacy `rets_property` names.

`california-sold-columns.md` is a compact, locally verified index aid for retrieving all 46 columns in one answer. It is derived from the local schema and Trestle terminology rather than treated as an additional external authority.

### Known gap

Trestle does not define legacy search fields including `L_SystemPrice`, `L_Keyword2`, `LM_Dec_3`, `LM_Int2_3`, `L_City`, and `L_Address`. Those fields are covered by `handbook-rets-property-schema.md`. No nonexistent "IDX internal documentation" or California law-summary file is required, and the assistant must not invent legal guidance when no vetted legal source has been indexed.

## Files

- `knowledge/*.md` — curated summaries of the required source categories, the optional legacy-schema source, and the compact 46-column index aid
- `chunking.ts` — handbook 600/100 chunking
- `ragIndex.ts` — embedding and local index persistence
- `retrieval.ts` — cosine top-four retrieval
- `generator.ts` — grounded OpenAI Responses API answer generation
- `rag.ts` — end-to-end RAG orchestration and source formatting
- `buildIndexCli.ts` and `cli.ts` — operator and user commands
- `testRag.ts` — offline acceptance tests for all three handbook questions

## Run

Keep the OpenAI key in the macOS Keychain item configured by `.env`; never commit it.

```bash
npm run week8
npm run week8:index
npm run week8:ask -- --question "What does DOM mean?"
npm run week8:ask -- --question "What columns are in california_sold?"
npm run week8:ask -- --question "What is a list-to-close ratio?"
```

`week8:index` sends the knowledge-document text to the configured OpenAI embeddings model and writes `.data/rag-knowledge-index.json`. The generated index is local and gitignored. Rebuild it whenever the knowledge corpus, embedding model, or embedding dimensions change.
