import "dotenv/config";
import { closePool } from "../Week 03 — MLS Database Integration/mysql";
import { orchestrate } from "../Week 09 — Multi-Agent Orchestration/entrypoint";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const message = argument("message")?.trim();
  const userId = argument("user-id")?.trim();
  if (!message || !userId) {
    throw new Error(
      'Usage: npm run week11:email -- --message "Draft a weekly market report for Pasadena to manager@example.com" --user-id "+15551234567"'
    );
  }
  const result = await orchestrate(message, userId);
  console.log(result.response);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Email workflow failed");
  process.exitCode = 1;
} finally {
  await closePool();
}
