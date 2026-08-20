# Market Analytics Definitions

Source authority: IDX Exchange AI Agentic Engineer Intern Handbook, Summer 2026, Week 5, plus the project's implemented Week 5 calculation rules.

## Median and average close price

Average close price is the arithmetic mean of qualifying residential `ClosePrice` values. Median close price is the middle qualifying value after sorting; for an even number of transactions it is the mean of the two middle values. Median price is less sensitive to unusually high or low sales.

## Average days on market

Average DOM is the mean of non-negative `DaysOnMarket` values for qualifying residential transactions. It describes sales velocity for the selected city and period.

## List-to-close ratio

The market-level list-to-close ratio averages `ClosePrice / ListPrice * 100` across qualifying records. Records with a missing or non-positive `ListPrice` are excluded. It is a negotiation-leverage indicator, not a complete measure of seller concessions or transaction terms.

## Inventory comparison

Inventory comparison reports current active residential listings from `rets_property` against sold residential transactions from `california_sold` for the requested period. The active-to-sold ratio is descriptive and should not be presented as months of supply unless the time basis is explicitly normalized.

## Monthly trends

Month-over-month (MoM) change compares a month's median close price with the immediately preceding month's median. Year-over-year (YoY) change compares it with the same calendar month one year earlier. When a comparison month lacks valid data, the correct result is `N/A`, not an estimate.

## Data-quality rules

Market calculations exclude future-dated closings and invalid denominators. Missing values remain unavailable rather than being invented. Market summaries should identify the city, period, and available sample size.
