// What to look for in a Gmail inbox, and how to turn message headers into findings.
// Pure functions (no network), so they can be tested with plain Node.

export type Source = { type: string; label: string; q: string; bySender?: boolean };
export type Meta = { from: string; subject: string; date: string };
export type Finding = { key: string; type: string; institution: string; count: number; latest: string; accounts: string[]; sample?: string };

// One search per institution (count comes from Gmail's estimate), plus keyword searches grouped by sender.
export const SOURCES: Source[] = [
  { type: "mutual_fund", label: "Mutual funds (CAMS statements)", q: "from:camsonline.com" },
  { type: "mutual_fund", label: "Mutual funds (KFintech statements)", q: "from:(kfintech.com OR karvy.com) -subject:dividend" },
  { type: "mutual_fund", label: "Mutual funds (MF Central)", q: "from:mfcentral.com" },
  { type: "nps", label: "NPS pension account", q: "from:(npscra.nsdl.co.in OR proteantech.in)" },
  { type: "shares", label: "Demat account (NSDL statements)", q: "from:nsdl.co.in -from:npscra.nsdl.co.in" },
  { type: "shares", label: "Demat account (CDSL statements)", q: "from:(cdslindia.com OR cdslindia.co.in OR cdslstatement.com)" },
  { type: "shares", label: "Zerodha", q: "from:zerodha.com" },
  { type: "shares", label: "Groww", q: "from:groww.in" },
  { type: "shares", label: "Upstox", q: "from:upstox.com" },
  { type: "shares", label: "Angel One", q: "from:(angelone.in OR angelbroking.com)" },
  { type: "shares", label: "ICICI Direct", q: "from:icicidirect.com" },
  { type: "shares", label: "HDFC Securities", q: "from:hdfcsec.com" },
  { type: "shares", label: "Kotak Securities", q: "from:kotaksecurities.com" },
  { type: "life_insurance", label: "Life Insurance Corporation of India (LIC)", q: "from:licindia.in" },
  { type: "life_insurance", label: "HDFC Life", q: "from:hdfclife.com" },
  { type: "life_insurance", label: "ICICI Prudential Life", q: "from:iciciprulife.com" },
  { type: "life_insurance", label: "SBI Life", q: "from:sbilife.co.in" },
  { type: "life_insurance", label: "Axis Max Life", q: "from:(maxlifeinsurance.com OR axismaxlife.com)" },
  { type: "life_insurance", label: "Tata AIA Life", q: "from:tataaia.com" },
  { type: "life_insurance", label: "Bajaj Allianz Life", q: "from:(bajajallianzlife.co.in OR bajajlife.com)" },
  { type: "epf", label: "EPFO (PF / pension)", q: "from:epfindia.gov.in" },
  { type: "post_office", label: "India Post savings", q: "from:indiapost.gov.in" },
  { type: "shares", label: "Dividends", q: "subject:dividend", bySender: true },
  { type: "term_deposit", label: "Fixed / recurring deposits", q: 'subject:("fixed deposit" OR "term deposit" OR "FD receipt" OR "recurring deposit")', bySender: true },
  { type: "life_insurance", label: "Insurance premiums", q: 'subject:("premium receipt" OR "premium paid" OR "renewal premium" OR "premium due")', bySender: true },
  { type: "credit_card", label: "Credit card statements", q: 'subject:("credit card statement")', bySender: true },
  { type: "loan", label: "Loan statements", q: 'subject:("loan account statement" OR "loan statement")', bySender: true },
];

export function header(headers: { name: string; value: string }[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

/** '"HDFC Bank InstaAlerts" <alerts@hdfcbank.net>' → { name: "HDFC Bank", domain: "hdfcbank.net" } */
export function sender(from: string): { name: string; domain: string } {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  const addr = (m ? m[2] : from).trim().toLowerCase();
  const domain = addr.includes("@") ? addr.split("@")[1] : addr;
  const name = (m ? m[1] : "")
    .replace(/\b(insta ?alerts?|alerts?|e-?statements?|statements?|no-?reply|donotreply|do not reply|customer care|notifications?|updates?|mailer|service)\b/gi, "")
    .replace(/[|:–-]+\s*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { name, domain };
}

/** A company named in a dividend subject: 'Final dividend 2025-26 - ITC Limited' → 'ITC Limited' */
export function companyIn(subject: string): string {
  const m = subject.match(/([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,5}\s+(?:Limited|Ltd\.?))/);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

const titleDomain = (d: string) => {
  const root = d.split(".").filter((x) => !["www", "mail", "email", "alerts", "co", "com", "in", "net", "org"].includes(x))[0] ?? d;
  return root.charAt(0).toUpperCase() + root.slice(1);
};

const isoDate = (d: string) => {
  const t = Date.parse(d);
  return isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10);
};

/** Findings from one search: a fixed source is one finding; keyword sources are grouped by who sent them. */
export function findingsFor(src: Source, metas: Meta[], estimate: number, account: string): Finding[] {
  if (!metas.length) return [];
  if (!src.bySender) {
    const latest = metas.map((m) => isoDate(m.date)).sort().reverse()[0] ?? "";
    return [{ key: `${src.type}|${src.label.toLowerCase()}`, type: src.type, institution: src.label, count: Math.max(estimate, metas.length), latest, accounts: [account], sample: metas[0].subject }];
  }
  const groups = new Map<string, Finding>();
  for (const m of metas) {
    const s = sender(m.from);
    const company = src.type === "shares" ? companyIn(m.subject) : "";
    const institution = company || s.name || titleDomain(s.domain);
    const key = `${src.type}|${institution.toLowerCase()}`;
    const g = groups.get(key) ?? { key, type: src.type, institution, count: 0, latest: "", accounts: [account], sample: m.subject };
    g.count += 1;
    const d = isoDate(m.date);
    if (d > g.latest) g.latest = d;
    groups.set(key, g);
  }
  return [...groups.values()];
}

/** Same institution found in several accounts (or searches) becomes one row. */
export function merge(all: Finding[]): Finding[] {
  const out = new Map<string, Finding>();
  for (const f of all) {
    const prev = out.get(f.key);
    if (!prev) {
      out.set(f.key, { ...f, accounts: [...f.accounts] });
      continue;
    }
    prev.count += f.count;
    if (f.latest > prev.latest) prev.latest = f.latest;
    for (const a of f.accounts) if (!prev.accounts.includes(a)) prev.accounts.push(a);
  }
  const order = ["mutual_fund", "shares", "life_insurance", "epf", "nps", "post_office", "term_deposit", "credit_card", "loan"];
  return [...out.values()].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || b.count - a.count);
}

/** Loose name match so 'Life Insurance Corporation of India (LIC)' and 'Life Insurance Corporation of India' are one. */
export const normName = (s: string) => (s || "").toLowerCase().replace(/\b(ltd|limited|bank|the|of|india|co|pvt)\b|[^a-z0-9]/g, "");
export function sameInstitution(a: string, b: string): boolean {
  const x = normName(a), y = normName(b);
  return x.length >= 4 && y.length >= 4 && (x.startsWith(y) || y.startsWith(x));
}
