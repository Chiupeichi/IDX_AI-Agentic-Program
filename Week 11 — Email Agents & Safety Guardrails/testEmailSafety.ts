import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ListingRow } from "../Week 3 – MLS Database Integration/searchListings";
import type { MarketStats } from "../Week 5 — Market Statistics Agent/marketStats";
import { classifyIntent } from "../Week 9 — Multi-Agent Orchestration/classifier";
import { FileEmailDraftStore } from "./draftStore";
import {
  approveEmail,
  cancelEmail,
  draftEmail,
  sendApprovedEmail,
} from "./emailService";
import {
  buildListingEmailTemplate,
  buildWeeklyMarketReportTemplate,
} from "./templates";
import type { EmailDraftContent, EmailTransport } from "./types";
import { handleEmailWorkflowMessage } from "./workflow";

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "idx-week11-"));
const store = new FileEmailDraftStore(temporaryDirectory);
const owner = "+15550001111";
const otherUser = "+15550002222";
let sendCount = 0;

const transport: EmailTransport = {
  async send(draft) {
    sendCount += 1;
    assert.equal(draft.status, "sending");
    return { messageId: `test-${draft.id}` };
  },
};

const basicContent: EmailDraftContent = {
  to: "CLIENT@EXAMPLE.COM",
  subject: "Property summary",
  text: "A safe property summary.",
  html: "<p>A safe property summary.</p>",
  useCase: "property_summary",
};

const marketStats: MarketStats = {
  city: "Pasadena",
  months: 12,
  soldCount: 120,
  activeInventory: 45,
  averagePrice: 1_050_000,
  medianPrice: 975_000,
  averagePricePerSqft: 650,
  averageDaysOnMarket: 26.5,
  listToCloseRatioPct: 98.75,
  activeToSoldRatio: 0.38,
  trend: [
    {
      month: "2026-08",
      sales: 12,
      averagePrice: 1_060_000,
      medianPrice: 990_000,
      averagePricePerSqft: 655,
      averageDaysOnMarket: 25,
      monthOverMonthPct: 1.5,
      yearOverYearPct: 4.2,
    },
  ],
};

const listing = {
  L_ListingID: "1001",
  L_DisplayId: "MLS-1001",
  L_Address: "1 <Main> Street",
  L_City: "Pasadena",
  L_Zip: "91101",
  price: 900_000,
  beds: 3,
  baths: 2,
  sqft: 1_600,
  DaysOnMarket: 18,
} as ListingRow;

try {
  assert.equal(classifyIntent("Approve email 00000000-0000-4000-8000-000000000000"), "email");
  assert.equal(classifyIntent("Cancel email 00000000-0000-4000-8000-000000000000"), "email");
  assert.equal(
    classifyIntent("Draft a weekly market report for Pasadena to manager@example.com"),
    "email"
  );

  await assert.rejects(
    () => draftEmail(owner, { ...basicContent, to: "not-an-email" }, { store }),
    /valid recipient/
  );
  await assert.rejects(
    () => draftEmail(owner, { ...basicContent, subject: "Unsafe\nBcc: x@example.com" }, { store }),
    /subject must contain/
  );

  const draft = await draftEmail(owner, basicContent, { store });
  assert.equal(draft.status, "pending_approval");
  assert.equal(draft.to, "client@example.com");
  assert.equal(sendCount, 0);

  await assert.rejects(
    () => sendApprovedEmail(draft.id, owner, { store, transport }),
    /explicit human approval/
  );
  assert.equal(sendCount, 0);

  await assert.rejects(
    () => approveEmail(draft.id, otherUser, { store }),
    /not found for this user/
  );
  const approved = await approveEmail(draft.id, owner, { store });
  assert.equal(approved.status, "approved");
  assert.equal(sendCount, 0);

  const sent = await sendApprovedEmail(draft.id, owner, { store, transport });
  assert.equal(sent.status, "sent");
  assert.equal(sendCount, 1);
  await assert.rejects(
    () => sendApprovedEmail(draft.id, owner, { store, transport }),
    /already been sent/
  );
  assert.equal(sendCount, 1);

  const cancelledDraft = await draftEmail(owner, basicContent, { store });
  const cancelled = await cancelEmail(cancelledDraft.id, owner, { store });
  assert.equal(cancelled.status, "cancelled");
  await assert.rejects(
    () => approveEmail(cancelledDraft.id, owner, { store }),
    /cancelled email/
  );

  const failingDraft = await draftEmail(owner, basicContent, { store });
  await approveEmail(failingDraft.id, owner, { store });
  await assert.rejects(
    () =>
      sendApprovedEmail(failingDraft.id, owner, {
        store,
        transport: {
          async send() {
            throw new Error("secret SMTP diagnostic");
          },
        },
      }),
    /explicitly approve it again/
  );
  assert.equal((await store.get(failingDraft.id, owner)).status, "failed");
  assert.equal((await store.get(failingDraft.id, owner)).lastError, "delivery_failed");

  const lockedDraft = await draftEmail(owner, basicContent, { store });
  let releaseLock!: () => void;
  const lockWait = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const holdingLock = store.withLock(lockedDraft.id, async () => lockWait);
  await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(
    () => store.withLock(lockedDraft.id, async () => undefined),
    /already being processed/
  );
  releaseLock();
  await holdingLock;

  const marketTemplate = buildWeeklyMarketReportTemplate(
    "manager@example.com",
    marketStats
  );
  assert.match(marketTemplate.text, /Median close price: \$975,000/);
  assert.match(marketTemplate.text, /MoM \+1.5%, YoY \+4.2%/);
  assert.equal(marketTemplate.useCase, "weekly_market_report");

  const listingTemplate = buildListingEmailTemplate(
    "manager@example.com",
    Array.from({ length: 6 }, (_, index) => ({
      ...listing,
      L_ListingID: String(index + 1),
      L_Address: `${index + 1} <Main> Street`,
    }))
  );
  assert.equal((listingTemplate.text.match(/ sqft /g) ?? []).length, 5);
  assert.doesNotMatch(listingTemplate.html, /<Main>/);
  assert.match(listingTemplate.html, /&lt;Main&gt;/);

  const preview = await handleEmailWorkflowMessage(
    "Draft a weekly market report for Pasadena to manager@example.com",
    owner,
    {
      city: "Pasadena",
      store,
      loadMarketStats: async () => marketStats,
    }
  );
  assert.match(preview, /EMAIL DRAFT — NOT SENT/);
  assert.match(preview, /Status: pending_approval/);
  assert.match(preview, /Pasadena Weekly Market Report/);
  const workflowDraftId = preview.match(/Draft ID: ([0-9a-f-]+)/)?.[1];
  assert.ok(workflowDraftId);
  const confirmation = await handleEmailWorkflowMessage(
    `Approve email ${workflowDraftId}`,
    owner,
    { store, transport }
  );
  assert.match(confirmation, /EMAIL SENT/);
  assert.match(confirmation, /Status: sent/);
  assert.equal((await store.get(workflowDraftId, owner)).status, "sent");

  const files = await readdir(temporaryDirectory);
  assert.ok(files.every((file) => !file.includes(owner)));
  const stored = await readFile(
    path.join(temporaryDirectory, `${draft.id}.json`),
    "utf8"
  );
  assert.doesNotMatch(stored, new RegExp(owner.replace("+", "\\+")));
  assert.doesNotMatch(confirmation, /secret SMTP diagnostic/);

  console.log(
    "Week 11 email safety: PASS (draft preview, ownership, explicit approval, locking, templates, safe failure, single send)"
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
