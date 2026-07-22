import type { ListingRow } from "../Week 3 – MLS Database Integration/searchListings";

export interface UserSession {
  city?: string;
  near?: string;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  type?: string;
  pool?: boolean;
  hasView?: boolean;
  lastResults?: ListingRow[];
  conversationStep: number;
}

const sessions = new Map<string, UserSession>();

export function getSession(userId: string): UserSession {
  if (!sessions.has(userId)) {
    sessions.set(userId, { conversationStep: 0 });
  }

  return sessions.get(userId)!;
}

export function updateSession(
  userId: string,
  updates: Partial<UserSession>
): UserSession {
  const session = getSession(userId);

  const updatedSession = {
    ...session,
    ...updates,
  };

  sessions.set(userId, updatedSession);

  return updatedSession;
}

export function clearSession(userId: string) {
  sessions.delete(userId);
}
