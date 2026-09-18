import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FolderHeart, LogOut, Plus } from "lucide-react";
import { Button, Card, Chip, Empty, ErrorNote, Field, inputCls, Modal, Spinner, Toggle } from "../components/ui";
import { LangToggle } from "../components/LangToggle";
import { api } from "../lib/api";
import { brand } from "../lib/config";

const RELATIONS = ["Son", "Daughter", "Wife", "Husband", "Mother", "Father", "Brother", "Sister", "Other"];

export default function CasesPage({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const [cases, setCases] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    api<{ cases: any[] }>("GET", "/me/cases").then((r) => setCases(r.cases)).catch(setError);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <span className="text-lg font-semibold text-brand-800">{i18n.language === "hi" ? brand.appNameHi : brand.appName}</span>
          <div className="flex items-center gap-2">
            <LangToggle />
            <Button variant="ghost" size="sm" icon={<LogOut className="size-4" />} onClick={onSignOut}>
              {t("signOut", "Sign out")}
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{t("cases.title", "Your family cases")}</h1>
            <p className="text-sm text-muted">{email}</p>
          </div>
          <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
            {t("cases.new", "Open a case")}
          </Button>
        </div>
        <ErrorNote error={error} />
        {cases === null && !error && <Spinner label={t("loading", "Loading…")} />}
        {cases?.length === 0 && (
          <Empty
            icon={<FolderHeart className="size-8" />}
            title={t("cases.emptyTitle", "We're sorry for your loss.")}
            text={t("cases.emptyText", "Open a case for the person who passed away. We'll help you find what they left and claim it, one step at a time.")}
            action={<Button onClick={() => setOpen(true)}>{t("cases.new", "Open a case")}</Button>}
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {cases?.map((c) => (
            <button key={c.caseId} className="focus-ring rounded-2xl text-left" onClick={() => nav(`/cases/${c.caseId}`)}>
              <Card className="h-full transition hover:ring-brand-200">
                <p className="text-xs uppercase tracking-wide text-soft">{t("cases.inMemory", "In memory of")}</p>
                <p className="mt-1 text-lg font-semibold">{c.deceasedName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.dod && <Chip>{t("cases.died", "Died")} {c.dod}</Chip>}
                  <Chip tone="brand">{t(`role.${c.myRole}`, { defaultValue: c.myRole })}</Chip>
                  {c.secondsPerDay < 86400 && <Chip tone="amber">{t("cases.demo", "Demo speed")}</Chip>}
                </div>
              </Card>
            </button>
          ))}
        </div>
      </main>
      <NewCaseModal open={open} onClose={() => setOpen(false)} onCreated={(id) => nav(`/cases/${id}`)} />
    </div>
  );
}

function NewCaseModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ deceasedName: "", dod: "", dob: "", relation: "Daughter", yourName: "", pan: "" });
  const [demo, setDemo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (f.pan) localStorage.setItem("pan:" + f.deceasedName.trim().toUpperCase(), f.pan.trim().toUpperCase());
      const c = await api<any>("POST", "/cases", { ...f, secondsPerDay: demo ? 4 : 86400 });
      onCreated(c.caseId);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("cases.new", "Open a case")}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("cases.name", "Full name of the person who passed away")}>
          <input className={inputCls} required value={f.deceasedName} onChange={(e) => setF({ ...f, deceasedName: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("cases.dod", "Date of death")}>
            <input className={inputCls} type="date" value={f.dod} onChange={(e) => setF({ ...f, dod: e.target.value })} />
          </Field>
          <Field label={t("cases.dob", "Date of birth")} hint={t("optional", "Optional")}>
            <input className={inputCls} type="date" value={f.dob} onChange={(e) => setF({ ...f, dob: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("cases.relation", "You are their")}>
            <select className={inputCls} value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })}>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {t(`rel.${r}`, { defaultValue: r })}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("cases.yourName", "Your name")}>
            <input className={inputCls} value={f.yourName} onChange={(e) => setF({ ...f, yourName: e.target.value })} />
          </Field>
        </div>
        <Field label={t("cases.pan", "Their PAN")} hint={t("cases.panHint", "Optional. Kept only on this device for official searches; we store just the last 4 characters.")}>
          <input className={inputCls} value={f.pan} maxLength={10} onChange={(e) => setF({ ...f, pan: e.target.value })} />
        </Field>
        <Toggle checked={demo} onChange={setDemo} label={t("cases.demoToggle", "Demo speed: 1 day = 4 seconds (for trying the clock)")} />
        <ErrorNote error={error} />
        <Button type="submit" className="w-full" size="lg" loading={busy}>
          {t("cases.create", "Open case")}
        </Button>
      </form>
    </Modal>
  );
}
