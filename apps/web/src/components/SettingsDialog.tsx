import { useState } from "react";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/store/settings";

export function SettingsDialog() {
  const { backendUrl, setBackendUrl } = useSettings();
  const [value, setValue] = useState(backendUrl);
  const [open, setOpen] = useState(false);

  const save = () => {
    setBackendUrl(value.replace(/\/+$/, ""));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Connect to your local MoneyPrinter backend.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="backendUrl">Backend URL</Label>
            <Input
              id="backendUrl"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="http://127.0.0.1:8000"
            />
          </div>
          <p className="text-muted-foreground rounded-md border border-dashed p-3 text-xs leading-relaxed">
            LLM provider &amp; API keys (DeepSeek, Pexels, …) are read from the
            backend&apos;s <code className="text-foreground">config.toml</code> in
            this version. Managed accounts &amp; a credit system are on the
            roadmap.
          </p>
          <div className="flex justify-end">
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
