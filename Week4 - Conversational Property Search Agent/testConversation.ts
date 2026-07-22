import assert from "node:assert/strict";
import { closePool } from "../Week 3 – MLS Database Integration/mysql";
import { handleMessage } from "./conversation";
import { clearSession, getSession } from "./session";

async function run() {
  const userId = "conversation-test-user";
  clearSession(userId);

  try {
    assert.equal(
      await handleMessage(userId, "Find homes in Irvine"),
      "How many bedrooms do you need?"
    );

    const response = await handleMessage(userId, "At least 3 beds");
    assert.match(response, /I found \d+ matching listings/);
    assert.match(response, /Reply with a number/);
    assert.match(response, /Irvine/);
    assert.match(response, /photos/);

    const session = getSession(userId);
    assert.equal(session.city, "Irvine");
    assert.equal(session.beds, 3);
    assert.ok(session.lastResults && session.lastResults.length > 0);

    const selection = await handleMessage(userId, "1");
    assert.match(selection, /You selected option 1/);
    assert.match(selection, /DOM:/);

    const uscUserId = "usc-conversation-test-user";
    clearSession(uscUserId);
    const uscResponse = await handleMessage(uscUserId, "我想找 USC 附近的 2b2b");
    assert.match(uscResponse, /I found \d+ matching listings/);
    assert.match(uscResponse, /miles from landmark/);
    assert.equal(getSession(uscUserId).near, "USC");
    assert.equal(getSession(uscUserId).beds, 2);
    assert.equal(getSession(uscUserId).baths, 2);

    assert.equal(
      await handleMessage(userId, "reset"),
      "Your search has been reset. Which city or landmark are you interested in?"
    );
    assert.equal(getSession(userId).conversationStep, 0);

    console.log("Week 4 conversation: follow-ups, landmark search, selection, memory, and reset passed.");
  } finally {
    await closePool();
  }
}

run().catch((error) => {
  console.error("Week 4 conversation validation failed:", error);
  process.exitCode = 1;
});
