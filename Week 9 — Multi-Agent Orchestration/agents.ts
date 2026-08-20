import type { ListingRow } from "../Week 3 – MLS Database Integration/searchListings";
import type { AgentRegistry } from "./types";

function formatSearchResults(
  listings: ListingRow[],
  formatListingCard: (home: ListingRow, index?: number) => string
) {
  if (listings.length === 0) {
    return "I couldn't find any matching active listings. Try changing one preference.";
  }
  return `I found ${listings.length} active listings:\n\n${listings
    .map((listing, index) => formatListingCard(listing, index))
    .join("\n\n")}`;
}

export function extractCity(query: string) {
  const match = query.match(
    /\b(?:in|for|around|near)\s+([A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*)*?)(?=\s+(?:and|under|below|with|where|that|to|over|during)\b|[,.!?]|$)/i
  );
  return match?.[1]?.trim() ?? null;
}

export function createDefaultAgentRegistry(): AgentRegistry {
  return {
    async propertySearchAgent({ query, userId }) {
      const [{ parsePropertyQuery }, searchModule, sessionModule] = await Promise.all([
        import("../Week 2 — Natural Language Property Search/propertySearch"),
        import("../Week 3 – MLS Database Integration/searchListings"),
        import("../Week4 - Conversational Property Search Agent/session"),
      ]);
      const filters = parsePropertyQuery(query);
      if (!filters.city && !filters.near) {
        return "Which city or landmark are you interested in?";
      }
      const listings = await searchModule.searchActiveListings(filters, 1, 5);
      sessionModule.updateSession(userId, {
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== null)
        ),
        lastResults: listings,
        conversationStep: sessionModule.getSession(userId).conversationStep + 1,
      });
      return formatSearchResults(listings, searchModule.formatListingCard);
    },

    async marketStatsAgent({ query }) {
      const city = extractCity(query);
      if (!city) return "Which California city should I analyze?";
      const { answerMarketQuestion } = await import(
        "../Week 5 — Market Statistics Agent/marketStats"
      );
      return answerMarketQuestion(city, 12);
    },

    async recommendationAgent({ userId }) {
      const [{ getSession }, recommendationModule] = await Promise.all([
        import("../Week4 - Conversational Property Search Agent/session"),
        import("../Week 7 — Recommendation Engine/recommendation"),
      ]);
      const selected = getSession(userId).lastResults?.[0];
      if (!selected?.L_ListingID) {
        return "Search for properties and select a listing before asking for recommendations.";
      }
      const recommendations = await recommendationModule.recommendSimilarListings(
        selected.L_ListingID,
        { topK: 5 }
      );
      return recommendationModule.formatRecommendations(
        recommendations.target,
        recommendations.recommendations
      );
    },

    async ragAgent({ query }) {
      const { answerRagQuestion, formatRagAnswer } = await import(
        "../Week 8 — Retrieval-Augmented Generation/rag"
      );
      return formatRagAnswer(await answerRagQuestion(query));
    },

    async emailDraftAgent({ query, userId }) {
      const { getSession } = await import(
        "../Week4 - Conversational Property Search Agent/session"
      );
      const listings = getSession(userId).lastResults?.slice(0, 5) ?? [];
      const listingLines = listings.map(
        (listing, index) =>
          `${index + 1}. ${listing.L_Address}, ${listing.L_City} — $${Number(
            listing.price
          ).toLocaleString()} (${listing.beds} bd/${listing.baths} ba)`
      );
      let body: string;
      if (listingLines.length) {
        body = `Here are the properties we discussed:\n\n${listingLines.join("\n")}`;
      } else {
        const city = extractCity(query);
        if (city && /\b(?:market|price|trend|inventory)\b/i.test(query)) {
          const { answerMarketQuestion } = await import(
            "../Week 5 — Market Statistics Agent/marketStats"
          );
          body = await answerMarketQuestion(city, 12);
        } else {
          body = `Requested summary: ${query}`;
        }
      }
      return `EMAIL DRAFT — NOT SENT\nStatus: pending approval\nSubject: Property search summary\n\n${body}`;
    },
  };
}
