# IDX Multi-Agent Real Estate Assistant

OpenClaw-powered real-estate assistant built for the IDX Exchange AI Agentic Engineer Internship (Summer 2026). Weeks 0–5 currently cover environment setup, architecture, natural-language property search, MLS database integration, conversational memory, and market statistics.

## Overview

| | |
|---|---|
| **Runtime** | [OpenClaw](https://github.com/openclaw/openclaw) multi-agent orchestration framework |
| **Data** | 140,279 locally supplied MLS-derived records across two MySQL tables |
| **Channel target** | WhatsApp through OpenClaw |
| **Implemented capabilities** | NL city/landmark property search, interactive numbered selection, conversational memory, sold comps, and market analytics |

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

# Run Weeks 1–5 validation
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
```

## Safety Guardrails

- Every outbound/destructive action (e.g., sending email) requires explicit human approval — emails are drafted, previewed, and only sent after confirmation.
- Query results are capped at ≤50 rows; full dataset export/bulk-download is not permitted.
- Secrets are stored only in `.env` and are never logged.
- No agent operates autonomously without human oversight on outbound actions.

## Project Status

Weeks 0–5 are implemented in their original weekly deliverable folders. Later internship weeks remain future work and are not represented as completed here.

## License

Confidential — IDX Exchange Internship Program.
