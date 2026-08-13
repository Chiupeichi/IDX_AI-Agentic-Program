---
name: real-estate-rag
description: Answer questions about this IDX project's MLS fields, real-estate terminology, and market analytics from the curated Week 8 knowledge index with cited, retrieval-grounded context.
metadata: { "openclaw": { "emoji": "📚", "requires": { "bins": ["node", "npm"] } } }
---

# Real Estate RAG

Use this skill for questions about project data fields, real-estate definitions, or implemented market metrics when an authoritative document-grounded answer is preferred.

## Run

From the workspace root:

```bash
npm run week8:ask -- --question "What does DOM mean?"
```

Replace only the quoted question and preserve shell quoting. The command retrieves four chunks from the operator-built local index and asks the configured OpenAI model to answer only from that context.

Do not run `week8:index` during a user conversation. Index creation sends source-document text to an external API, may incur cost, and is an operator maintenance action.

## Response rules

- Preserve the generated answer and its source list.
- Do not add uncited facts from memory.
- If the answer says the indexed sources are insufficient, state that plainly and ask for an authoritative document to be added.
- Do not provide legal advice from a terminology glossary. Legal questions require an applicable, vetted legal source in the corpus.
- If the index is missing or incompatible, say document-grounded answers are temporarily unavailable and ask the operator to rebuild it. Never expose credentials, stack traces, or internal paths.
