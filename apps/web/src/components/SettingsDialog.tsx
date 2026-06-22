import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ApiError } from "@mpt/api-client";
import { LLM_PROVIDERS, PROVIDER_DEFAULTS } from "@mpt/shared";

import { Field } from "@/components/common/Field";
import { OptSelect } from "@/components/common/OptSelect";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApi } from "@/lib/useApi";
import { useSettings } from "@/store/settings";

type App = Record<string, unknown>;

const listToStr = (v: unknown) =>
  Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "";
const strToList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function SettingsDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { backendUrl, setBackendUrl } = useSettings();
  const api = useApi();
  const qc = useQueryClient();

  const [urlDraft, setUrlDraft] = useState(backendUrl);
  const [app, setApp] = useState<App>({});

  const configQ = useQuery({
    queryKey: ["config", backendUrl],
    queryFn: () => api.getConfig(),
    enabled: open,
  });

  useEffect(() => {
    if (configQ.data?.app) setApp(configQ.data.app);
  }, [configQ.data]);

  const provider = (app.llm_provider as string) || "deepseek";
  const defaults = PROVIDER_DEFAULTS[provider] ?? {};
  const get = (k: string) => (app[k] ?? "") as string;
  const set = (k: string, v: unknown) => setApp((s) => ({ ...s, [k]: v }));

  const save = useMutation({
    mutationFn: () => api.updateConfig(app),
    onSuccess: () => {
      toast.success(t("Settings saved"));
      qc.invalidateQueries({ queryKey: ["ping"] });
      setOpen(false);
    },
    onError: (e) =>
      toast.error(t("Save failed"), {
        description: e instanceof ApiError ? e.message : String(e),
      }),
  });

  const onSave = () => {
    setBackendUrl(urlDraft.replace(/\/+$/, ""));
    save.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("Settings")}</DialogTitle>
          <DialogDescription>
            {t("Stored in the backend's config.toml on this machine.")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="ai" className="flex-1">
              {t("AI / LLM")}
            </TabsTrigger>
            <TabsTrigger value="media" className="flex-1">
              {t("Media")}
            </TabsTrigger>
            <TabsTrigger value="conn" className="flex-1">
              {t("Connection")}
            </TabsTrigger>
          </TabsList>

          {configQ.isLoading && open ? (
            <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" /> {t("Loading config…")}
            </div>
          ) : configQ.isError ? (
            <p className="text-destructive py-8 text-sm">
              {t("Could not reach the backend. Check the Connection tab.")}
            </p>
          ) : (
            <>
              <TabsContent value="ai" className="flex flex-col gap-4 pt-2">
                <Field label={t("LLM provider")} htmlFor="prov">
                  <OptSelect
                    id="prov"
                    value={provider}
                    onValueChange={(v) => set("llm_provider", v)}
                    options={LLM_PROVIDERS.map((o) => ({
                      value: o.value,
                      label: o.labelKey,
                    }))}
                  />
                </Field>
                <Field label={t("API key")} htmlFor="key">
                  <Input
                    id="key"
                    type="password"
                    placeholder="sk-…"
                    value={get(`${provider}_api_key`)}
                    onChange={(e) => set(`${provider}_api_key`, e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("Base URL")} htmlFor="base">
                    <Input
                      id="base"
                      placeholder={defaults.baseUrl ?? ""}
                      value={get(`${provider}_base_url`)}
                      onChange={(e) =>
                        set(`${provider}_base_url`, e.target.value)
                      }
                    />
                  </Field>
                  <Field label={t("Model")} htmlFor="model">
                    <Input
                      id="model"
                      placeholder={defaults.model ?? ""}
                      value={get(`${provider}_model_name`)}
                      onChange={(e) =>
                        set(`${provider}_model_name`, e.target.value)
                      }
                    />
                  </Field>
                </div>
                {defaults.secretKey ? (
                  <Field label={t("Secret key")} htmlFor="secret">
                    <Input
                      id="secret"
                      type="password"
                      value={get(`${provider}_secret_key`)}
                      onChange={(e) =>
                        set(`${provider}_secret_key`, e.target.value)
                      }
                    />
                  </Field>
                ) : null}
                {defaults.accountId ? (
                  <Field label={t("Account ID")} htmlFor="acct">
                    <Input
                      id="acct"
                      value={get(`${provider}_account_id`)}
                      onChange={(e) =>
                        set(`${provider}_account_id`, e.target.value)
                      }
                    />
                  </Field>
                ) : null}
              </TabsContent>

              <TabsContent value="media" className="flex flex-col gap-4 pt-2">
                <Field
                  label={t("Pexels API key")}
                  htmlFor="pexels"
                  hint="Free at pexels.com/api. Comma-separate multiple keys."
                >
                  <Input
                    id="pexels"
                    type="password"
                    value={listToStr(app.pexels_api_keys)}
                    onChange={(e) =>
                      set("pexels_api_keys", strToList(e.target.value))
                    }
                  />
                </Field>
                <Field label={t("Pixabay API key")} htmlFor="pixabay">
                  <Input
                    id="pixabay"
                    type="password"
                    value={listToStr(app.pixabay_api_keys)}
                    onChange={(e) =>
                      set("pixabay_api_keys", strToList(e.target.value))
                    }
                  />
                </Field>
                <Field label={t("Coverr API key")} htmlFor="coverr">
                  <Input
                    id="coverr"
                    type="password"
                    value={listToStr(app.coverr_api_keys)}
                    onChange={(e) =>
                      set("coverr_api_keys", strToList(e.target.value))
                    }
                  />
                </Field>
              </TabsContent>
            </>
          )}

          <TabsContent value="conn" className="flex flex-col gap-4 pt-2">
            <Field label={t("Backend URL")} htmlFor="backendUrl">
              <Input
                id="backendUrl"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="http://127.0.0.1:8000"
              />
            </Field>
            <p className="text-muted-foreground rounded-md border border-dashed p-3 text-xs leading-relaxed">
              {t(
                "Render runs locally. Managed accounts & a credit system are on the roadmap.",
              )}
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button onClick={onSave} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : null}
            {t("Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
