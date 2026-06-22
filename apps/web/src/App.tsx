import { Sidebar } from "@/components/Sidebar";
import { GeneratorPage } from "@/features/generator/GeneratorPage";
import { LibraryPage } from "@/features/library/LibraryPage";
import { useNav } from "@/store/nav";

export default function App() {
  const view = useNav((s) => s.view);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        {view === "create" ? <GeneratorPage /> : <LibraryPage />}
      </div>
    </div>
  );
}
