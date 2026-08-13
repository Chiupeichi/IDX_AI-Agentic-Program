# Week 8 — Retrieval-Augmented Generation

This deliverable adds a document-aware real-estate assistant. It embeds curated Markdown knowledge, retrieves the four most relevant chunks with cosine similarity, and gives only those chunks to the OpenAI Responses API for a grounded answer.

## Handbook mapping

1. Collect authoritative documents in `knowledge/`.
2. Split each document into 600-character chunks with 100-character overlap.
3. Embed and save the chunks in a local JSON index.
4. Embed the user's question and retrieve the top four chunks by cosine similarity.
5. Generate a concise answer only from retrieved context, cite source IDs, and say when the context is insufficient.

The included corpus covers the Week 8 acceptance questions with MLS field definitions verified against the local database, real-estate terminology, and Week 5 market-analytics definitions. Add only vetted authoritative material for new topics; the assistant must not invent legal guidance when no legal source has been indexed.

## Files

- `knowledge/*.md` — curated source documents
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
