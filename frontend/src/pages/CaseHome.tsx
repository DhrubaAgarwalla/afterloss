import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BellRing, Check, CircleDot, ListChecks, Sparkles } from "lucide-react";
import { useCase } from "../lib/case";
import { rupees } from "../lib/api";
import { Button, Card, Stat } from "../components/ui";
import { nextSetupStep, STEPS, stepDone } from "./SetupPage";

export default function CaseHome() {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const nav = useNavigate();
  const { view } = useCase();
  const tot = view.totals;

  const go = (a: any) => {
    const target =
      a.kind === "leads" || a.kind === "find" ? "setup/discover" : a.kind === "people" ? "setup/family" : a.assetId ? `claims/${a.assetId}` : "claims";
    nav(target);
  };
  const next = nextSetupStep(view);
  const doneCount = STEPS.filter((s) => stepDone(view, s.id)).length;

  return (
    <div className="space-y-6">
      <Card tone="brand">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-6 shrink-0 text-brand-700" />
          <div>
            <h1 className="text-xl font-semibold">{t("home.hello", "One step at a time.")}</h1>
            <p className="mt-1 text-sm text-muted">
              {t("home.sub", "Here's where things stand for {{name}}. Every rule we apply shows the RBI paragraph it comes from.", {
                name: view.case.deceasedName,
              })}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-soft">{t("home.setup", "Getting everything ready")}</p>
            <p className="text-lg font-semibold">
              {t("home.setupProgress", "{{done}} of {{total}} steps done", { done: doneCount, total: STEPS.length })}
            </p>
          </div>
          <ListChecks className="size-6 text-brand-700" />
        </div>
        <ol className="grid gap-1.5 sm:grid-cols-2">
          {STEPS.map((s, i) => {
            const ok = stepDone(view, s.id);
            return (
              <li key={s.id}>
                <button onClick={() => nav(`setup/${s.id}`)} className="focus-ring flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-stone-50">
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ok ? "bg-brand-600 text-white" : s.id === next ? "bg-brand-100 text-brand-800" : "bg-stone-100 text-soft"}`}>
                    {ok ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className={ok ? "text-muted" : "font-medium"}>{hi ? s.hi : s.en}</span>
                </button>
              </li>
            );
          })}
        </ol>
        {next ? (
          <Button className="w-full sm:w-auto" onClick={() => nav(`setup/${next}`)}>
            {t("home.continueSetup", "Continue: {{step}}", { step: hi ? STEPS.find((s) => s.id === next)!.hi : STEPS.find((s) => s.id === next)!.en })} <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" onClick={() => nav("claims")}>
            {t("home.openPlan", "Open your claim plan")} <ArrowRight className="size-4" />
          </Button>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("home.found", "Possible assets")} value={view.leads.length} sub={t("home.new", "{{n}} to review", { n: tot.leadsNew })} />
        <Stat label={t("home.claims", "Claims")} value={tot.assets} sub={t("home.running", "{{n}} with a clock running", { n: tot.claimsRunning })} />
        <Stat label={t("home.received", "Received")} value={rupees(tot.received) || "₹0"} />
        <Stat label={t("home.comp", "Compensation due")} value={rupees(tot.compensation) || "₹0"} sub={t("home.compSub", "Bank Rate + 4% (para 33)")} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("home.next", "What to do next")}</h2>
        {view.nextActions.length === 0 ? (
          <p className="text-sm text-muted">{t("home.nothing", "Nothing urgent right now.")}</p>
        ) : (
          <ul className="space-y-2">
            {view.nextActions.map((a: any, i: number) => (
              <li key={i}>
                <button
                  onClick={() => go(a)}
                  className={`focus-ring flex w-full items-center gap-3 rounded-2xl p-4 text-left ring-1 transition ${
                    a.kind === "answer" ? "bg-amber-50 ring-amber-200 hover:bg-amber-100" : "bg-white ring-line hover:ring-brand-200"
                  }`}
                >
                  {a.kind === "answer" ? <BellRing className="size-5 shrink-0 text-amber-700 pulse-soft" /> : <CircleDot className="size-5 shrink-0 text-brand-700" />}
                  <span className="flex-1 font-medium">{hi ? a.textHi || a.text : a.text}</span>
                  <ArrowRight className="size-4 text-soft" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("home.timeline", "What happened")}</h2>
        <ol className="relative space-y-4 border-l-2 border-brand-100 pl-5">
          {view.events.slice(0, 14).map((e: any) => (
            <li key={e.at + e.text} className="relative">
              <span className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-brand-600 ring-4 ring-paper" />
              <p className="text-sm">{hi ? e.textHi || e.text : e.text}</p>
              <p className="text-xs text-soft">{new Date(e.at).toLocaleString(hi ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
