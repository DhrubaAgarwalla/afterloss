import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Check, CheckCircle2, Copy, ExternalLink, Loader2, Mail, Plus, ShieldCheck, X } from "lucide-react";
import { api } from "../lib/api";
import { ASSET_TYPES, useCase } from "../lib/case";
import { fmtDate } from "../lib/format";
import { connectGmail, disconnectGmail, gmailAvailable, type GmailAccount, prepareGmail, scanGmail } from "../lib/gmail";
import { type Finding, merge, sameInstitution } from "../lib/gmailScan";
import { Button, Card, Chip, ErrorNote } from "./ui";

const MANUAL = [
  { en: "Mutual fund statements (CAS)", hi: "म्यूचुअल फंड स्टेटमेंट (सीएएस)", q: 'from:(camsonline.com OR kfintech.com OR mfcentral.com) OR subject:("consolidated account statement")' },
  { en: "Demat and shares", hi: "डीमैट और शेयर", q: 'from:(nsdl.co.in OR cdslindia.com OR zerodha.com OR groww.in OR upstox.com OR angelone.in) OR subject:("contract note" OR demat)' },
  { en: "Dividends", hi: "लाभांश", q: 'subject:(dividend) OR "dividend credited"' },
  { en: "Insurance premiums and policies", hi: "बीमा प्रीमियम और पॉलिसी", q: 'subject:("premium receipt" OR "policy document" OR "premium due") OR from:(licindia.in)' },
  { en: "PF, pension and NPS", hi: "पीएफ, पेंशन और एनपीएस", q: 'from:(epfindia.gov.in OR npscra.nsdl.co.in OR proteantech.in) OR subject:(UAN OR PRAN OR "EPF passbook")' },
  { en: "Fixed and recurring deposits", hi: "सावधि और आवर्ती जमा", q: 'subject:("fixed deposit" OR "term deposit" OR "FD receipt" OR "recurring deposit")' },
  { en: "Credit cards and loans", hi: "क्रेडिट कार्ड और ऋण", q: 'subject:("credit card statement" OR "loan statement" OR "EMI")' },
];

type Conn = GmailAccount & { status: "scanning" | "done" | "error"; done: number; total: number; found: Finding[]; error?: string };

// Connections live in memory for this browser session (not saved anywhere): moving between setup steps keeps
// them; a reload or "Disconnect" ends them. Scans keep updating here even if the card is not on screen.
let saved: Conn[] = [];
const listeners = new Set<() => void>();
function setConns(fn: (cs: Conn[]) => Conn[]) {
  saved = fn(saved);
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function EmailFinder() {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const { caseId, view, reload } = useCase();
  const [ready, setReady] = useState(false);
  const conns = useSyncExternalStore(subscribe, () => saved);
  const [error, setError] = useState<unknown>(null);
  const [adding, setAdding] = useState<string>("");
  const available = gmailAvailable();

  useEffect(() => {
    if (!available) return;
    prepareGmail().then(() => setReady(true)).catch(setError);
  }, [available]);

  const findings = useMemo(() => merge(conns.flatMap((c) => c.found)), [conns]);
  const inList = (f: Finding) => (view.assets as any[]).some((a) => sameInstitution(a.institution, f.institution));
  const scanning = conns.some((c) => c.status === "scanning");

  function connect() {
    setError(null);
    connectGmail()
      .then((acc) => {
        if (conns.some((c) => c.email === acc.email)) {
          setError(new Error(t("gmail.already", "{{email}} is already connected.", { email: acc.email })));
          return;
        }
        const conn: Conn = { ...acc, status: "scanning", done: 0, total: 1, found: [] };
        setConns((cs) => [...cs, conn]);
        const update = (patch: Partial<Conn>) => setConns((cs) => cs.map((c) => (c.email === acc.email ? { ...c, ...patch } : c)));
        scanGmail(acc, (done, total) => update({ done, total }))
          .then((found) => update({ status: "done", found }))
          .catch((e) => update({ status: "error", error: e?.message ?? String(e) }));
      })
      .catch(setError);
  }

  function disconnect(c: Conn) {
    disconnectGmail(c);
    setConns((cs) => cs.filter((x) => x.email !== c.email));
  }

  async function add(f: Finding) {
    setAdding(f.key);
    setError(null);
    try {
      await api("POST", `/cases/${caseId}/assets`, {
        assetType: f.type,
        institution: f.institution,
        source: "email",
        include: true,
        notes: `Found in about ${f.count} email(s)${f.latest ? `, latest ${f.latest}` : ""}.`,
      });
      await reload();
    } catch (e) {
      setError(e);
    } finally {
      setAdding("");
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Mail className="size-5" />
        </span>
        <div>
          <p className="font-semibold">{t("email.title", "Search their email")}</p>
          <p className="text-sm text-muted">
            {available
              ? t("gmail.sub", "Connect one or more Gmail accounts (theirs, or a family member's who got their mail). We look for statements, receipts and policies, and list what we find.")
              : t("email.sub", "If the family can open their email, these searches find statements and receipts. They open in Gmail on your phone; nothing is sent to us.")}
          </p>
        </div>
      </div>

      {available && (
        <>
          <p className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-900">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            {t("gmail.privacy", "Read-only, and it runs in this browser: emails never reach our servers. We read only the sender, subject and date. Access ends within an hour, or when you disconnect. Only what you tap 'Add' on is saved.")}
          </p>

          {conns.length > 0 && (
            <ul className="space-y-2">
              {conns.map((c) => (
                <li key={c.email} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-line">
                  {c.status === "scanning" ? <Loader2 className="size-4 shrink-0 animate-spin text-brand-700" /> : c.status === "done" ? <CheckCircle2 className="size-4 shrink-0 text-brand-700" /> : <X className="size-4 shrink-0 text-red-700" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.email}</span>
                    <span className="block text-xs text-muted">
                      {c.status === "scanning"
                        ? t("gmail.scanning", "Searching… {{done}} of {{total}}", { done: c.done, total: c.total })
                        : c.status === "done"
                          ? t("gmail.foundN", "{{n}} things found", { n: c.found.length })
                          : c.error}
                    </span>
                  </span>
                  <button type="button" className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-stone-100" onClick={() => disconnect(c)}>
                    {t("gmail.disconnect", "Disconnect")}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button variant={conns.length ? "secondary" : "primary"} icon={conns.length ? <Plus className="size-4" /> : <Mail className="size-4" />} disabled={!ready} loading={!ready && !error} onClick={connect}>
            {conns.length ? t("gmail.addAnother", "Add another Gmail account") : t("gmail.connect", "Connect Gmail (read-only)")}
          </Button>

          {findings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">{t("gmail.results", "Found in email")}</p>
              <ul className="space-y-2">
                {findings.map((f) => {
                  const known = inList(f);
                  return (
                    <li key={f.key} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{f.institution}</span>
                        <span className="block truncate text-xs text-muted">
                          {hi ? ASSET_TYPES[f.type]?.hi : ASSET_TYPES[f.type]?.en} · {t("gmail.emails", "about {{n}} emails", { n: f.count })}
                          {f.latest ? ` · ${t("gmail.latest", "latest {{d}}", { d: fmtDate(f.latest, hi) })}` : ""}
                          {conns.length > 1 ? ` · ${f.accounts.join(", ")}` : ""}
                        </span>
                      </span>
                      {known ? (
                        <Chip tone="green">
                          <Check className="size-3" /> {t("gmail.inList", "In your list")}
                        </Chip>
                      ) : (
                        <Button size="sm" loading={adding === f.key} onClick={() => add(f)}>
                          {t("choose.add", "Add")}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {!scanning && conns.length > 0 && conns.every((c) => c.status === "done") && findings.length === 0 && (
            <p className="text-sm text-muted">{t("gmail.none", "Nothing found in these accounts. Try another account, or the searches below.")}</p>
          )}
          <ErrorNote error={error} />
        </>
      )}

      <ManualSearches collapsed={available} />
    </Card>
  );
}

function ManualSearches({ collapsed }: { collapsed: boolean }) {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const [copied, setCopied] = useState("");
  const list = (
    <ul className="divide-y divide-line">
      {MANUAL.map((s) => (
        <li key={s.q} className="flex items-center gap-2 py-2">
          <span className="min-w-0 flex-1 text-sm">{hi ? s.hi : s.en}</span>
          <a className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50" href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(s.q)}`} target="_blank" rel="noreferrer">
            Gmail <ExternalLink className="size-3" />
          </a>
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(s.q);
                setCopied(s.q);
                setTimeout(() => setCopied(""), 1500);
              } catch {
                /* clipboard blocked */
              }
            }}
          >
            {copied === s.q ? <Check className="size-3" /> : <Copy className="size-3" />} {t("email.copy", "Copy search")}
          </button>
        </li>
      ))}
    </ul>
  );
  if (!collapsed)
    return (
      <>
        {list}
        <p className="text-xs text-soft">{t("email.found", "Found something? Add it above with the matching tile.")}</p>
      </>
    );
  return (
    <details className="rounded-xl bg-stone-50 px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-muted">{t("gmail.manual", "Or search by hand (opens your Gmail, works for Outlook too with Copy)")}</summary>
      {list}
    </details>
  );
}
