import { closePool } from "../Week 3 – MLS Database Integration/mysql";
import { handleMessage } from "./conversation";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const query = argument("query")?.trim();
  if (!query) {
    throw new Error('Usage: npm run property:search -- --query "2b2b near USC"');
  }

  console.log(await handleMessage("openclaw-property-search", query));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closePool();
}
