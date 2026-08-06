import assert from "node:assert/strict";
import { closePool } from "../Week 3 – MLS Database Integration/mysql";
import {
  countIndexableListings,
  fetchIndexableListings,
} from "./listingSource";

try {
  const count = await countIndexableListings();
  assert.ok(count > 0, "rets_property should contain active listings with remarks");

  const listings = await fetchIndexableListings(0, 2);
  assert.equal(listings.length, 2);
  assert.ok(listings.every((listing) => listing.listingId));
  assert.ok(listings.every((listing) => listing.remarks.trim().length > 0));
  assert.ok(listings.every((listing) => Number.isFinite(listing.price)));

  console.log(`Week 6 live listing source: PASS (${count} indexable active listings)`);
} finally {
  await closePool();
}
