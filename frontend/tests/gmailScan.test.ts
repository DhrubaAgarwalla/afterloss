// Run: node tests/gmailScan.test.ts   (Node 22.6+ strips the types)
import assert from "node:assert/strict";
import { companyIn, findingsFor, merge, sameInstitution, sender, SOURCES } from "../src/lib/gmailScan.ts";

assert.deepEqual(sender('"HDFC Bank InstaAlerts" <alerts@hdfcbank.net>'), { name: "HDFC Bank", domain: "hdfcbank.net" });
assert.deepEqual(sender("donotreply@camsonline.com"), { name: "", domain: "camsonline.com" });
assert.equal(companyIn("Final Dividend for FY 2025-26 - ITC Limited"), "ITC Limited");
assert.equal(companyIn("Intimation of dividend payment: Infosys Ltd."), "Infosys Ltd.");

const cams = SOURCES.find((s) => s.q === "from:camsonline.com")!;
const one = findingsFor(cams, [{ from: "CAMS <donotreply@camsonline.com>", subject: "Consolidated Account Statement", date: "Tue, 12 May 2026 10:00:00 +0530" }], 23, "a@gmail.com");
assert.equal(one.length, 1);
assert.equal(one[0].count, 23);
assert.equal(one[0].latest, "2026-05-12");

const div = SOURCES.find((s) => s.label === "Dividends")!;
const grouped = findingsFor(div, [
  { from: "KFintech <einward@kfintech.com>", subject: "Final Dividend 2025-26 - ITC Limited", date: "2026-07-30" },
  { from: "KFintech <einward@kfintech.com>", subject: "Interim Dividend - ITC Limited", date: "2026-02-10" },
  { from: '"Infosys Limited" <investors@infosys.com>', subject: "Dividend credited", date: "2026-06-26" },
], 3, "a@gmail.com");
assert.deepEqual(grouped.map((g) => [g.institution, g.count, g.latest]), [["ITC Limited", 2, "2026-07-30"], ["Infosys Limited", 1, "2026-06-26"]]);

// the same holding found in two accounts is one row that lists both
const merged = merge([...one, { ...one[0], count: 4, latest: "2026-08-01", accounts: ["b@gmail.com"] }]);
assert.equal(merged.length, 1);
assert.equal(merged[0].count, 27);
assert.equal(merged[0].latest, "2026-08-01");
assert.deepEqual(merged[0].accounts, ["a@gmail.com", "b@gmail.com"]);

assert.ok(sameInstitution("Life Insurance Corporation of India (LIC)", "Life Insurance Corporation of India"));
assert.ok(!sameInstitution("HDFC Life", "HDFC Mutual Fund"));
console.log("gmailScan: all checks passed");
