import "dotenv/config";
import { orchestrate } from "./entrypoint";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const query = argument("query")?.trim();
  const userId = argument("user-id")?.trim() || "week9-cli-user";
  if (!query) {
    throw new Error(
      'Usage: npm run week9:ask -- --query "Find homes in Pasadena and tell me whether prices are rising" [--user-id USER]'
    );
  }
  const result = await orchestrate(query, userId);
  console.log(`Intent: ${result.intent}`);
  console.log(`Agents: ${result.agents.join(", ") || "none"}\n`);
  console.log(result.response);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  const { closePool } = await import("../Week 3 – MLS Database Integration/mysql");
  await closePool();
}
