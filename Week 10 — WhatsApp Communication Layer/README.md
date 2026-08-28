# Week 10 — WhatsApp Communication Layer

This deliverable connects the official OpenClaw WhatsApp channel to the Week 9 single orchestrator. Every accepted direct message enters through the same coordinator, which can route property search, market questions, recommendations, RAG questions, email drafts, and mixed intent.

## Architecture

```text
WhatsApp
  → official @openclaw/whatsapp channel plugin
  → OpenClaw workspace skill
  → onWhatsAppMessage(message, userId)
  → Week 9 orchestrate()
  → specialized agents
  → rets_property / california_sold / RAG index
  → mobile-formatted, chunked WhatsApp response
```

## Handbook mapping

1. `handler.ts` is the channel-facing message handler and calls the complete Week 9 orchestrator.
2. `formatter.ts` adds WhatsApp emphasis and keeps every message under the channel's 4,000-character cap.
3. `sessionStore.ts` preserves each sender's search state between separate OpenClaw skill processes. Sender IDs are SHA-256 hashed in local filenames and never written into session JSON.
4. Search results remain capped at five cards for a clean mobile response.
5. Errors return a short safe message without credentials, SQL, stack traces, or internal paths.
6. The OpenClaw runtime owns the live typing indicator; the handler also exposes an injectable typing callback for direct adapters and tests.

## Files

- `handler.ts` — end-to-end WhatsApp message handler
- `formatter.ts` — mobile formatting and safe chunking
- `sessionStore.ts` — private per-user persistent session bridge
- `types.ts` — channel reply and session-store contracts
- `cli.ts` — OpenClaw skill command
- `testWhatsApp.ts` — offline acceptance and safety tests

## Run

```bash
npm run week10
npm run week10:message -- --message "Find affordable homes in Pasadena and tell me whether prices are rising" --user-id "+15551234567"
```

The official plugin stores WhatsApp authentication outside the repository. The workspace commits no phone credentials, API keys, MySQL passwords, RAG indexes, or WhatsApp session files.
