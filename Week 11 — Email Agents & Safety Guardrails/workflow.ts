import type { ListingRow } from "../Week 3 – MLS Database Integration/searchListings";
import type { MarketStats } from "../Week 5 — Market Statistics Agent/marketStats";
import { FileEmailDraftStore } from "./draftStore";
import {
  approveAndSendEmail,
  cancelEmail,
  draftEmail,
  formatDraftPreview,
  formatSentConfirmation,
} from "./emailService";
import {
  buildListingEmailTemplate,
  buildWeeklyMarketReportTemplate,
} from "./templates";
import type { EmailTransport, EmailUseCase } from "./types";

const draftIdPattern =
  "([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})";

function recipientFrom(message: string) {
  return message.match(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/)?.[0] ?? null;
}

function useCaseFrom(message: string): EmailUseCase {
  if (/\b(?:weekly|market report|market summary|trend|inventory)\b/i.test(message)) {
    return "weekly_market_report";
  }
  if (/\b(?:new listing|listing alert)\b/i.test(message)) return "listing_alert";
  if (/\b(?:recommendation|digest)\b/i.test(message)) {
    return "recommendation_digest";
  }
  return "property_summary";
}

export type EmailWorkflowOptions = {
  city?: string | null;
  listings?: readonly ListingRow[];
  store?: FileEmailDraftStore;
  transport?: EmailTransport;
  loadMarketStats?: (city: string, months: number) => Promise<MarketStats>;
};

export async function handleEmailWorkflowMessage(
  message: string,
  userId: string,
  options: EmailWorkflowOptions = {}
) {
  const normalized = message.trim();
  if (!normalized) throw new Error("Email request is required");

  const approveMatch = normalized.match(
    new RegExp(`\\bapprove\\s+(?:the\\s+)?email\\s+${draftIdPattern}\\b`, "i")
  );
  if (approveMatch) {
    const sent = await approveAndSendEmail(approveMatch[1], userId, options);
    return formatSentConfirmation(sent);
  }

  const cancelMatch = normalized.match(
    new RegExp(`\\bcancel\\s+(?:the\\s+)?email\\s+${draftIdPattern}\\b`, "i")
  );
  if (cancelMatch) {
    const cancelled = await cancelEmail(cancelMatch[1], userId, options);
    return `EMAIL CANCELLED\nDraft ID: ${cancelled.id}\nStatus: cancelled`;
  }

  const to = recipientFrom(normalized);
  if (!to) {
    return "Which email address should receive the draft? Include it in the request; no email will be sent until you approve the preview.";
  }

  const useCase = useCaseFrom(normalized);
  let content;
  if (useCase === "weekly_market_report") {
    const city = options.city?.trim();
    if (!city) return "Which California city should the market report cover?";
    const loadMarketStats =
      options.loadMarketStats ??
      (async (marketCity: string, months: number) => {
        const { getMarketStats } = await import(
          "../Week 5 — Market Statistics Agent/marketStats"
        );
        return getMarketStats(marketCity, months);
      });
    content = buildWeeklyMarketReportTemplate(
      to,
      await loadMarketStats(city, 12)
    );
  } else {
    content = buildListingEmailTemplate(to, options.listings ?? [], useCase);
  }

  const draft = await draftEmail(userId, content, options);
  return formatDraftPreview(draft);
}
