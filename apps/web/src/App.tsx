import { Navigate, Route, Routes } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { ComingSoon } from "@/features/placeholder/ComingSoon";
import { GeneratorPage } from "@/features/generator/GeneratorPage";
import { LibraryPage } from "@/features/library/LibraryPage";

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/create" replace />} />
          <Route path="/create" element={<GeneratorPage />} />
          <Route path="/library" element={<LibraryPage />} />
          {/* Account surfaces — implemented in later phases. */}
          <Route
            path="/dashboard"
            element={
              <ComingSoon
                title="Dashboard"
                description="Your credit balance, plan and usage at a glance."
                phase="Phase 1"
              />
            }
          />
          <Route
            path="/billing"
            element={
              <ComingSoon
                title="Billing"
                description="Plans, SePay checkout, credit top-ups and invoices."
                phase="Phase 2"
              />
            }
          />
          <Route
            path="/settings"
            element={
              <ComingSoon
                title="Account"
                description="Profile, password, language and account deletion."
                phase="Phase 1"
              />
            }
          />
          <Route
            path="/login"
            element={
              <ComingSoon
                title="Sign in"
                description="Sign in to sync credits and manage your subscription."
                phase="Phase 1"
              />
            }
          />
          <Route
            path="*"
            element={
              <ComingSoon
                title="Page not found"
                description="The page you’re looking for doesn’t exist."
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
}
