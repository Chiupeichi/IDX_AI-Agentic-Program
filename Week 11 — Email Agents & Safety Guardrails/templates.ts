import type { ListingRow } from "../Week 3 – MLS Database Integration/searchListings";
import type { MarketStats } from "../Week 5 — Market Statistics Agent/marketStats";
import type { EmailDraftContent, EmailUseCase } from "./types";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function money(value: number | null) {
  return value === null
    ? "N/A"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
}

function percent(value: number | null) {
  return value === null ? "N/A" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function buildWeeklyMarketReportTemplate(
  to: string,
  stats: MarketStats
): EmailDraftContent {
  const latest = stats.trend.at(-1);
  const subject = `${stats.city} Weekly Market Report`;
  const lines = [
    `${stats.city} Market Report`,
    "",
    `Reporting period: trailing ${stats.months} months`,
    `Median close price: ${money(stats.medianPrice)}`,
    `Average close price: ${money(stats.averagePrice)}`,
    `Average price per square foot: ${money(stats.averagePricePerSqft)}`,
    `Average days on market: ${stats.averageDaysOnMarket?.toFixed(1) ?? "N/A"}`,
    `List-to-close ratio: ${stats.listToCloseRatioPct?.toFixed(2) ?? "N/A"}%`,
    `Inventory: ${stats.activeInventory} active listings vs ${stats.soldCount} sold transactions`,
    `Latest monthly median change: MoM ${percent(latest?.monthOverMonthPct ?? null)}, YoY ${percent(latest?.yearOverYearPct ?? null)}`,
    "",
    "This automated summary is based on MLS-derived market data and is not an appraisal.",
  ];
  const rows = lines
    .slice(2, 9)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  return {
    to,
    subject,
    text: lines.join("\n"),
    html: `<h1>${escapeHtml(stats.city)} Market Report</h1><ul>${rows}</ul><p>This automated summary is based on MLS-derived market data and is not an appraisal.</p>`,
    useCase: "weekly_market_report",
  };
}

function headingFor(useCase: Exclude<EmailUseCase, "weekly_market_report">) {
  if (useCase === "listing_alert") return "New Listing Alert";
  if (useCase === "recommendation_digest") return "Property Recommendation Digest";
  return "Property Summary";
}

export function buildListingEmailTemplate(
  to: string,
  listings: readonly ListingRow[],
  useCase: Exclude<EmailUseCase, "weekly_market_report"> = "property_summary"
): EmailDraftContent {
  const safeListings = listings.slice(0, 5);
  if (safeListings.length === 0) {
    throw new Error("Search for properties before drafting a listing email");
  }
  const heading = headingFor(useCase);
  const textCards = safeListings.map(
    (listing, index) =>
      `${index + 1}. ${listing.L_Address}, ${listing.L_City} ${listing.L_Zip}\n` +
      `   $${Number(listing.price).toLocaleString()} | ${listing.beds} bd/${listing.baths} ba | ${listing.sqft} sqft | ${listing.DaysOnMarket ?? "N/A"} DOM`
  );
  const htmlCards = safeListings
    .map(
      (listing) =>
        `<li><strong>${escapeHtml(listing.L_Address)}, ${escapeHtml(listing.L_City)} ${escapeHtml(listing.L_Zip)}</strong><br>` +
        `$${Number(listing.price).toLocaleString()} | ${listing.beds} bd/${listing.baths} ba | ${listing.sqft} sqft | ${listing.DaysOnMarket ?? "N/A"} DOM</li>`
    )
    .join("");
  return {
    to,
    subject: heading,
    text: `${heading}\n\n${textCards.join("\n\n")}\n\nMLS information should be independently verified.`,
    html: `<h1>${heading}</h1><ol>${htmlCards}</ol><p>MLS information should be independently verified.</p>`,
    useCase,
  };
}
