import assert from "node:assert/strict";
import { closePool } from "../Week 03 — MLS Database Integration/mysql";
import { handleMessage } from "./conversation";
import { clearSession, getSession, updateSession } from "./session";

async function run() {
  const userId = "conversation-test-user";
  clearSession(userId);

  try {
    assert.equal(
      await handleMessage(userId, "Find homes in Irvine"),
      "What is your budget?"
    );
    assert.equal(getSession(userId).city, "Irvine");

    assert.equal(
      await handleMessage(userId, "My budget is $1,500,000"),
      "How many bedrooms do you need?"
    );

    const response = await handleMessage(userId, "At least 3 beds");
    assert.match(response, /I found \d+ matching listings/);
    assert.match(response, /Reply with a number/);
    assert.match(response, /Irvine/);
    assert.match(response, /photos/);

    const session = getSession(userId);
    assert.equal(session.city, "Irvine");
    assert.equal(session.maxPrice, 1_500_000);
    assert.equal(session.beds, 3);
    assert.ok(session.lastResults && session.lastResults.length > 0);

    const selection = await handleMessage(userId, "1");
    assert.match(selection, /You selected option 1/);
    assert.match(selection, /DOM:/);

    const uscUserId = "usc-conversation-test-user";
    clearSession(uscUserId);
    assert.equal(
      await handleMessage(uscUserId, "我想找 USC 附近的 2b2b"),
      "What is your budget?"
    );
    const uscResponse = await handleMessage(uscUserId, "Under $1,500,000");
    assert.match(uscResponse, /I found \d+ matching listings/);
    assert.match(uscResponse, /miles from landmark/);
    assert.equal(getSession(uscUserId).near, "USC");
    assert.equal(getSession(uscUserId).beds, 2);
    assert.equal(getSession(uscUserId).baths, 2);
    assert.equal(getSession(uscUserId).maxPrice, 1_500_000);

    const existingBudgetUser = "existing-budget-new-search-test-user";
    clearSession(existingBudgetUser);
    updateSession(existingBudgetUser, {
      city: "San Jose",
      maxPrice: 1_000_000,
      beds: 3,
      conversationStep: 5,
    });
    assert.equal(
      await handleMessage(existingBudgetUser, "Help me find a home in San Jose"),
      "What is your budget?"
    );
    assert.equal(getSession(existingBudgetUser).city, "San Jose");
    assert.equal(getSession(existingBudgetUser).maxPrice, undefined);
    assert.equal(getSession(existingBudgetUser).lastResults, undefined);
    clearSession(existingBudgetUser);

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
