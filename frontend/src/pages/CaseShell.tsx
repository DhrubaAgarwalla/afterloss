import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FileStack, Home, LogOut, MessageCircleQuestion, ScanSearch, Scale, Users } from "lucide-react";
import { CaseProvider, useCase } from "../lib/case";
import { brand } from "../lib/config";
import { Chip, ErrorNote, Spinner } from "../components/ui";
import { LangToggle } from "../components/LangToggle";

export default function CaseShell({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const { caseId = "" } = useParams();
  return (
    <CaseProvider caseId={caseId}>
      <Shell onSignOut={onSignOut} />
    </CaseProvider>
  );
}

function Shell({ onSignOut }: { onSignOut: () => void }) {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const { view, error } = useCase();
  const items = [
    { to: "", end: true, icon: <Home className="size-5" />, label: t("nav.home", "Home") },
    { to: "find", icon: <ScanSearch className="size-5" />, label: t("nav.find", "Find") },
    { to: "claims", icon: <Scale className="size-5" />, label: t("nav.claims", "Claims") },
    { to: "family", icon: <Users className="size-5" />, label: t("nav.family", "Family") },
    { to: "documents", icon: <FileStack className="size-5" />, label: t("nav.docs", "Documents") },
    { to: "ask", icon: <MessageCircleQuestion className="size-5" />, label: t("nav.ask", "Ask") },
  ];
  const mobile = items.filter((i) => i.to !== "documents");
  const role = view?.me?.role;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button className="focus-ring rounded-lg p-1.5 text-muted hover:bg-stone-100" onClick={() => nav("/")} aria-label={t("back", "Back")}>
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-soft">{i18n.language === "hi" ? brand.appNameHi : brand.appName}</p>
            <p className="truncate font-semibold">
              {view ? `${t("cases.inMemory", "In memory of")} ${view.case.deceasedName}` : "…"}
            </p>
          </div>
          {role && <Chip tone={role === "helper" ? "amber" : "brand"}>{t(`role.${role}`, { defaultValue: role })}</Chip>}
          {view?.case?.secondsPerDay < 86400 && <Chip tone="amber">{t("cases.demo", "Demo speed")}</Chip>}
          <LangToggle />
          <button className="focus-ring hidden rounded-lg p-1.5 text-muted hover:bg-stone-100 sm:block" onClick={onSignOut} aria-label={t("signOut", "Sign out")}>
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <nav className="sticky top-20 hidden h-fit w-52 shrink-0 space-y-1 md:block" aria-label="Case">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium ${isActive ? "bg-brand-700 text-white" : "text-ink hover:bg-white"}`
              }
            >
              {i.icon}
              {i.label}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 flex-1">
          <ErrorNote error={error} />
          {!view && !error ? <Spinner label={t("loading", "Loading…")} /> : view && <Outlet />}
        </main>
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white md:hidden" aria-label="Case">
        <div className="grid grid-cols-5">
          {mobile.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? "text-brand-700" : "text-soft"}`}
            >
              {i.icon}
              {i.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
