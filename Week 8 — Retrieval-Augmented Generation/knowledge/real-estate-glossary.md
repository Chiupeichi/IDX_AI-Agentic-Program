# Real Estate Terminology Glossary

Source authority: IDX Exchange AI Agentic Engineer Intern Handbook, Summer 2026, Weeks 3, 5, 7, and 8. Definitions are scoped to how the project uses these terms.

## Days on market (DOM)

DOM means days on market. It measures how long a property was marketed before going under contract, based on the available listing and contract dates. In this project, active-listing DOM comes from `rets_property.DaysOnMarket`, while historical transaction DOM comes from `california_sold.DaysOnMarket`. Lower DOM can indicate faster sales, but DOM should be interpreted with location, price range, property type, and sample size.

## Comparable sale (comp)

A comp is a recently sold property used to compare or support a price estimate for another property. Week 7 selects comps from `california_sold` in the same city, with residential property type, recent close dates, and similar living area. A comp-supported estimate is an automated market-data comparison, not a professional appraisal.

## Escrow

Escrow is a neutral process in which documents, funds, and instructions are held and coordinated until the conditions of a real-estate transaction are satisfied. Specific escrow practices and legal requirements can vary, so legal questions must be grounded in an applicable authoritative source rather than inferred from this glossary.

## Price per square foot

Price per square foot divides a property's price by its living area. Week 5 calculates historical average price per square foot as `ClosePrice / LivingArea` and excludes missing or non-positive living-area values.

## List-to-close ratio

The list-to-close ratio compares the final close price with the last list price:

`list-to-close ratio = ClosePrice / ListPrice * 100`

A value of 100% means the property closed at the listed price. A value above 100% means it closed above list price; below 100% means it closed below list price. The ratio can indicate negotiation leverage at a market level, but it does not explain concessions, financing terms, or property condition. Records with missing or non-positive list prices must be excluded.

## Cap rate

Capitalization rate, or cap rate, is commonly calculated as annual net operating income divided by property value or purchase price. It is mainly used for income-producing property analysis. This project does not calculate cap rate because the supplied tables do not include a complete, verified net operating income field.

## Retrieval-augmented generation (RAG)

RAG retrieves relevant passages from indexed source documents and gives those passages to a language model as context. The model must answer only from that retrieved context and disclose when the sources do not contain enough information.
