# Week 11 — Email Agents & Safety Guardrails

This deliverable adds persistent email drafts for listing alerts, weekly market reports,
property summaries, and recommendation digests. No email is sent during drafting. A user
must review the exact recipient, subject, and body, then explicitly approve that immutable
draft ID before SMTP delivery is attempted.

## Safety state machine

```text
draft → pending_approval → explicit user approval → approved → sending → sent
                                           delivery failure → failed → re-approval required
```

- Draft IDs are random UUIDs and are bound to a SHA-256 hash of the requesting user ID.
- Another WhatsApp user cannot approve or inspect someone else's draft.
- A per-draft exclusive lock prevents concurrent duplicate sends.
- Sent and cancelled drafts cannot be sent again.
- A failed delivery never retries autonomously; a new explicit approval is required.
- The canonical locally stored draft is sent, so approval cannot silently change its content.
- Draft state is private under `.data/email-drafts/` and is ignored by Git.
- SMTP credentials are read only after approval and are never logged.
- Listing email templates are capped at five properties, below the Handbook's 50-row limit.

## Files

- `types.ts` — draft states, content, and transport contract
- `draftStore.ts` — private persistent draft storage, ownership, and locking
- `templates.ts` — weekly market report and listing/recommendation templates
- `transport.ts` — lazy Nodemailer Gmail transport with Keychain support
- `emailService.ts` — draft, approve, cancel, and approved-send state transitions
- `workflow.ts` — natural-language draft/approval handler used by the Week 9 email agent
- `cli.ts` — live command-line entry point
- `testEmailSafety.ts` — offline safety and template acceptance tests

## Setup

Prefer a Gmail App Password stored in macOS Keychain rather than `.env`:

```bash
security add-generic-password -U -s IDX_AI_EMAIL -a "you@example.com" -w
```

Then set only the non-secret references in `.env`:

```dotenv
EMAIL_USER=you@example.com
EMAIL_PASSWORD_KEYCHAIN_SERVICE=IDX_AI_EMAIL
EMAIL_SERVICE=gmail
EMAIL_FROM_NAME=IDX Real Estate Assistant
```

## Run

Create and preview a draft (does not send):

```bash
npm run week11:email -- --message "Draft a weekly market report for Pasadena to manager@example.com" --user-id "+15551234567"
```

Copy the returned draft ID and explicitly approve that exact preview:

```bash
npm run week11:email -- --message "Approve email DRAFT_UUID" --user-id "+15551234567"
```

The second command is the only path that may call Nodemailer. Run the offline guardrail tests
with `npm run week11`.
