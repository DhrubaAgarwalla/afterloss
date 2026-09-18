import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { configureAuth, currentEmail, doSignOut } from "./lib/auth";
import { brand, isConfigured } from "./lib/config";
import { Spinner } from "./components/ui";
import AuthPage from "./pages/AuthPage";
import CasesPage from "./pages/CasesPage";
import CaseShell from "./pages/CaseShell";
import CaseHome from "./pages/CaseHome";
import FindPage from "./pages/FindPage";
import ClaimsPage from "./pages/ClaimsPage";
import ClaimDetail from "./pages/ClaimDetail";
import FamilyPage from "./pages/FamilyPage";
import DocumentsPage from "./pages/DocumentsPage";
import AskPage from "./pages/AskPage";
import SetupPage from "./pages/SetupPage";
import GuidesPage from "./pages/GuidesPage";

export default function App() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    document.title = brand.appName;
    if (!isConfigured()) return setEmail(null);
    configureAuth();
    currentEmail().then(setEmail);
  }, []);

  if (!isConfigured())
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-semibold">{brand.appName}</h1>
        <p className="mt-2 text-muted">The app isn't connected to its backend yet (missing VITE_API_URL / Cognito settings).</p>
      </div>
    );
  if (email === undefined)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  if (!email) return <AuthPage onSignedIn={setEmail} />;

  const signOut = async () => {
    await doSignOut();
    setEmail(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CasesPage email={email} onSignOut={signOut} />} />
        <Route path="/cases/:caseId" element={<CaseShell email={email} onSignOut={signOut} />}>
          <Route index element={<CaseHome />} />
          <Route path="find" element={<FindPage />} />
          <Route path="claims" element={<ClaimsPage />} />
          <Route path="claims/:assetId" element={<ClaimDetail />} />
          <Route path="family" element={<FamilyPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="ask" element={<AskPage />} />
          <Route path="setup" element={<SetupPage />} />
          <Route path="setup/:step" element={<SetupPage />} />
          <Route path="guides" element={<GuidesPage />} />
          <Route path="guides/:guideId" element={<GuidesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
