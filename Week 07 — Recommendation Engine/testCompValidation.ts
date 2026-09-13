import assert from "node:assert/strict";
import { closePool } from "../Week 03 — MLS Database Integration/mysql";
import { validateWithComps } from "./recommendation";

try {
  const validation = await validateWithComps("Irvine", 1_500, 900_000);
  assert.ok(validation.compCount > 0, "Irvine should have recent comparable sales");
  assert.ok((validation.averagePricePerSqft ?? 0) > 0);
  assert.ok((validation.compPrice ?? 0) > 0);
  assert.ok(Number.isFinite(validation.deltaPct));
  console.log(
    `Week 7 live comps: PASS (${validation.compCount} Irvine comps, ${validation.assessment})`
  );
} finally {
  await closePool();
}
