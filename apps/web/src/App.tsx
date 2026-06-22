import { Navigate, Route, Routes } from "react-router-dom";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AdminPage } from "@/features/admin/AdminPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { BatchPage } from "@/features/batch/BatchPage";
import { BillingPage } from "@/features/billing/BillingPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ComingSoon } from "@/features/placeholder/ComingSoon";
import { GeneratorPage } from "@/features/generator/GeneratorPage";
import { LibraryPage } from "@/features/library/LibraryPage";
import { SettingsPage } from "@/features/settings/SettingsPage";

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/create" element={<GeneratorPage />} />
            <Route path="/batch" element={<BatchPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <SettingsPage />
                </RequireAuth>
              }
            />
            {/* Internal admin tool — no nav link; route gated by sign-in only.
                Admin actions are authorized server-side via the X-Admin-Key header. */}
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminPage />
                </RequireAuth>
              }
            />
            <Route
              path="/billing"
              element={
                <RequireAuth>
                  <BillingPage />
                </RequireAuth>
              }
            />
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
