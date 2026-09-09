---
name: email-agent-safety
description: Draft listing alerts, weekly market reports, property summaries, and recommendation digests, then send only after the same user explicitly approves the exact persistent draft ID. Use for every email request or approval in the IDX real-estate assistant.
metadata: { "openclaw": { "emoji": "✉️", "requires": { "bins": ["node", "npm"] } } }
---

# Email Agent With Safety Guardrails

Route every real-estate email draft, approval, cancellation, or send request through the
Week 11 workflow by using the normal Week 10/Week 9 entry point. Never call Nodemailer or
the SMTP transport directly.

## Draft

Require a recipient address and enough context for either a city market report or the
sender's latest property results. Return the complete preview, `pending_approval` status,
and draft ID. Drafting must never send.

## Approval

Only treat a message matching `Approve email DRAFT_UUID` from the same sender as explicit
approval. The UUID must be copied from the displayed preview. A general "yes", "looks good",
or earlier permission is not sufficient.

## Rules

- Never approve on the user's behalf.
- Never change recipient, subject, or body after preview; create a new draft instead.
- Never bypass the persisted status check or per-draft lock.
- Never retry a failed delivery without a new explicit approval.
- Never expose SMTP credentials, SQL, stack traces, local paths, or another user's draft.
- Never claim delivery unless the stored draft status is `sent`.
- Keep listing outputs at five records and never bulk-export MLS data.
