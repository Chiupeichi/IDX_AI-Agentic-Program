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
      const normalizedQuery = query.trim().toLowerCase();
      if (/^(?:reset|restart|start over)$/.test(normalizedQuery)) {
        sessionModule.clearSession(userId);
        return "Your search has been reset. Which city or landmark are you interested in?";
      }

      const currentSession = sessionModule.getSession(userId);
      const selectionMatch = normalizedQuery.match(/^(?:#|option\s*)?(\d+)$/i);
      if (selectionMatch && currentSession.lastResults?.length) {
        const selection = Number(selectionMatch[1]);
        const selected = currentSession.lastResults[selection - 1];
        if (!selected) {
          return `Please choose a number from 1 to ${Math.min(
            5,
            currentSession.lastResults.length
          )}.`;
        }
        sessionModule.updateSession(userId, {
          selectedListingId: selected.L_ListingID,
          conversationStep: currentSession.conversationStep + 1,
        });
        return `You selected option ${selection}:\n\n${searchModule.formatListingCard(
          selected
        )}\n\nAsk for similar listings to see comp-validated recommendations.`;
      }

      const filters = parsePropertyQuery(query);
      const updates = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== null)
      );
      if (filters.city) updates.near = undefined;
      if (filters.near) updates.city = undefined;
      const mergedFilters = { ...currentSession, ...updates };
      if (!mergedFilters.city && !mergedFilters.near) {
        return "Which city or landmark are you interested in?";
      }
      const listings = await searchModule.searchActiveListings(mergedFilters, 1, 5);
      sessionModule.updateSession(userId, {
        ...updates,
        selectedListingId: undefined,
        lastResults: listings,
        conversationStep: currentSession.conversationStep + 1,
      });
      return formatSearchResults(listings, searchModule.formatListingCard);
    },

    async marketStatsAgent({ query, userId }) {
      const cityFromQuery = extractCity(query);
      const { getSession } = await import(
        "../Week4 - Conversational Property Search Agent/session"
      );
      const city = cityFromQuery ?? getSession(userId).city ?? null;
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
      const session = getSession(userId);
      const selectedId =
        session.selectedListingId ?? session.lastResults?.[0]?.L_ListingID;
      if (!selectedId) {
        return "Search for properties and select a listing before asking for recommendations.";
      }
      const recommendations = await recommendationModule.recommendSimilarListings(
        selectedId,
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
