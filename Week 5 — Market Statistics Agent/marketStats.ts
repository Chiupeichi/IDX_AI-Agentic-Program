import { query } from "../Week 3 – MLS Database Integration/mysql";

type RawSummaryRow = {
  soldCount: number | string;
  averagePrice: number | string | null;
  averagePricePerSqft: number | string | null;
  averageDaysOnMarket: number | string | null;
  listToCloseRatioPct: number | string | null;
  currentMonth: string;
};

type RawMedianRow = {
  medianPrice: number | string | null;
};

type RawInventoryRow = {
  activeInventory: number | string;
};

type RawTrendRow = {
  month: string;
  sales: number | string;
  averagePrice: number | string | null;
  medianPrice: number | string | null;
  averagePricePerSqft: number | string | null;
  averageDaysOnMarket: number | string | null;
};

export type MarketTrendPoint = {
  month: string;
  sales: number;
  averagePrice: number | null;
  medianPrice: number | null;
  averagePricePerSqft: number | null;
  averageDaysOnMarket: number | null;
  monthOverMonthPct: number | null;
  yearOverYearPct: number | null;
};

export type MarketStats = {
  city: string;
  months: number;
  soldCount: number;
  activeInventory: number;
  averagePrice: number | null;
  medianPrice: number | null;
  averagePricePerSqft: number | null;
  averageDaysOnMarket: number | null;
  listToCloseRatioPct: number | null;
  activeToSoldRatio: number | null;
  trend: MarketTrendPoint[];
};

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function monthOffset(month: string, offset: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new Error(`Invalid database month: ${month}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function calculatePercentChange(
  current: number | null,
  previous: number | null
) {
  if (current === null || previous === null || previous === 0) return null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function getMarketStats(city: string, months = 12): Promise<MarketStats> {
  const normalizedCity = city.trim();
  if (!normalizedCity) throw new Error("city is required");
  if (!Number.isInteger(months) || months < 1 || months > 60) {
    throw new RangeError("months must be an integer between 1 and 60");
  }

  const summarySql = `
    SELECT
      COUNT(*) AS soldCount,
      AVG(ClosePrice) AS averagePrice,
      AVG(CASE
        WHEN LivingArea > 0 THEN ClosePrice / LivingArea
      END) AS averagePricePerSqft,
      AVG(CASE
        WHEN DaysOnMarket >= 0 THEN DaysOnMarket
      END) AS averageDaysOnMarket,
      AVG(CASE
        WHEN ListPrice > 0 THEN ClosePrice / ListPrice * 100
      END) AS listToCloseRatioPct,
      DATE_FORMAT(CURDATE(), '%Y-%m') AS currentMonth
    FROM california_sold
    WHERE City = ?
      AND PropertyType = 'Residential'
      AND ClosePrice > 0
      AND CloseDate >= DATE_SUB(
        DATE_FORMAT(CURDATE(), '%Y-%m-01'),
        INTERVAL ? MONTH
      )
      AND CloseDate <= CURDATE()
  `;

  const medianSql = `
    WITH ranked AS (
      SELECT
        ClosePrice,
        ROW_NUMBER() OVER (ORDER BY ClosePrice) AS rowNumber,
        COUNT(*) OVER () AS totalCount
      FROM california_sold
      WHERE City = ?
        AND PropertyType = 'Residential'
        AND ClosePrice > 0
        AND CloseDate >= DATE_SUB(
          DATE_FORMAT(CURDATE(), '%Y-%m-01'),
          INTERVAL ? MONTH
        )
        AND CloseDate <= CURDATE()
    )
    SELECT AVG(ClosePrice) AS medianPrice
    FROM ranked
    WHERE rowNumber IN (
      FLOOR((totalCount + 1) / 2),
      FLOOR((totalCount + 2) / 2)
    )
  `;

  const inventorySql = `
    SELECT COUNT(*) AS activeInventory
    FROM rets_property
    WHERE L_City = ?
      AND L_Status = 'Active'
      AND L_Class = 'Residential'
  `;

  const trendSql = `
    WITH filtered AS (
      SELECT
        DATE_FORMAT(CloseDate, '%Y-%m') AS saleMonth,
        ClosePrice,
        LivingArea,
        DaysOnMarket
      FROM california_sold
      WHERE City = ?
        AND PropertyType = 'Residential'
        AND ClosePrice > 0
        AND CloseDate >= DATE_SUB(
          DATE_FORMAT(CURDATE(), '%Y-%m-01'),
          INTERVAL ? MONTH
        )
        AND CloseDate <= CURDATE()
    ),
    ranked AS (
      SELECT
        saleMonth,
        ClosePrice,
        LivingArea,
        DaysOnMarket,
        ROW_NUMBER() OVER (
          PARTITION BY saleMonth ORDER BY ClosePrice
        ) AS rowNumber,
        COUNT(*) OVER (PARTITION BY saleMonth) AS totalCount
      FROM filtered
    )
    SELECT
      saleMonth AS month,
      COUNT(*) AS sales,
      AVG(ClosePrice) AS averagePrice,
      AVG(CASE
        WHEN rowNumber IN (
          FLOOR((totalCount + 1) / 2),
          FLOOR((totalCount + 2) / 2)
        ) THEN ClosePrice
      END) AS medianPrice,
      AVG(CASE
        WHEN LivingArea > 0 THEN ClosePrice / LivingArea
      END) AS averagePricePerSqft,
      AVG(CASE
        WHEN DaysOnMarket >= 0 THEN DaysOnMarket
      END) AS averageDaysOnMarket
    FROM ranked
    GROUP BY saleMonth
    ORDER BY saleMonth
  `;

  const summaryOffset = months - 1;
  const trendHistoryOffset = months + 11;
  const [summaryRows, medianRows, inventoryRows, rawTrend] = await Promise.all([
    query<RawSummaryRow>(summarySql, [normalizedCity, summaryOffset]),
    query<RawMedianRow>(medianSql, [normalizedCity, summaryOffset]),
    query<RawInventoryRow>(inventorySql, [normalizedCity]),
    query<RawTrendRow>(trendSql, [normalizedCity, trendHistoryOffset]),
  ]);

  const summary = summaryRows[0];
  if (!summary?.currentMonth) throw new Error("MySQL did not return a summary period");

  const history = new Map(
    rawTrend.map((row) => [
      row.month,
      {
        month: row.month,
        sales: Number(row.sales),
        averagePrice: nullableNumber(row.averagePrice),
        medianPrice: nullableNumber(row.medianPrice),
        averagePricePerSqft: nullableNumber(row.averagePricePerSqft),
        averageDaysOnMarket: nullableNumber(row.averageDaysOnMarket),
      },
    ])
  );

  const trend: MarketTrendPoint[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const month = monthOffset(summary.currentMonth, -offset);
    const value = history.get(month) ?? {
      month,
      sales: 0,
      averagePrice: null,
      medianPrice: null,
      averagePricePerSqft: null,
      averageDaysOnMarket: null,
    };
    const previousMonth = history.get(monthOffset(month, -1));
    const previousYear = history.get(monthOffset(month, -12));

    trend.push({
      ...value,
      monthOverMonthPct: calculatePercentChange(
        value.medianPrice,
        previousMonth?.medianPrice ?? null
      ),
      yearOverYearPct: calculatePercentChange(
        value.medianPrice,
        previousYear?.medianPrice ?? null
      ),
    });
  }

  const soldCount = Number(summary.soldCount);
  const activeInventory = Number(inventoryRows[0]?.activeInventory ?? 0);

  return {
    city: normalizedCity,
    months,
    soldCount,
    activeInventory,
    averagePrice: nullableNumber(summary.averagePrice),
    medianPrice: nullableNumber(medianRows[0]?.medianPrice),
    averagePricePerSqft: nullableNumber(summary.averagePricePerSqft),
    averageDaysOnMarket: nullableNumber(summary.averageDaysOnMarket),
    listToCloseRatioPct: nullableNumber(summary.listToCloseRatioPct),
    activeToSoldRatio:
      soldCount > 0 ? Number((activeInventory / soldCount).toFixed(2)) : null,
    trend,
  };
}

function money(value: number | null) {
  return value === null
    ? "N/A"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
}

function number(value: number | null, digits = 1) {
  return value === null ? "N/A" : value.toFixed(digits);
}

function signedPercent(value: number | null) {
  if (value === null) return "N/A";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatMarketStats(stats: MarketStats): string {
  const trendLines = stats.trend.map(
    (point) =>
      `${point.month}: ${money(point.medianPrice)} median, ${point.sales} sales, ` +
      `MoM ${signedPercent(point.monthOverMonthPct)}, YoY ${signedPercent(point.yearOverYearPct)}`
  );

  return `📊 ${stats.city} market — trailing ${stats.months} months
Median close price: ${money(stats.medianPrice)}
Average close price: ${money(stats.averagePrice)}
Average price/sqft: ${money(stats.averagePricePerSqft)}
Average DOM: ${number(stats.averageDaysOnMarket)} days
List-to-close ratio: ${number(stats.listToCloseRatioPct, 2)}%
Inventory: ${stats.activeInventory} active vs ${stats.soldCount} sold

${stats.months}-month trend (monthly median):
${trendLines.join("\n")}`;
}

export async function answerMarketQuestion(city: string, months = 12) {
  return formatMarketStats(await getMarketStats(city, months));
}
