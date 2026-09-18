import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle, ArrowLeft, BellRing, CalendarCheck, CheckCircle2, ExternalLink, FileDown, FileText, Hourglass,
  Landmark, MessageCircleQuestion, Printer, Scale,
} from "lucide-react";
import { api, rupees, uploadDocument } from "../lib/api";
import { ASSET_TYPES, STATUS, useCase } from "../lib/case";
import { Button, Card, Chip, Citation, ErrorNote, Field, inputCls, Toggle } from "../components/ui";

const BANKISH = ["bank_deposit", "term_deposit", "locker", "safe_custody"];

export default function ClaimDetail() {
  const { assetId = "" } = useParams();
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const { view } = useCase();
  const a = (view.assets as any[]).find((x) => x.assetId === assetId);
  if (!a) return <p className="text-muted">{t("claims.notFound", "This claim no longer exists.")}</p>;
  const r = a.route ?? {};
  const st = STATUS[a.status] ?? STATUS.draft;

  return (
    <div className="space-y-5">
      <Link to=".." relative="path" className="inline-flex items-center gap-1 text-sm text-brand-700">
        <ArrowLeft className="size-4" /> {t("claims.title", "Claims")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-soft">{hi ? ASSET_TYPES[a.assetType]?.hi : ASSET_TYPES[a.assetType]?.en}</p>
          <h1 className="text-2xl font-semibold">{a.institution || t("claims.untitled", "Untitled asset")}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip tone={st.tone}>{hi ? st.hi : st.en}</Chip>
            {a.amount ? <Chip>{rupees(a.amount)}</Chip> : null}
            {a.bankType && <Chip>{a.bankType === "cooperative" ? t("q.coop", "Co-operative bank") : t("q.commercial", "Commercial bank")}</Chip>}
          </div>
        </div>
        <Link to={`../../ask?asset=${a.assetId}`} relative="path">
          <Button variant="soft" icon={<MessageCircleQuestion className="size-4" />}>
            {t("claim.explain", "Explain in simple words")}
          </Button>
        </Link>
      </div>

      {r.route === "NEEDS_INFO" && <Questions a={a} />}
      {r.route !== "NEEDS_INFO" && r.automation !== "checklist" && <RouteCard a={a} />}
      {r.automation === "checklist" && <Checklist a={a} />}
      {a.clock && <Clock a={a} />}
      {BANKISH.includes(a.assetType) && r.route !== "NEEDS_INFO" && r.automation !== "stop" && !a.clock && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PackCard a={a} />
          <SubmitCard a={a} />
        </div>
      )}
      {BANKISH.includes(a.assetType) && <Facts a={a} />}
    </div>
  );
}

function Questions({ a }: { a: any }) {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const { caseId, reload } = useCase();
  const [f, setF] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <Card tone="amber">
      <p className="mb-3 font-semibold">{hi ? a.route.title.hi : a.route.title.en}</p>
      <div className="space-y-3">
        {a.route.missing.map((q: any) => (
          <Field key={q.fact} label={hi ? q.hi : q.en}>
            {q.options ? (
              <select className={inputCls} value={f[q.fact] ?? ""} onChange={(e) => setF({ ...f, [q.fact]: e.target.value })}>
                <option value="">—</option>
                {q.options.map((o: string) => (
                  <option key={o} value={o}>
                    {t(`opt.${o}`, { defaultValue: o })}
                  </option>
                ))}
              </select>
            ) : (
              <input className={inputCls} inputMode="numeric" value={f[q.fact] ?? ""} onChange={(e) => setF({ ...f, [q.fact]: e.target.value })} />
            )}
          </Field>
        ))}
        <ErrorNote error={error} />
        <Button
          loading={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const body: any = {};
              if (f.nomination) body.nomination = f.nomination;
              if (f.bank_type) body.bankType = f.bank_type;
              if (f.amount) body.amount = Number(f.amount);
              await api("PATCH", `/cases/${caseId}/assets/${a.assetId}`, body);
              await reload();
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("claim.findRoute", "Find the route")}
        </Button>
      </div>
    </Card>
  );
}

function RouteCard({ a }: { a: any }) {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const r = a.route;
  const forms: string[] = r.forms ?? [];
  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${r.automation === "stop" ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700"}`}>
          {r.automation === "stop" ? <AlertTriangle className="size-5" /> : <Scale className="size-5" />}
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-soft">{t("claim.route", "Your route")}</p>
          <p className="text-lg font-semibold leading-snug">{hi ? r.title.hi : r.title.en}</p>
        </div>
      </div>
      <Citation para={r.citation?.para} quote={r.citation?.quote} url={r.citation?.url} title={r.citation?.title} />
      {r.threshold?.limit_inr && (
        <p className="text-sm text-muted">
          {t("claim.threshold", "Limit for this bank: {{limit}} (para 7(h)). This claim: {{amt}}.", {
            limit: rupees(r.threshold.limit_inr),
            amt: rupees(r.threshold.amount_inr),
          })}
        </p>
      )}
      {r.automation === "stop" && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
          {t("claim.stop", "This needs court documents or legal help. We've listed what the bank will ask for, but we don't automate this route.")}
        </p>
      )}
      <div>
        <p className="mb-2 font-semibold">{t("claim.documents", "Documents")}</p>
        <ul className="space-y-2">
          {(r.documents ?? []).map((d: any) => {
            const inPack = d.form && forms.includes(d.form);
            return (
              <li key={d.id} className="flex items-start gap-2 text-sm">
                {inPack ? <FileText className="mt-0.5 size-4 shrink-0 text-brand-700" /> : d.at_branch ? <Landmark className="mt-0.5 size-4 shrink-0 text-stone-500" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-stone-400" />}
                <span className="flex-1">{hi ? d.hi || d.en : d.en}</span>
                {inPack ? <Chip tone="brand">{t("claim.inPack", "Filled in pack")}</Chip> : d.at_branch ? <Chip>{t("claim.atBranch", "At the branch")}</Chip> : null}
              </li>
            );
          })}
        </ul>
      </div>
      {(r.notes ?? []).length > 0 && (
        <ul className="space-y-2">
          {r.notes.map((n: any, i: number) => (
            <li key={i} className="rounded-xl bg-stone-50 px-3 py-2 text-sm">
              {hi ? n.hi || n.en : n.en} <span className="text-xs font-medium text-brand-800">({t("claim.para", "para")} {n.para})</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function PackCard({ a }: { a: any }) {
  const { t } = useTranslation();
  const { caseId, view, reload } = useCase();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const packs = (view.documents as any[]).filter((d) => d.kind === "pack" && d.assetId === a.assetId);
  const noPeople = !(view.people as any[]).some((p) => p.isClaimant || p.isNominee);

  async function open(docId: string) {
    const r: any = await api("GET", `/cases/${caseId}/documents/${docId}/url?variant=original`);
    window.open(r.url, "_blank");
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Printer className="size-5 text-brand-700" />
        <p className="font-semibold">{t("claim.pack", "Claim pack")}</p>
      </div>
      <p className="text-sm text-muted">
        {t("claim.packText", "RBI's standard forms filled from your family's details, masked ID copies, and a checklist. Print, sign, submit.")}
      </p>
      {noPeople && (
        <p className="rounded-xl bg-amber-50 p-2.5 text-sm text-amber-900">
          {t("claim.needPeople", "Add the claimants under Family first.")}{" "}
          <Link className="underline" to="../../family" relative="path">
            {t("nav.family", "Family")}
          </Link>
        </p>
      )}
      <ErrorNote error={error} />
      <Button
        loading={busy}
        disabled={noPeople}
        icon={<FileDown className="size-4" />}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const win = window.open("", "_blank");
          try {
            const r: any = await api("POST", `/cases/${caseId}/assets/${a.assetId}/pack`);
            if (win) win.location.href = r.url;
            else window.open(r.url, "_blank");
            await reload();
          } catch (e) {
            win?.close();
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        {packs.length ? t("claim.regenerate", "Make a fresh pack") : t("claim.generate", "Generate claim pack")}
      </Button>
      {packs.length > 0 && (
        <ul className="space-y-1 text-sm">
          {packs.slice(0, 3).map((p) => (
            <li key={p.docId}>
              <button className="text-brand-700 underline" onClick={() => open(p.docId)}>
                {p.filename}
              </button>{" "}
              <span className="text-xs text-soft">{new Date(p.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function SubmitCard({ a }: { a: any }) {
  const { t } = useTranslation();
  const { caseId, reload } = useCase();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [ack, setAck] = useState<File | null>(null);

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarCheck className="size-5 text-brand-700" />
        <p className="font-semibold">{t("claim.submitted", "Submitted at the bank?")}</p>
      </div>
      <p className="text-sm text-muted">
        {t("claim.submitText", "When the bank confirms it has all documents (para 29), the 15-day settlement clock starts (para 31).")}
      </p>
      <Field label={t("claim.docsDate", "Bank confirmed all documents on")}>
        <input className={inputCls} type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setAck(e.target.files?.[0] ?? null)} />
      <button className="text-sm text-brand-700 underline" onClick={() => fileRef.current?.click()}>
        {ack ? `✓ ${ack.name}` : t("claim.ackUpload", "Attach a photo of the dated acknowledgement (recommended)")}
      </button>
      <ErrorNote error={error} />
      <Button
        loading={busy}
        icon={<Hourglass className="size-4" />}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            let ackDocId = "";
            if (ack) ackDocId = (await uploadDocument(caseId, ack, "acknowledgement", { assetId: a.assetId })).docId;
            await api("POST", `/cases/${caseId}/assets/${a.assetId}/submit`, { docsCompleteDate: date, ackDocId });
            await reload();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("claim.startClock", "Start the 15-day clock")}
      </Button>
    </Card>
  );
}

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

function Clock({ a }: { a: any }) {
  const { t } = useTranslation();
  const { caseId, view, reload } = useCase();
  const c = a.clock;
  const spd = Number(c.secondsPerDay || view.case.secondsPerDay || 86400);
  const now = useNow(spd < 86400 ? 500 : 60000);
  const day = useMemo(() => {
    if (spd < 86400 && c.startedAt) return Math.max(0, Math.floor((now - Date.parse(c.startedAt)) / (spd * 1000)));
    return Math.max(0, Math.floor((now - Date.parse(c.docsCompleteDate)) / 86400000));
  }, [now, spd, c.startedAt, c.docsCompleteDate]);
  const waiting = (view.waitingFor as any[]).find((w) => w.assetId === a.assetId);
  const done = ["settled", "settled_late", "resolved", "escalated"].includes(a.status) || c.stage === "done";
  const pct = Math.min(100, (Math.min(day, 15) / 15) * 100);
  const [amount, setAmount] = useState(String(a.amount || ""));
  const [busy, setBusy] = useState(false);
  const docs = view.documents as any[];
  const letter = docs.find((d) => d.docId === c.letterDocId);
  const omb = docs.find((d) => d.docId === c.ombudsmanDocId);

  async function answer(body: any) {
    setBusy(true);
    try {
      await api("POST", `/cases/${caseId}/assets/${a.assetId}/answer`, body);
      await reload();
    } finally {
      setBusy(false);
    }
  }
  async function open(docId: string) {
    const r: any = await api("GET", `/cases/${caseId}/documents/${docId}/url?variant=original`);
    window.open(r.url, "_blank");
  }

  return (
    <Card className="space-y-4" tone={a.status === "late" || a.status === "escalated" ? "amber" : "plain"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Hourglass className="size-5 text-brand-700" />
          <p className="font-semibold">{t("clock.title", "Settlement clock")}</p>
        </div>
        <p className="text-sm text-muted">
          {t("clock.dates", "Documents complete {{a}} · due {{b}}", { a: c.docsCompleteDate, b: c.dueDate })}
        </p>
      </div>
      {!done && (
        <div>
          <div className="relative h-3 rounded-full bg-stone-200">
            <div className="h-3 rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
            {[10, 14].map((m) => (
              <span key={m} className="absolute top-[-3px] h-[18px] w-0.5 bg-stone-500" style={{ left: `${(m / 15) * 100}%` }} title={`Day ${m}`} />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-soft">
            <span>{t("clock.day0", "Day 0")}</span>
            <span className="font-semibold text-ink">
              {day <= 15 ? t("clock.dayN", "Day {{n}} of 15", { n: day }) : t("clock.over", "{{n}} days past due", { n: day - 15 })}
              {spd < 86400 && ` · ${t("clock.demo", "demo: 1 day = {{s}}s", { s: spd })}`}
            </span>
            <span>{t("clock.day15", "Day 15")}</span>
          </div>
        </div>
      )}

      {waiting?.stage === "settled" && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="flex items-center gap-2 font-semibold text-amber-900">
            <BellRing className="size-5 pulse-soft" /> {t("clock.askPaid", "Day 15 is over. Has the money arrived?")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Field label={t("clock.amountReceived", "Amount received (₹)")}>
              <input className={inputCls + " w-40"} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Button loading={busy} onClick={() => answer({ stage: "settled", settled: true, amountReceived: Number(amount || 0) })}>
              {t("clock.yes", "Yes, it's paid")}
            </Button>
            <Button variant="danger" loading={busy} onClick={() => answer({ stage: "settled", settled: false })}>
              {t("clock.no", "Not yet")}
            </Button>
          </div>
        </div>
      )}
      {waiting?.stage === "resolved" && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="flex items-center gap-2 font-semibold text-amber-900">
            <BellRing className="size-5 pulse-soft" /> {t("clock.askResolved", "30 days since your letter. Did the bank resolve it?")}
          </p>
          <div className="mt-3 flex gap-2">
            <Button loading={busy} onClick={() => answer({ stage: "resolved", resolved: true })}>
              {t("clock.resolvedYes", "Yes, resolved")}
            </Button>
            <Button variant="danger" loading={busy} onClick={() => answer({ stage: "resolved", resolved: false })}>
              {t("clock.resolvedNo", "No: prepare the Ombudsman complaint")}
            </Button>
          </div>
        </div>
      )}

      {c.compensation?.compensation_inr !== undefined && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <p className="text-xs uppercase tracking-wide text-soft">{t("clock.comp", "Compensation owed by the bank")}</p>
          <p className="text-3xl font-semibold text-ink">{rupees(c.compensation.compensation_inr)}</p>
          <p className="mt-1 font-mono text-xs text-muted">{c.compensation.formula}</p>
          <p className="mt-1 text-xs text-muted">
            {c.compensation.kind === "deposit"
              ? t("clock.compNote", "Bank Rate {{br}}% (on {{d}}) + 4% = {{r}}% a year, for {{n}} day(s) of delay.", {
                  br: c.compensation.bank_rate_pct,
                  d: c.compensation.docs_complete,
                  r: c.compensation.rate_pct,
                  n: c.compensation.delay_days,
                })
              : t("clock.compLocker", "₹5,000 for each day of delay (para 34).")}
          </p>
          <div className="mt-3">
            <Citation para={c.compensation.citation?.para} quote={c.compensation.citation?.quote} url={c.compensation.citation?.url} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {letter && (
          <Button variant="secondary" icon={<FileDown className="size-4" />} onClick={() => open(letter.docId)}>
            {t("clock.letter", "Letter to the bank")}
          </Button>
        )}
        {omb && (
          <Button variant="secondary" icon={<FileDown className="size-4" />} onClick={() => open(omb.docId)}>
            {t("clock.ombudsman", "RBI Ombudsman complaint draft")}
          </Button>
        )}
        {omb && (
          <a className="inline-flex items-center gap-1 text-sm text-brand-700 underline" href="https://cms.rbi.org.in" target="_blank" rel="noreferrer">
            cms.rbi.org.in <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
      {a.status === "settled" && <p className="font-medium text-green-800">✓ {t("clock.settledOk", "Settled within 15 days. Nothing more to do here.")}</p>}
    </Card>
  );
}

function Checklist({ a }: { a: any }) {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const r = a.route;
  return (
    <Card className="space-y-3">
      <p className="text-lg font-semibold">{hi ? r.title.hi : r.title.en}</p>
      <ol className="space-y-2">
        {r.checklist.map((c: any, i: number) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800">{i + 1}</span>
            <span>{hi ? c.hi || c.en : c.en}</span>
          </li>
        ))}
      </ol>
      {r.where && (
        <p className="text-sm text-muted">
          {t("claim.where", "Where")}: {r.where}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {r.url && (
          <a className="inline-flex items-center gap-1 text-sm text-brand-700 underline" href={r.url} target="_blank" rel="noreferrer">
            {t("claim.official", "Official page")} <ExternalLink className="size-3.5" />
          </a>
        )}
        {!r.verified && <Chip tone="amber">{t("claim.guidance", "Guidance: confirm with the institution")}</Chip>}
      </div>
    </Card>
  );
}

function Facts({ a }: { a: any }) {
  const { t } = useTranslation();
  const { caseId, reload } = useCase();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>(() => ({
    nomination: a.nomination || "unknown",
    bankType: a.bankType || "",
    amount: a.amount ?? "",
    accountNumbers: (a.accountNumbers || []).join(", "),
    branch: a.branch || "",
    will: !!a.will,
    dispute: !!a.dispute,
    courtOrder: !!a.courtOrder,
    joint: !!a.joint,
    legalHeirCertificate: !!a.legalHeirCertificate,
  }));
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  if (!open)
    return (
      <button className="text-sm text-brand-700 underline" onClick={() => setOpen(true)}>
        {t("claim.editFacts", "Change the details of this claim")}
      </button>
    );
  return (
    <Card className="space-y-3">
      <p className="font-semibold">{t("claim.details", "Claim details")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("q.nominationShort", "Nominee")}>
          <select className={inputCls} value={f.nomination} onChange={(e) => setF({ ...f, nomination: e.target.value })}>
            <option value="unknown">{t("q.dontKnow", "I don't know yet")}</option>
            <option value="nominee">{t("q.nominee", "Yes, a nominee")}</option>
            <option value="survivor">{t("q.survivor", "Joint account, either or survivor")}</option>
            <option value="none">{t("q.none", "No nominee")}</option>
          </select>
        </Field>
        <Field label={t("q.bankType", "Type of bank")}>
          <select className={inputCls} value={f.bankType} onChange={(e) => setF({ ...f, bankType: e.target.value })}>
            <option value="">—</option>
            <option value="commercial">{t("q.commercial", "Commercial bank")}</option>
            <option value="cooperative">{t("q.coop", "Co-operative bank")}</option>
          </select>
        </Field>
        <Field label={t("q.amount", "Approximate amount (₹)")}>
          <input className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </Field>
        <Field label={t("q.accounts", "Account / FD number")}>
          <input className={inputCls} value={f.accountNumbers} onChange={(e) => setF({ ...f, accountNumbers: e.target.value })} />
        </Field>
        <Field label={t("q.branch", "Branch")}>
          <input className={inputCls} value={f.branch} onChange={(e) => setF({ ...f, branch: e.target.value })} />
        </Field>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle checked={f.joint} onChange={(v) => setF({ ...f, joint: v })} label={t("q.joint", "Joint account")} />
        <Toggle checked={f.will} onChange={(v) => setF({ ...f, will: v })} label={t("q.will", "There is a Will")} />
        <Toggle checked={f.dispute} onChange={(v) => setF({ ...f, dispute: v })} label={t("q.dispute", "Heirs disagree")} />
        <Toggle checked={f.courtOrder} onChange={(v) => setF({ ...f, courtOrder: v })} label={t("q.court", "A court order stops payment")} />
        <Toggle checked={f.legalHeirCertificate} onChange={(v) => setF({ ...f, legalHeirCertificate: v })} label={t("q.lhc", "We have a Legal Heir Certificate")} />
      </div>
      <div className="flex gap-2">
        <Button
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const body: any = { ...f, amount: f.amount === "" ? "" : Number(f.amount) };
              if (body.nomination === "unknown") delete body.nomination;
              if (!body.bankType) delete body.bankType;
              await api("PATCH", `/cases/${caseId}/assets/${a.assetId}`, body);
              await reload();
              setOpen(false);
              nav(".", { replace: true });
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("claim.recheck", "Save and re-check the route")}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel", "Cancel")}
        </Button>
      </div>
    </Card>
  );
}
