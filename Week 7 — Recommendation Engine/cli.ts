import "dotenv/config";
import { closePool } from "../Week 3 – MLS Database Integration/mysql";
import {
  formatRecommendations,
  recommendSimilarListings,
} from "./recommendation";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const listingId = argument("listing-id")?.trim();
  if (!listingId) {
    throw new Error(
      'Usage: npm run week7:recommend -- --listing-id "LISTING_ID"'
    );
  }
  const rawTopK = argument("top-k");
  const topK = rawTopK === undefined ? 5 : Number(rawTopK);
  const result = await recommendSimilarListings(listingId, {
    topK,
    indexPath: argument("index"),
  });
  console.log(formatRecommendations(result.target, result.recommendations));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closePool();
}
