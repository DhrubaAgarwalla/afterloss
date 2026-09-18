import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { api } from "../lib/api";
import { useCase } from "../lib/case";
import { Button, Card, Chip, ErrorNote, Field, inputCls, Modal, Toggle } from "../components/ui";

const EMPTY = { fullName: "", relation: "", age: "", address: "", phone: "", idType: "Aadhaar", idLast4: "", isClaimant: false, isNominee: false, isNonClaimantHeir: false, isDeclarant: false, yearsKnown: "" };

export default function FamilyPage() {
  const { t } = useTranslation();
  const { caseId, view, reload } = useCase();
  const [editing, setEditing] = useState<any>(null);
  const [invite, setInvite] = useState({ email: "", role: "heir" });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const isLead = view.me.role === "lead";

  const roleChips = (p: any) => (
    <div className="flex flex-wrap gap-1.5">
      {p.isNominee && <Chip tone="brand">{t("fam.nominee", "Nominee")}</Chip>}
      {p.isClaimant && <Chip tone="green">{t("fam.claimant", "Claimant")}</Chip>}
      {p.isNonClaimantHeir && <Chip tone="amber">{t("fam.nonClaimant", "Heir, not claiming (signs I-D)")}</Chip>}
      {p.isDeclarant && <Chip tone="blue">{t("fam.declarant", "Independent declarant (I-E)")}</Chip>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("fam.title", "Family")}</h1>
        <p className="text-sm text-muted">
          {t("fam.sub", "People who sign the forms, and people who can use this case. You enter details once; every form uses them.")}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("fam.people", "People in the claim")}</h2>
          <Button size="sm" icon={<Plus className="size-4" />} onClick={() => setEditing({ ...EMPTY, personId: "new" })}>
            {t("fam.addPerson", "Add person")}
          </Button>
        </div>
        {(view.people as any[]).length === 0 && <p className="text-sm text-muted">{t("fam.noPeople", "Add the legal heirs: who claims, who doesn't, and an independent person who knows the family.")}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {(view.people as any[]).map((p) => (
            <Card key={p.personId} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.fullName}</p>
                  <p className="text-sm text-muted">
                    {p.relation}
                    {p.age ? ` · ${p.age}` : ""}
                    {p.idLast4 ? ` · ${p.idType} ••••${p.idLast4}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="focus-ring rounded-lg p-2.5 text-muted hover:bg-stone-100" onClick={() => setEditing(p)} aria-label={`${t("edit", "Edit")}: ${p.fullName}`}>
                    <Pencil className="size-4" />
                  </button>
                  <button
                    className="focus-ring rounded-lg p-2.5 text-muted hover:bg-red-50 hover:text-red-700"
                    aria-label={`${t("delete", "Remove")}: ${p.fullName}`}
                    onClick={async () => {
                      if (!window.confirm(t("fam.confirmDelete", "Remove {{name}} from this case? Forms will no longer include them.", { name: p.fullName }))) return;
                      setError(null);
                      try {
                        await api("DELETE", `/cases/${caseId}/people/${p.personId}`);
                        await reload();
                      } catch (e) {
                        setError(e);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {roleChips(p)}
            </Card>
          ))}
        </div>
        <ErrorNote error={error} />
      </section>

      <AboutDeceased />

      <PaymentDetails />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("fam.members", "Who can use this case")}</h2>
        <Card className="space-y-3">
          <ul className="divide-y divide-line">
            {(view.members as any[]).map((m) => (
              <li key={m.email} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate">{m.email}</span>
                <span className="flex gap-1.5">
                  <Chip tone={m.role === "helper" ? "amber" : "brand"}>{t(`role.${m.role}`, { defaultValue: m.role })}</Chip>
                  {m.status === "invited" && <Chip>{t("fam.invited", "Invited")}</Chip>}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            {t("fam.roles", "Heirs can do everything except manage members. Helpers (a CA or family friend) can view the case and masked copies, but never download original documents. Enforced by Cedar policies in Amazon Verified Permissions.")}
          </p>
          {isLead && (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <Field label={t("fam.inviteEmail", "Invite by email")}>
                <input className={inputCls} type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
              </Field>
              <select className={inputCls} value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
                <option value="heir">{t("role.heir", "Heir")}</option>
                <option value="helper">{t("role.helper", "Helper")}</option>
              </select>
              <Button
                icon={<UserPlus className="size-4" />}
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await api("POST", `/cases/${caseId}/members`, invite);
                    setInvite({ email: "", role: "heir" });
                    await reload();
                  } catch (e) {
                    setError(e);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("fam.invite", "Invite")}
              </Button>
            </div>
          )}
          <ErrorNote error={error} />
        </Card>
      </section>

      <PersonModal key={editing ? `${editing.personId}-${editing.fullName}` : "closed"} person={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function PersonModal({ person, onClose }: { person: any; onClose: () => void }) {
  const { t } = useTranslation();
  const { caseId, reload } = useCase();
  const [p, setP] = useState<any>(person);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (!person || !p) return null;
  const cur = p;
  const set = (k: string, v: any) => setP({ ...cur, [k]: v });
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { personId, createdAt, type, ...body } = cur;
      await api("PUT", `/cases/${caseId}/people/${personId || "new"}`, { ...body, age: body.age ? Number(body.age) : undefined });
      await reload();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open={!!person} onClose={onClose} title={cur.fullName || t("fam.addPerson", "Add person")}>
      <form className="space-y-3" onSubmit={save}>
        <Field label={t("fam.fullName", "Full name (as on ID)")}>
          <input className={inputCls} required value={cur.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("fam.relation", "Relationship to the deceased")}>
            <input className={inputCls} value={cur.relation} onChange={(e) => set("relation", e.target.value)} />
          </Field>
          <Field label={t("fam.age", "Age")}>
            <input className={inputCls} inputMode="numeric" value={cur.age ?? ""} onChange={(e) => set("age", e.target.value)} />
          </Field>
        </div>
        <Field label={t("fam.address", "Address")}>
          <input className={inputCls} value={cur.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("fam.phone", "Mobile")}>
            <input className={inputCls} inputMode="tel" value={cur.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label={t("fam.email", "Email")}>
            <input className={inputCls} type="email" value={cur.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("fam.idType", "ID type")}>
            <select className={inputCls} value={cur.idType} onChange={(e) => set("idType", e.target.value)}>
              {["Aadhaar", "PAN", "Passport", "Voter ID", "Driving licence"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label={t("fam.idLast4", "Last 4 digits of ID")} hint={t("fam.idHint", "We never store full ID numbers.")}>
            <input className={inputCls} maxLength={4} value={cur.idLast4 ?? ""} onChange={(e) => set("idLast4", e.target.value)} />
          </Field>
        </div>
        <div className="space-y-2">
          <Toggle checked={!!cur.isClaimant} onChange={(v) => set("isClaimant", v)} label={t("fam.tClaimant", "Claims and signs the forms")} />
          <Toggle checked={!!cur.isNominee} onChange={(v) => set("isNominee", v)} label={t("fam.tNominee", "Is the registered nominee")} />
          <Toggle checked={!!cur.isNonClaimantHeir} onChange={(v) => set("isNonClaimantHeir", v)} label={t("fam.tNon", "Legal heir who is NOT claiming (signs a no-objection)")} />
          <Toggle checked={!!cur.isDeclarant} onChange={(v) => set("isDeclarant", v)} label={t("fam.tDecl", "Independent person who knows the family (Annex I-E)")} />
        </div>
        {cur.isDeclarant && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("fam.years", "Has known the family for (years)")}>
              <input className={inputCls} value={cur.yearsKnown ?? ""} onChange={(e) => set("yearsKnown", e.target.value)} />
            </Field>
            <Field label={t("fam.sdo", "Son/ daughter/ spouse of")} hint={t("fam.sdoHint", "Printed as S/D/O on Annex I-E")}>
              <input className={inputCls} value={cur.sdo ?? ""} onChange={(e) => set("sdo", e.target.value)} />
            </Field>
          </div>
        )}
        <ErrorNote error={error} />
        <Button type="submit" className="w-full" loading={busy}>
          {t("save", "Save")}
        </Button>
      </form>
    </Modal>
  );
}

const DECEASED_FIELDS: [string, string, string?][] = [
  ["placeOfDeath", "Place of death"],
  ["deathCertNo", "Death certificate number"],
  ["deathCertDate", "Certificate date", "date"],
  ["deathCertAuthority", "Issued by (e.g. BBMP, Tahsildar)"],
  ["maritalStatus", "Marital status"],
  ["deceasedAddress", "Their address"],
  ["religion", "Religion"],
  ["successionLaw", "Law of succession (e.g. Hindu Succession Act)"],
];

function AboutDeceased() {
  const { t } = useTranslation();
  const { caseId, view, reload } = useCase();
  const [f, setF] = useState<Record<string, string>>(() => Object.fromEntries(DECEASED_FIELDS.map(([k]) => [k, view.case[k] ?? ""])));
  const saver = useSaver();
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{t("fam.about", "About {{name}}", { name: view.case.deceasedName })}</h2>
        <p className="text-sm text-muted">{t("fam.aboutSub", "RBI's claim forms ask for these. Fill what you know; blanks print as lines to write by hand.")}</p>
      </div>
      <Card className="grid gap-3 sm:grid-cols-2">
        {DECEASED_FIELDS.map(([k, label, type]) => (
          <Field key={k} label={t(`fam.d.${k}`, label)}>
            <input className={inputCls} type={type ?? "text"} value={f[k]} onChange={(e) => { setF({ ...f, [k]: e.target.value }); saver.dirty(); }} />
          </Field>
        ))}
        <SaveRow saver={saver} onSave={async () => { await api("PATCH", `/cases/${caseId}`, f); await reload(); }} />
      </Card>
    </section>
  );
}

const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function PaymentDetails() {
  const { t } = useTranslation();
  const { caseId, view, reload } = useCase();
  const pay = view.case.payment ?? {};
  const [payment, setPayment] = useState({ accountHolder: pay.accountHolder ?? "", accountNumber: pay.accountNumber ?? "", ifsc: pay.ifsc ?? "", bankName: pay.bankName ?? "" });
  const saver = useSaver();
  const edit = (k: keyof typeof payment, v: string) => {
    setPayment({ ...payment, [k]: v });
    saver.dirty();
  };
  const badIfsc = payment.ifsc.length > 0 && !IFSC.test(payment.ifsc);
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{t("fam.payTitle", "Where should the money be paid?")}</h2>
        <p className="text-sm text-muted">{t("fam.paySub", "Printed in the payment section of the claim form. Usually the claimant's own account.")}</p>
      </div>
      <Card className="grid gap-3 sm:grid-cols-2">
        <Field label={t("fam.accHolder", "Account holder")}>
          <input className={inputCls} value={payment.accountHolder} onChange={(e) => edit("accountHolder", e.target.value)} />
        </Field>
        <Field label={t("fam.accNo", "Account number")}>
          <input className={inputCls} inputMode="numeric" value={payment.accountNumber} onChange={(e) => edit("accountNumber", e.target.value.replace(/\s/g, ""))} />
        </Field>
        <Field label="IFSC" hint={badIfsc ? t("fam.ifscBad", "IFSC is 11 characters, like SBIN0001234 (5th character is zero).") : undefined}>
          <input className={inputCls} maxLength={11} aria-invalid={badIfsc} value={payment.ifsc} onChange={(e) => edit("ifsc", e.target.value.toUpperCase().trim())} />
        </Field>
        <Field label={t("fam.bank", "Bank")}>
          <input className={inputCls} value={payment.bankName} onChange={(e) => edit("bankName", e.target.value)} />
        </Field>
        <SaveRow saver={saver} onSave={async () => { await api("PATCH", `/cases/${caseId}`, { payment }); await reload(); }} />
      </Card>
    </section>
  );
}

type Saver = ReturnType<typeof useSaver>;

function useSaver() {
  const [s, setS] = useState<{ busy: boolean; saved: boolean; error: unknown }>({ busy: false, saved: false, error: null });
  return {
    ...s,
    dirty: () => setS((x) => (x.saved || x.error ? { ...x, saved: false, error: null } : x)),
    run: async (fn: () => Promise<unknown>) => {
      setS({ busy: true, saved: false, error: null });
      try {
        await fn();
        setS({ busy: false, saved: true, error: null });
      } catch (error) {
        setS({ busy: false, saved: false, error });
      }
    },
  };
}

function SaveRow({ saver, onSave }: { saver: Saver; onSave: () => Promise<unknown> }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="flex items-center gap-3">
        <Button variant="secondary" loading={saver.busy} onClick={() => saver.run(onSave)}>
          {t("save", "Save")}
        </Button>
        {saver.saved && (
          <span className="text-sm text-green-800" role="status">
            ✓ {t("saved", "Saved")}
          </span>
        )}
      </div>
      <ErrorNote error={saver.error} />
    </div>
  );
}
