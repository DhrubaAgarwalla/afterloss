import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BellRing, CircleDot, Sparkles } from "lucide-react";
import { useCase } from "../lib/case";
import { rupees } from "../lib/api";
import { Card, Stat } from "../components/ui";

export default function CaseHome() {
  const { t, i18n } = useTranslation();
  const hi = i18n.language === "hi";
  const nav = useNavigate();
  const { view } = useCase();
  const tot = view.totals;

  const go = (a: any) => {
    const target =
      a.kind === "leads" || a.kind === "find" ? "find" : a.kind === "people" ? "family" : a.assetId ? `claims/${a.assetId}` : "claims";
    nav(target);
  };

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
