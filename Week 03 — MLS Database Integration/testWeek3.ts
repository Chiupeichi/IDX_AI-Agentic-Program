import assert from "node:assert/strict";
import { closePool } from "./mysql";
import {
  formatListingCard,
  searchActiveListings,
} from "./searchListings";
import { getSoldComps } from "./soldComps";

async function run() {
  try {
    const listings = await searchActiveListings(
      {
        city: "Irvine",
        maxPrice: 1_500_000,
        beds: 3,
        type: "Condominium",
      },
      1,
      5
    );

    assert.ok(listings.length > 0, "expected at least one active listing");
    assert.ok(listings.length <= 5, "active listing limit was not enforced");
    for (const listing of listings) {
      assert.equal(listing.L_City, "Irvine");
      assert.ok(listing.price <= 1_500_000);
      assert.ok(listing.beds >= 3);
      assert.equal(listing.type, "Condominium");
      assert.equal(listing.status, "Active");
    }
    assert.match(formatListingCard(listings[0]), /Irvine/);

    const soldComps = await getSoldComps("Irvine", 12);
    const today = new Date().toISOString().slice(0, 10);
    assert.ok(soldComps.length > 0, "expected at least one sold comp");
    assert.ok(soldComps.length <= 50, "sold comps limit was not enforced");
    for (const comp of soldComps) {
      assert.equal(comp.City, "Irvine");
      assert.equal(comp.PropertyType, "Residential");
      assert.ok(comp.CloseDate <= today, "future sold comp was returned");
    }

    await assert.rejects(
      searchActiveListings({}, 1, 51),
      /limit must be an integer between 1 and 50/
    );
    await assert.rejects(getSoldComps("Irvine", 0), /months must be/);

    console.log(
      `Week 3 database: ${listings.length} active listings and ${soldComps.length} sold comps validated.`
    );
  } finally {
    await closePool();
  }
}

run().catch((error) => {
  console.error("Week 3 validation failed:", error);
  process.exitCode = 1;
});
