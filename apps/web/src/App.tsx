import { Navigate, Route, Routes } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { AdminPage } from "@/features/admin/AdminPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { BatchPage } from "@/features/batch/BatchPage";
import { BillingPage } from "@/features/billing/BillingPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ComingSoon } from "@/features/placeholder/ComingSoon";
import { GeneratorPage } from "@/features/generator/GeneratorPage";
import { LibraryPage } from "@/features/library/LibraryPage";
import { PlanPage } from "@/features/plan/PlanPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { useAuth } from "@/store/auth";

export default function App() {
  const token = useAuth((s) => s.token);

  // Auth gate: when signed out, the login screen takes over the entire viewport
  // (no sidebar/shell behind it). An account is required — the AI step is metered
  // against credits server-side.
  if (!token) return <LoginPage />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/plan" replace />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/create" element={<GeneratorPage />} />
            <Route path="/batch" element={<BatchPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            {/* Internal admin tool — no nav link; actions authorized server-side
                via the X-Admin-Key header. */}
            <Route path="/admin" element={<AdminPage />} />
            {/* Authed users who hit /login just go home. */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route
              path="*"
              element={
                <ComingSoon
                  title="Page not found"
                  description="The page you're looking for doesn't exist."
                />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
