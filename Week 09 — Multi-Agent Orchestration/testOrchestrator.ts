import assert from "node:assert/strict";
import {
  clearSession,
  getSession,
  updateSession,
} from "../Week 04 — Conversational Property Search Agent/session";
import { createDefaultAgentRegistry } from "./agents";
import { classifyIntent } from "./classifier";
import { orchestrate } from "./orchestrator";
import type { AgentName, AgentRegistry } from "./types";

assert.equal(classifyIntent("Find condos in Irvine"), "search");
assert.equal(classifyIntent("How is the market in Irvine?"), "market");
assert.equal(
  classifyIntent("Is now a good time to buy in San Diego?"),
  "market"
);
assert.equal(
  classifyIntent("What is the average home price in Pasadena?"),
  "market"
);
assert.equal(classifyIntent("Show me similar homes"), "recommend");
assert.equal(
  classifyIntent("Show me homes similar to this listing"),
  "recommend"
);
assert.equal(classifyIntent("What does DOM mean?"), "knowledge");
assert.equal(classifyIntent("What columns are in california_sold?"), "knowledge");
assert.equal(classifyIntent("What homes are in Irvine?"), "search");
assert.equal(classifyIntent("600k"), "search");
assert.equal(classifyIntent("My budget is $750,000"), "search");
assert.equal(classifyIntent("Draft an email with these properties"), "email");
assert.equal(
  classifyIntent(
    "Find me affordable homes in Pasadena and tell me whether prices are rising."
  ),
  "mixed"
);
assert.equal(classifyIntent("Tell me a joke"), "unknown");

const calls: AgentName[] = [];
let searchStarted = false;
let marketStarted = false;
const stub = (agent: AgentName, response: string) => async () => {
  calls.push(agent);
  if (agent === "propertySearchAgent") searchStarted = true;
  if (agent === "marketStatsAgent") marketStarted = true;
  await Promise.resolve();
  if (agent === "propertySearchAgent") assert.equal(marketStarted, true);
  if (agent === "marketStatsAgent") assert.equal(searchStarted, true);
  return response;
};

const agents: AgentRegistry = {
  propertySearchAgent: stub("propertySearchAgent", "Five Pasadena listings"),
  marketStatsAgent: stub("marketStatsAgent", "Pasadena prices are rising"),
  recommendationAgent: stub("recommendationAgent", "Five similar listings"),
  ragAgent: stub("ragAgent", "DOM means days on market"),
  emailDraftAgent: stub("emailDraftAgent", "EMAIL DRAFT — NOT SENT"),
};

const mixed = await orchestrate(
  "Find me affordable homes in Pasadena and tell me whether prices are rising.",
  "week9-test-user",
  agents
);
assert.equal(mixed.intent, "mixed");
assert.deepEqual(mixed.agents, ["propertySearchAgent", "marketStatsAgent"]);
assert.match(mixed.response, /Property matches/);
assert.match(mixed.response, /Five Pasadena listings/);
assert.match(mixed.response, /Market context/);
assert.match(mixed.response, /prices are rising/);

calls.length = 0;
const knowledge = await orchestrate(
  "What does DOM mean?",
  "week9-test-user",
  agents
);
assert.deepEqual(knowledge.agents, ["ragAgent"]);
assert.deepEqual(calls, ["ragAgent"]);

calls.length = 0;
const recommendation = await orchestrate(
  "Recommend similar listings",
  "week9-test-user",
  agents
);
assert.deepEqual(recommendation.agents, ["recommendationAgent"]);
assert.deepEqual(calls, ["recommendationAgent"]);

calls.length = 0;
const email = await orchestrate(
  "Draft an email with these properties",
  "week9-test-user",
  agents
);
assert.equal(email.intent, "email");
assert.match(email.response, /NOT SENT/);
assert.deepEqual(calls, ["emailDraftAgent"]);

calls.length = 0;
const unknown = await orchestrate("Tell me a joke", "week9-test-user", agents);
assert.equal(unknown.intent, "unknown");
assert.deepEqual(unknown.agents, []);
assert.deepEqual(calls, []);

await assert.rejects(() => orchestrate("", "user", agents), /query is required/);
await assert.rejects(() => orchestrate("Find homes", "", agents), /userId is required/);

const budgetUser = "week9-budget-prompt-user";
clearSession(budgetUser);
const defaultAgents = createDefaultAgentRegistry();
assert.equal(
  await defaultAgents.propertySearchAgent({
    query: "Help me find a home in Concord",
    userId: budgetUser,
  }),
  "What is your budget?"
);
assert.equal(getSession(budgetUser).city, "Concord");
assert.equal(getSession(budgetUser).maxPrice, undefined);

assert.equal(
  await defaultAgents.propertySearchAgent({
    query: "Under $1 million",
    userId: budgetUser,
  }),
  "How many bedrooms do you need?"
);
assert.equal(getSession(budgetUser).maxPrice, 1_000_000);

assert.equal(
  await defaultAgents.propertySearchAgent({
    query: "3 bedrooms",
    userId: budgetUser,
  }),
  "How many bathrooms do you need?"
);
assert.equal(getSession(budgetUser).beds, 3);

updateSession(budgetUser, {
  city: "San Jose",
  maxPrice: 1_000_000,
  beds: 3,
  baths: 2,
  pool: true,
  conversationStep: 27,
});
assert.equal(
  await defaultAgents.propertySearchAgent({
    query: "Help me find a home in San Jose",
    userId: budgetUser,
  }),
  "What is your budget?"
);
assert.equal(getSession(budgetUser).city, "San Jose");
assert.equal(getSession(budgetUser).maxPrice, undefined);
assert.equal(getSession(budgetUser).beds, undefined);
assert.equal(getSession(budgetUser).baths, undefined);
assert.equal(getSession(budgetUser).pool, undefined);
clearSession(budgetUser);

console.log(
  "Week 9 orchestration: PASS (five-agent routing, parallel mixed intent, unified response)"
);
