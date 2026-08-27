import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  clearSession,
  getSession,
  updateSession,
} from "../Week4 - Conversational Property Search Agent/session";
import type { OrchestrationResult } from "../Week 9 — Multi-Agent Orchestration/types";
import { chunkWhatsAppText, formatForWhatsApp } from "./formatter";
import { onWhatsAppMessage } from "./handler";
import { FileWhatsAppSessionStore } from "./sessionStore";

const baseResult: OrchestrationResult = {
  intent: "mixed",
  agents: ["propertySearchAgent", "marketStatsAgent"],
  sections: [],
  response:
    "🏠 Property matches\n1. 🏠 100 Main Street\n📍 Pasadena, 91101\n\n📊 Market context\nMedian close price: $1,200,000",
};

const formatted = formatForWhatsApp(baseResult);
assert.equal(formatted.length, 1);
assert.match(formatted[0], /\*🏠 Property matches\*/);
assert.match(formatted[0], /\*1\. 🏠 100 Main Street\*/);
assert.match(formatted[0], /\*📊 Market context\*/);

const chunked = chunkWhatsAppText("A".repeat(450) + "\n\n" + "B".repeat(450), 500);
assert.equal(chunked.length, 2);
assert.ok(chunked.every((message) => message.length <= 500));
assert.throws(() => chunkWhatsAppText("test", 4_001), /chunk limit/);

const callOrder: string[] = [];
const reply = await onWhatsAppMessage("Find homes and market trends", "+15550001111", {
  sendTypingIndicator: async () => {
    callOrder.push("typing");
  },
  sessionStore: {
    async restore() {
      callOrder.push("restore");
    },
    async persist() {
      callOrder.push("persist");
    },
  },
  async orchestrate() {
    callOrder.push("orchestrate");
    return baseResult;
  },
});
assert.equal(reply.ok, true);
assert.equal(reply.intent, "mixed");
assert.deepEqual(callOrder, ["typing", "restore", "orchestrate", "persist"]);

const errors: unknown[] = [];
const failed = await onWhatsAppMessage("Find homes", "+15550001111", {
  sessionStore: {
    async restore() {},
    async persist() {},
  },
  async orchestrate() {
    throw new Error("private database detail");
  },
  onError(error) {
    errors.push(error);
  },
});
assert.equal(failed.ok, false);
assert.deepEqual(failed.messages, ["Sorry, I hit an issue. Please try again."]);
assert.doesNotMatch(failed.messages[0], /database detail/);
assert.equal(errors.length, 1);

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "idx-week10-sessions-")
);
const persistentUser = "+15559998888";
try {
  const store = new FileWhatsAppSessionStore(temporaryDirectory);
  clearSession(persistentUser);
  updateSession(persistentUser, {
    city: "Pasadena",
    beds: 3,
    conversationStep: 2,
  });
  await store.persist(persistentUser);
  clearSession(persistentUser);
  assert.equal(getSession(persistentUser).city, undefined);
  await store.restore(persistentUser);
  assert.equal(getSession(persistentUser).city, "Pasadena");
  assert.equal(getSession(persistentUser).beds, 3);

  const files = await readdir(temporaryDirectory);
  assert.equal(files.length, 1);
  assert.doesNotMatch(files[0], /15559998888/);
  const storedText = await readFile(path.join(temporaryDirectory, files[0]), "utf8");
  assert.doesNotMatch(storedText, /15559998888/);
} finally {
  clearSession(persistentUser);
  await rm(temporaryDirectory, { recursive: true, force: true });
}

console.log(
  "Week 10 WhatsApp layer: PASS (formatting, chunking, typing, safe errors, persistent sessions)"
);
