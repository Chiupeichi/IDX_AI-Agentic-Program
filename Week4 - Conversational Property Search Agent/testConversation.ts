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
      "What is your maximum budget?"
    );
    assert.equal(
      await handleMessage(userId, "Under $1.2M"),
      "What property type do you prefer: condo, townhouse, or single family?"
    );
    assert.equal(
      await handleMessage(userId, "Single family"),
      "How many bedrooms do you need?"
    );

    const response = await handleMessage(userId, "At least 3 beds");
    assert.match(response, /I found \d+ matching listings/);
    assert.match(response, /Irvine/);
    assert.match(response, /photos/);

    const session = getSession(userId);
    assert.equal(session.city, "Irvine");
    assert.equal(session.maxPrice, 1_200_000);
    assert.equal(session.type, "SingleFamilyResidence");
    assert.equal(session.beds, 3);
    assert.ok(session.lastResults && session.lastResults.length > 0);

    assert.equal(
      await handleMessage(userId, "reset"),
      "Your search has been reset. Which city are you interested in?"
    );
    assert.equal(getSession(userId).conversationStep, 0);

    console.log("Week 4 conversation: follow-ups, results, memory, and reset passed.");
  } finally {
    await closePool();
  }
}

run().catch((error) => {
  console.error("Week 4 conversation validation failed:", error);
  process.exitCode = 1;
});
