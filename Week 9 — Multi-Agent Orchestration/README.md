# Week 9 — Multi-Agent Orchestration

This deliverable combines the specialized Week 2–8 capabilities behind one OpenClaw-ready coordinator. It classifies every incoming request, invokes only the relevant agent, and merges property-search and market-statistics output for mixed questions.

## Handbook mapping

1. Register five specialized agents: property search, market statistics, recommendations, RAG, and safe email drafting.
2. Classify requests as `search`, `market`, `recommend`, `knowledge`, `email`, `mixed`, or `unknown`.
3. Route single-intent requests to exactly one agent.
4. Run property search and market statistics concurrently for mixed requests with `Promise.all`.
5. Return one unified response while preserving the contributing agent names.
6. Validate all routes and the Handbook mixed-intent example without requiring MySQL or OpenAI in the test suite.

The email agent creates a preview with `pending approval` status and never sends anything. Sending and its explicit approval gate belong to Week 11.

## Files

- `classifier.ts` — deterministic intent classification
- `types.ts` — shared agent and orchestration contracts
- `agents.ts` — adapters to the real Week 2–8 implementations
- `orchestrator.ts` — routing, parallel mixed execution, and response merging
- `entrypoint.ts` — single OpenClaw/channel entry point
- `cli.ts` — live command-line demonstration
- `testOrchestrator.ts` — offline five-agent and mixed-intent acceptance tests

## Run

```bash
npm run week9
npm run week9:ask -- --query "Find me affordable homes in Pasadena and tell me whether prices are rising."
```

Live search and market routes use the local MySQL database. Recommendation uses the Week 6 embedding index, and knowledge questions use the Week 8 RAG index plus the configured OpenAI API.
