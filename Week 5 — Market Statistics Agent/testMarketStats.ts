import assert from "node:assert/strict";
import { closePool } from "../Week 3 – MLS Database Integration/mysql";
import {
  answerMarketQuestion,
  calculatePercentChange,
  getMarketStats,
  type MarketTrendPoint,
} from "./marketStats";

function isAscending(points: MarketTrendPoint[]) {
  return points.every(
    (point, index) => index === 0 || points[index - 1].month < point.month
  );
}

try {
  await assert.rejects(() => getMarketStats("  "), /city is required/);
  await assert.rejects(() => getMarketStats("Irvine", 0), /between 1 and 60/);
  assert.equal(calculatePercentChange(110, 100), 10);
  assert.equal(calculatePercentChange(90, 100), -10);
  assert.equal(calculatePercentChange(100, 0), null);

  const stats = await getMarketStats("Irvine", 12);
  assert.equal(stats.city, "Irvine");
  assert.ok(stats.soldCount > 0, "Irvine should have sold records");
  assert.ok(stats.activeInventory >= 0);
  assert.ok((stats.medianPrice ?? 0) > 0);
  assert.ok((stats.averagePrice ?? 0) > 0);
  assert.ok((stats.averagePricePerSqft ?? 0) > 0);
  assert.ok((stats.averageDaysOnMarket ?? -1) >= 0);
  assert.ok((stats.listToCloseRatioPct ?? 0) > 0);
  assert.equal(stats.trend.length, 12);
  assert.ok(isAscending(stats.trend), "trend must be chronological");
  assert.ok(
    stats.trend.some((point) => point.monthOverMonthPct !== null),
    "trend should contain at least one MoM comparison"
  );
  // The supplied Irvine data begins in 2025-12, so a real YoY comparison may
  // correctly be unavailable. The pure calculation is asserted above and the
  // user-facing report must preserve the YoY field as N/A rather than inventing it.

  const answer = await answerMarketQuestion("Irvine", 12);
  for (const term of [
    "Median close price",
    "Average DOM",
    "List-to-close ratio",
    "Inventory",
    "12-month trend",
    "MoM",
    "YoY",
  ]) {
    assert.ok(answer.includes(term), `answer is missing ${term}`);
  }

  console.log(
    `Week 5 market statistics: PASS (${stats.soldCount} sold, ${stats.activeInventory} active)`
  );
} finally {
  await closePool();
}
