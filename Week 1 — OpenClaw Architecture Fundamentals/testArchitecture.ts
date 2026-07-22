import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const document = await readFile(
  new URL("./architecture.md", import.meta.url),
  "utf8"
);

const requiredTerms = [
  "WhatsApp",
  "OpenClaw",
  "skill selector",
  "Session memory",
  "rets_property",
  "california_sold",
  "read-only",
  "```mermaid",
];

for (const term of requiredTerms) {
  assert.ok(document.includes(term), `architecture is missing: ${term}`);
}

assert.ok(
  document.indexOf("WhatsApp") < document.indexOf("OpenClaw gateway/runtime"),
  "workflow must begin at WhatsApp before entering OpenClaw"
);

console.log("Week 1 architecture document: PASS");
