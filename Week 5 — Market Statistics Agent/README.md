# Week 5 — Market Statistics Agent

This deliverable implements a read-only market-statistics agent over the local `idx_exchange` MySQL database.

## Metrics

- Median and average close price
- Average close price per square foot
- Average days on market (DOM)
- Average list-to-close ratio
- Active inventory versus sold transactions
- Twelve-month monthly median trend with MoM and YoY change

Future-dated sales and invalid price/area denominators are excluded. Missing comparison data is reported as `N/A` rather than estimated.

## Run

```bash
npm run week5
npm run week5:market -- --city "Irvine" --months 12
```

The same implementation is exposed to OpenClaw through `skills/market-statistics/SKILL.md`.
