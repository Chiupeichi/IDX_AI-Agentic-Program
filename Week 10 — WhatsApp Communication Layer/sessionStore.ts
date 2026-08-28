import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  clearSession,
  getSession,
  updateSession,
  type UserSession,
} from "../Week4 - Conversational Property Search Agent/session";
import type { WhatsAppSessionStore } from "./types";

export const DEFAULT_WHATSAPP_SESSION_DIRECTORY = path.resolve(
  process.cwd(),
  ".data",
  "whatsapp-sessions"
);

type StoredSession = {
  version: 1;
  updatedAt: string;
  session: UserSession;
};

function privateKey(userId: string) {
  return createHash("sha256").update(userId).digest("hex");
}

function safeSession(session: UserSession): UserSession {
  return {
    city: session.city,
    near: session.near,
    maxPrice: session.maxPrice,
    beds: session.beds,
    baths: session.baths,
    sqft: session.sqft,
    type: session.type,
    pool: session.pool,
    hasView: session.hasView,
    selectedListingId: session.selectedListingId,
    lastResults: session.lastResults?.slice(0, 5),
    conversationStep: session.conversationStep,
  };
}

export class FileWhatsAppSessionStore implements WhatsAppSessionStore {
  constructor(
    private readonly directory = DEFAULT_WHATSAPP_SESSION_DIRECTORY
  ) {}

  private fileFor(userId: string) {
    return path.join(this.directory, `${privateKey(userId)}.json`);
  }

  async restore(userId: string) {
    clearSession(userId);
    try {
      const stored = JSON.parse(
        await readFile(this.fileFor(userId), "utf8")
      ) as StoredSession;
      if (stored.version !== 1 || !stored.session) return;
      updateSession(userId, safeSession(stored.session));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  async persist(userId: string) {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const destination = this.fileFor(userId);
    const temporary = `${destination}.${process.pid}.${randomUUID()}.tmp`;
    const payload: StoredSession = {
      version: 1,
      updatedAt: new Date().toISOString(),
      session: safeSession(getSession(userId)),
    };
    await writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporary, destination);
  }
}
