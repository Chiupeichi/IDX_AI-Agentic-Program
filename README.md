# IDX Multi-Agent Real Estate Assistant

OpenClaw-powered real-estate assistant built for the IDX Exchange AI Agentic Engineer Internship (Summer 2026). Weeks 0–9 cover environment setup, architecture, natural-language property search, MLS database integration, conversational memory, market statistics, semantic vector search, comp-validated recommendations, retrieval-augmented generation (RAG), and multi-agent orchestration.

## Overview

| | |
|---|---|
| **Runtime** | [OpenClaw](https://github.com/openclaw/openclaw) multi-agent orchestration framework |
| **Data** | 140,279 locally supplied MLS-derived records across two MySQL tables |
| **Channel target** | WhatsApp through OpenClaw |
| **Implemented capabilities** | NL city/landmark search, conversational memory, market analytics, embedding cosine search, hybrid comp-validated recommendations, document-grounded RAG answers, and five-agent intent routing |

## Databases

### `rets_property` — Active MLS Listings
53,122 supplied California listing records with fields for address, price, beds/baths, living area, agent information, HOA, photos, and remarks.

### `california_sold` — Sold Transactions & Comps
87,157 supplied sold transactions with 46 fields covering close price, days on market, agent/office information, and property attributes. Used for market analytics and comparable sales.

Tables join via `rets_property.L_ListingID` ↔ `california_sold.ListingKey`, or on `city` + `postal code` for market-level analysis.

## Architecture

```
User → WhatsApp / Email → OpenClaw Runtime → Orchestrator → Skill Agents → MySQL (rets_property / california_sold) → Formatted Response → User
```

**Implemented agents/skills**
- Property search — structured filter search over `rets_property`
- Conversational property search — multi-turn preferences and reset behavior
- Market statistics — median/average price, price per square foot, DOM, list-to-close ratio, inventory, MoM, and YoY trends
- Semantic property search — OpenAI listing embeddings with top-five cosine ranking
- Property recommendation — 60/40 structured-semantic ranking with recent sold-comp validation
- Real-estate RAG — curated-document retrieval with 600/100 chunks, cosine top-four ranking, grounded answers, and source citations
- Multi-agent coordinator — routes search, market, recommendation, knowledge, and email-draft requests; runs mixed property-and-market work in parallel

## Tech Stack

- **Orchestration:** OpenClaw
- **Backend:** Node.js / TypeScript
- **Database:** MySQL (`idx_exchange` schema)
- **Secrets:** macOS Keychain with an optional local `.env` fallback
- **Channel:** WhatsApp via OpenClaw

## Getting Started

### Prerequisites
- Node.js + npm
- MySQL
- WhatsApp account (for channel linking)

### Setup

```bash
# Install project dependencies
npm install

# Copy the safe configuration template and fill in local non-secret settings
cp .env.example .env

# Run Weeks 1–9 validation
npm test
```

### Database Import

```bash
mysql -u root -p -e "CREATE DATABASE idx_exchange CHARACTER SET utf8mb4;"
mysql -u root -p idx_exchange < rets_property.sql
mysql -u root -p idx_exchange < california_sold.sql
```

### Environment Variables

Create a `.env` file (never commit this):

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=idx_ai_agent
MYSQL_DATABASE=idx_exchange
MYSQL_PASSWORD_KEYCHAIN_SERVICE=IDX_AI_MYSQL
OPENAI_API_KEY_KEYCHAIN_SERVICE=IDX_AI_OPENAI
OPENAI_API_KEY_KEYCHAIN_ACCOUNT=embeddings
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=512
OPENAI_RAG_MODEL=gpt-5.6-terra
```

### WhatsApp Channel

```bash
openclaw channels login --channel whatsapp
# Scan the QR code in WhatsApp > Linked Devices
```

## Example Usage

```
User: "Show me 3-bedroom condos in Irvine under $1.5M with a pool."
Agent: [returns matching active listings from rets_property]

User: "Is now a good time to buy in San Diego?"
Agent: [returns median price, DOM, list-to-close ratio, 12-month trend from california_sold]

User: "Find a charming craftsman with mountain views and character."
Agent: [returns the five most semantically similar active listings]

User: "Show me homes similar to this listing."
Agent: [returns five hybrid-ranked alternatives with sold-comp price validation]

User: "What does DOM mean?"
Agent: [retrieves the relevant glossary passage and returns a grounded answer with sources]

User: "Find affordable homes in Pasadena and tell me whether prices are rising."
Agent: [runs property search and market statistics in parallel, then returns one combined response]
```

## Safety Guardrails

- Every outbound/destructive action (e.g., sending email) requires explicit human approval — emails are drafted, previewed, and only sent after confirmation.
- Query results are capped at ≤50 rows; full dataset export/bulk-download is not permitted.
- Secrets are stored only in `.env` and are never logged.
- No agent operates autonomously without human oversight on outbound actions.

## Project Status

Weeks 0–9 are implemented in their original weekly deliverable folders. Weeks 6 and 8 require operator-built local embedding indexes before live use; indexes and all secrets remain uncommitted.

## License

Confidential — IDX Exchange Internship Program.
