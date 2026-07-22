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

  return `I found ${results.length} matching listings:\n\n${cards.join(
    "\n\n"
  )}`;
}

function getMissingQuestion(session: UserSession): string | null {
  if (!session.city) {
    return "Which city are you interested in?";
  }

  if (!session.maxPrice) {
    return "What is your maximum budget?";
  }

  if (!session.type) {
    return "What property type do you prefer: condo, townhouse, or single family?";
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

  if (
    normalizedMessage === "reset" ||
    normalizedMessage === "restart" ||
    normalizedMessage === "start over"
  ) {
    clearSession(userId);
    return "Your search has been reset. Which city are you interested in?";
  }

  const currentSession = getSession(userId);

  const parsedFilters = parsePropertyQuery(message);

  const updates: Partial<UserSession> = {};

  if (parsedFilters.city) {
    updates.city = parsedFilters.city;
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
