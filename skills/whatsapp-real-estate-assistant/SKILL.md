---
name: whatsapp-real-estate-assistant
description: Primary adapter for inbound WhatsApp real-estate conversations. Sends every search, market, recommendation, RAG, mixed-intent, selection, refinement, reset, email-draft, or explicit email-approval message through the Week 10 handler and Week 9 orchestrator while preserving the sender's session.
metadata: { "openclaw": { "emoji": "💬", "requires": { "bins": ["node", "npm"] } } }
---

# WhatsApp Real Estate Assistant

Use this skill for every real-estate request received from an authorized WhatsApp direct message. It is the primary WhatsApp entry point and must be preferred over calling the specialized workspace skills separately.

## Run

From the workspace root:

```bash
npm run week10:message -- --message "USER_MESSAGE" --user-id "SENDER_E164"
```

Replace `USER_MESSAGE` with the complete current message and `SENDER_E164` with the stable WhatsApp sender ID from the inbound envelope. Preserve quoting.

Return the command output to the same WhatsApp conversation. OpenClaw owns the live typing indicator and delivery transport; the Week 10 handler owns orchestration, session restoration, safety fallback, and mobile formatting.

## Rules

- Always use the actual sender ID so multi-turn filters, numbered selections, and recommendations stay in the correct private session.
- A short refinement such as `under $1.2M`, `3 bedrooms`, or `with a pool` must still go through this handler; it restores the previous location automatically.
- A numbered reply selects that item from the sender's most recent result set.
- Do not bypass the coordinator by independently combining agent output.
- Do not invent listings, statistics, comps, definitions, or delivery confirmation.
- Email draft output must retain its pending-approval label and UUID.
- Forward an exact `Approve email DRAFT_UUID` message through the same handler; never convert a general yes into approval.
- Never reveal credentials, SQL, stack traces, local file paths, or raw internal session data.
