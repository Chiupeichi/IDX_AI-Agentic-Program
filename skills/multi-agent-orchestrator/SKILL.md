---
name: multi-agent-orchestrator
description: Route real-estate requests through the IDX coordinator across property search, market statistics, recommendations, document-grounded RAG, and the human-approved email workflow, including parallel mixed-intent handling.
metadata: { "openclaw": { "emoji": "🧭", "requires": { "bins": ["node", "npm"] } } }
---

# IDX Multi-Agent Orchestrator

Use this as the primary entry point for IDX real-estate requests. It classifies the request and invokes the relevant specialized agent. A combined property-and-market question is routed to both agents in parallel and returned as one response.

## Run

From the workspace root:

```bash
npm run week9:ask -- --query "USER_MESSAGE" --user-id "CHANNEL_USER_ID"
```

Preserve quoting and use a stable channel user ID so listing selections and recommendation context remain associated with the same user.

## Routing

- Property search → `propertySearchAgent`
- Market conditions and trends → `marketStatsAgent`
- Similar listings → `recommendationAgent`
- MLS fields and terminology → `ragAgent`
- Email composition → `emailDraftAgent`
- Property search plus market trends → both relevant agents in parallel

## Rules

- Return the coordinator output without inventing listings, statistics, comps, or definitions.
- Ask for a city when a search or market question has no location.
- A recommendation requires a prior listing search in the same user session.
- Email drafting must return the complete `pending_approval` preview and UUID without sending.
- Only an exact `Approve email DRAFT_UUID` message from the same user may enter the Week 11 approved-send path.
- Never approve on the user's behalf or claim delivery without a stored `sent` status.
- Never expose credentials, SQL, stack traces, local index paths, or Keychain details.
