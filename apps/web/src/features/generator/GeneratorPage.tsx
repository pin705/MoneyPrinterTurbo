import { Header } from "@/components/Header";
import { ContentPanel } from "./ContentPanel";
import { GeneratePanel } from "./GeneratePanel";
import { SubtitlePanel } from "./SubtitlePanel";
import { VideoAudioPanel } from "./VideoAudioPanel";

export function GeneratorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ContentPanel />
          <VideoAudioPanel />
          <SubtitlePanel />
        </div>
      </main>
      <GeneratePanel />
    </div>
  );
}
