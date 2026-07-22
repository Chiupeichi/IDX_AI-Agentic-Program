import assert from "node:assert/strict";
import { clearSession, getSession, updateSession } from "./session";

const userId = "session-test-user";
clearSession(userId);

assert.deepEqual(getSession(userId), { conversationStep: 0 });
updateSession(userId, { city: "Irvine", conversationStep: 1 });
updateSession(userId, { maxPrice: 1_200_000, conversationStep: 2 });
updateSession(userId, { beds: 3, conversationStep: 3 });

assert.deepEqual(getSession(userId), {
  city: "Irvine",
  maxPrice: 1_200_000,
  beds: 3,
  conversationStep: 3,
});

clearSession(userId);
assert.deepEqual(getSession(userId), { conversationStep: 0 });

console.log("Week 4 session memory: update and reset passed.");
