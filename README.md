# IDX Multi-Agent Real Estate Assistant

Production-grade, OpenClaw-powered multi-agent AI assistant built for the IDX Exchange AI Agentic Engineer Internship (Summer 2026). The assistant provides real-time MLS property search, market analytics, semantic recommendations, RAG-based knowledge retrieval, and WhatsApp + email communication over two live California MLS datasets.

## Overview

| | |
|---|---|
| **Runtime** | [OpenClaw](https://github.com/openclaw/openclaw) multi-agent orchestration framework |
| **Data** | 667K+ MLS records across two MySQL tables |
| **Channels** | WhatsApp, Email |
| **Core capabilities** | NL property search, market analytics, embeddings/vector search, RAG, recommendations, multi-agent orchestration |

## Databases

### `rets_property` — Active MLS Listings
~228,410 active California listings, 130+ fields (address, price, beds/baths, sqft, agent info, HOA, photos, full-text remarks with `FULLTEXT` index).

### `california_sold` — Sold Transactions & Comps
~439,167 sold/leased/closed transactions (2021–2025), 46 fields covering close price, days on market, agent/office info, and property attributes. Used for market analytics and comp validation.

Tables join via `rets_property.L_ListingID` ↔ `california_sold.ListingKey`, or on `city` + `postal code` for market-level analysis.

## Architecture

```
User → WhatsApp / Email → OpenClaw Runtime → Orchestrator → Skill Agents → MySQL (rets_property / california_sold) → Formatted Response → User
```

**Agents**
- `propertySearchAgent` — structured filter search over `rets_property`
- `marketStatsAgent` — trend/comp aggregations over `california_sold`
- `recommendationAgent` — hybrid (structured + embedding) similarity scoring, comp-validated
- `ragAgent` — grounded answers over MLS field definitions & real estate terminology
- `emailDraftAgent` — draft-then-approve email summaries and reports

## Tech Stack

- **Orchestration:** OpenClaw
- **Backend:** Node.js / TypeScript, Python
- **Database:** MySQL (`idx_exchange` schema)
- **AI:** OpenAI embeddings (`text-embedding-3-small`), GPT-4o-mini for RAG generation
- **Data tooling:** pandas, scikit-learn, SQLAlchemy
- **Channels:** WhatsApp (via OpenClaw channel), Nodemailer (email)

## Getting Started

### Prerequisites
- Node.js + npm
- Python 3.x
- MySQL
- OpenAI API key
- WhatsApp account (for channel linking)

### Setup

```bash
# Clone and install OpenClaw
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
openclaw onboard

# Python environment
python3 -m venv venv
source venv/bin/activate
pip install pandas openai mysql-connector-python sqlalchemy scikit-learn numpy
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
OPENAI_API_KEY=sk-...
MYSQL_HOST=localhost
MYSQL_USER=idx_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=idx_exchange
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
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

Built over a 12-week internship program, progressing from environment setup through NL search, database integration, conversational memory, market analytics, embeddings, RAG, multi-agent orchestration, and channel integration (WhatsApp + email), culminating in a capstone demo.

## License

Confidential — IDX Exchange Internship Program.
