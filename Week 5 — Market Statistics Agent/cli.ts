import { closePool } from "../Week 3 – MLS Database Integration/mysql";
import { answerMarketQuestion } from "./marketStats";

function argument(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const city = argument("city")?.trim();
  if (!city) {
    throw new Error('Usage: npm run week5:market -- --city "Irvine" [--months 12]');
  }

  const rawMonths = argument("months");
  const months = rawMonths === undefined ? 12 : Number(rawMonths);
  console.log(await answerMarketQuestion(city, months));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await closePool();
}
