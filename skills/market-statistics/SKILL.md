---
name: market-statistics
description: Answer California city real-estate market questions with median and average close price, price per square foot, days on market, list-to-close ratio, active-versus-sold inventory, and a 12-month MoM/YoY trend from the local MLS-derived MySQL data.
metadata: { "openclaw": { "emoji": "📊", "requires": { "bins": ["node", "npm"] } } }
---

# Market Statistics

Use this skill when a user asks about market conditions, median home price, price trends, sales velocity, inventory, days on market, or list-to-close performance for a California city.

## Required input

- Obtain one California city from the user. Ask one short clarifying question if it is missing.
- Use 12 months unless the user explicitly requests another period from 1 to 60 months.
- Never guess a city from unrelated conversation history.

## Run

From the workspace root, execute:

```bash
npm run week5:market -- --city "Irvine" --months 12
```

Replace only the city and period with the validated user request. Preserve argument quoting. The script uses parameterized read-only SQL and retrieves the password from macOS Keychain; never request or print the database password.

Return the command output without inventing missing values. “N/A” means the local dataset lacks enough valid records for that metric or comparison.

## Interpretation rules

- Median and average close price use residential sales with positive close prices.
- Price per square foot excludes records with missing or non-positive living area.
- List-to-close ratio excludes records with missing or non-positive list price.
- Future-dated closings are always excluded.
- MoM and YoY compare monthly median close prices.
- Inventory reports current active residential listings versus sold transactions in the requested period.

## Failure behavior

- If no sales are available, say the local dataset has no qualifying results and suggest checking the city spelling or widening the period.
- If MySQL or Keychain access fails, say market data is temporarily unavailable. Do not expose commands, credentials, stack traces, or internal paths to the WhatsApp user.
