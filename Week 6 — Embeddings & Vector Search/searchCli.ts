import "dotenv/config";
import {
  formatSemanticResults,
  semanticPropertySearch,
} from "./semanticSearch";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const description = argument("query")?.trim();
  if (!description) {
    throw new Error(
      'Usage: npm run week6:search -- --query "charming craftsman with mountain views"'
    );
  }
  const rawTopK = argument("top-k");
  const topK = rawTopK === undefined ? 5 : Number(rawTopK);
  const results = await semanticPropertySearch(description, {
    topK,
    indexPath: argument("index"),
  });
  console.log(formatSemanticResults(description, results));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
