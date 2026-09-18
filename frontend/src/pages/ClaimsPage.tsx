import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Plus, Scale } from "lucide-react";
import { api, rupees } from "../lib/api";
import { ASSET_TYPES, STATUS, useCase } from "../lib/case";
import { Button, Card, Chip, Empty, ErrorNote, Field, inputCls, Modal } from "../components/ui";

export default function ClaimsPage() {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const nav = useNavigate();
  const { view } = useCase();
  const [open, setOpen] = useState(false);
  const assets = view.assets as any[];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("claims.title", "Claims")}</h1>
          <p className="text-sm text-muted">{t("claims.sub", "Each asset gets a route under RBI's 2025 rules, a filled pack, and a clock.")}</p>
        </div>
        <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
          {t("claims.add", "Add manually")}
        </Button>
      </div>
      {assets.length === 0 ? (
        <Empty
          icon={<Scale className="size-8" />}
          title={t("claims.emptyTitle", "No claims yet")}
          text={t("claims.emptyText", "Add assets from the leads we found, or add one you already know about.")}
          action={<Button onClick={() => nav("../find")}>{t("claims.goFind", "Go to Find")}</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {assets.map((a) => {
            const st = STATUS[a.status] ?? STATUS.draft;
            return (
              <li key={a.assetId}>
                <button onClick={() => nav(a.assetId)} className="focus-ring w-full rounded-2xl text-left">
                  <Card className="flex items-center gap-3 transition hover:ring-brand-200">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{a.institution || (hi ? ASSET_TYPES[a.assetType]?.hi : ASSET_TYPES[a.assetType]?.en)}</p>
                        <Chip tone={st.tone}>{hi ? st.hi : st.en}</Chip>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {hi ? ASSET_TYPES[a.assetType]?.hi : ASSET_TYPES[a.assetType]?.en}
                        {a.amount ? ` · ${rupees(a.amount)}` : ""} · {hi ? a.route?.title?.hi : a.route?.title?.en}
                      </p>
                      {a.clock?.dueDate && (
                        <p className="mt-1 text-xs text-brand-800">
                          {t("claims.due", "Bank must settle by {{d}}", { d: a.clock.dueDate })}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="size-5 text-soft" />
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <AddAsset open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function AddAsset({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const nav = useNavigate();
  const { caseId, reload } = useCase();
  const [f, setF] = useState({ assetType: "bank_deposit", institution: "", amount: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <Modal open={open} onClose={onClose} title={t("claims.add", "Add manually")}>
      <div className="space-y-3">
        <Field label={t("kit.type", "Type")}>
          <select className={inputCls} value={f.assetType} onChange={(e) => setF({ ...f, assetType: e.target.value })}>
            {Object.entries(ASSET_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {hi ? v.hi : v.en}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("kit.where", "Institution / company")}>
          <input className={inputCls} value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} />
        </Field>
        <Field label={t("q.amount", "Approximate amount (₹)")} hint={t("optional", "Optional")}>
          <input className={inputCls} inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </Field>
        <ErrorNote error={error} />
        <Button
          className="w-full"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const a: any = await api("POST", `/cases/${caseId}/assets`, { ...f, amount: f.amount ? Number(f.amount) : undefined });
              await reload();
              onClose();
              nav(a.assetId);
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("save", "Save")}
        </Button>
      </div>
    </Modal>
  );
}
