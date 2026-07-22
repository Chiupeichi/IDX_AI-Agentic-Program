import { parsePropertyQuery } from "../Week 2 — Natural Language Property Search/propertySearch";
import {
  formatListingCard,
  searchActiveListings,
  type ListingRow,
} from "../Week 3 – MLS Database Integration/searchListings";
import {
  getSession,
  updateSession,
  clearSession,
  type UserSession,
} from "./session";

function formatListings(results: ListingRow[]): string {
  if (results.length === 0) {
    return "I couldn't find any matching active listings. Please try changing one of your preferences.";
  }

  const cards = results.slice(0, 5).map(formatListingCard);

  return `I found ${results.length} matching listings. Reply with a number to choose one:\n\n${cards.join(
    "\n\n"
  )}`;
}

function formatSelection(home: ListingRow, selection: number) {
  const distance =
    home.distanceMiles === null || home.distanceMiles === undefined
      ? ""
      : `\nDistance: ${Number(home.distanceMiles).toFixed(1)} miles`;

  return `You selected option ${selection}:\n\n🏠 ${home.L_Address}\n📍 ${home.L_City}, ${home.L_Zip}\n💰 $${Number(home.price).toLocaleString()}\n🛏 ${home.beds} beds | 🛁 ${home.baths} baths\n📐 ${home.sqft} sqft${distance}\n🏗 Built: ${home.YearBuilt || "N/A"}\n📅 DOM: ${home.DaysOnMarket ?? "N/A"}\n🏢 ${home.LO1_OrganizationName || "Listing office unavailable"}\n\nReply with new criteria to refine the search, or type reset to start over.`;
}

function getMissingQuestion(session: UserSession): string | null {
  if (!session.city && !session.near) {
    return "Which city or landmark are you interested in?";
  }

  if (!session.beds) {
    return "How many bedrooms do you need?";
  }

  return null;
}

export async function handleMessage(
  userId: string,
  message: string
): Promise<string> {
  const normalizedMessage = message.trim().toLowerCase();
  const currentSession = getSession(userId);

  const selectionMatch = normalizedMessage.match(/^(?:#|option\s*)?(\d+)$/i);
  if (selectionMatch && currentSession.lastResults?.length) {
    const selection = Number(selectionMatch[1]);
    const selected = currentSession.lastResults[selection - 1];
    if (!selected) {
      return `Please choose a number from 1 to ${Math.min(5, currentSession.lastResults.length)}.`;
    }
    return formatSelection(selected, selection);
  }

  if (
    normalizedMessage === "reset" ||
    normalizedMessage === "restart" ||
    normalizedMessage === "start over"
  ) {
    clearSession(userId);
    return "Your search has been reset. Which city or landmark are you interested in?";
  }

  const parsedFilters = parsePropertyQuery(message);

  const updates: Partial<UserSession> = {};

  if (parsedFilters.city) {
    updates.city = parsedFilters.city;
  }

  if (parsedFilters.near) {
    updates.near = parsedFilters.near;
    updates.city = undefined;
  }

  if (parsedFilters.maxPrice) {
    updates.maxPrice = parsedFilters.maxPrice;
  }

  if (parsedFilters.beds) {
    updates.beds = parsedFilters.beds;
  }

  if (parsedFilters.baths) {
    updates.baths = parsedFilters.baths;
  }

  if (parsedFilters.sqft) {
    updates.sqft = parsedFilters.sqft;
  }

  if (parsedFilters.type) {
    updates.type = parsedFilters.type;
  }

  if (parsedFilters.pool !== null) {
    updates.pool = parsedFilters.pool;
  }

  if (parsedFilters.hasView !== null) {
    updates.hasView = parsedFilters.hasView;
  }

  const updatedSession = updateSession(userId, {
    ...updates,
    conversationStep: currentSession.conversationStep + 1,
  });

  const nextQuestion = getMissingQuestion(updatedSession);

  if (nextQuestion) {
    return nextQuestion;
  }

  const results = await searchActiveListings(updatedSession, 1, 5);

  updateSession(userId, {
    lastResults: results,
  });

  return formatListings(results);
}
