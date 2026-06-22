import type { ReactNode } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Coins,
  Crown,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/useCloud";

function StatCard({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-zinc-900/50 flex flex-col gap-3 rounded-2xl border border-zinc-800/50 p-6 transition-all duration-200 hover:border-zinc-700/50">
      <div className="text-zinc-500 flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const me = useMe();

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Dashboard")}
        subtitle={t("Your credits, plan and what's unlocked")}
        actions={
          <Button size="sm" onClick={() => navigate("/billing")} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
            <Sparkles /> {t("Upgrade / Buy credits")}
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {me.isLoading ? (
          <div className="text-zinc-500 flex items-center gap-2 py-20 text-sm">
            <Loader2 className="size-4 animate-spin" /> {t("Loading…")}
          </div>
        ) : me.isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="bg-red-500/10 text-red-400 rounded-2xl p-4">
              <AlertCircle className="size-8" />
            </div>
            <p className="text-sm font-medium text-zinc-200">{t("Couldn't reach the cloud backend")}</p>
            <p className="text-zinc-500 max-w-md text-sm">
              {t("Start the cloud service or check VITE_CLOUD_BASE_URL.")}
            </p>
            <Button variant="outline" size="sm" onClick={() => me.refetch()} className="border-zinc-700 hover:bg-zinc-800">
              {t("Retry")}
            </Button>
          </div>
        ) : me.data ? (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={<Coins />} label={t("Credit balance")}>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums text-zinc-100">
                    {me.data.credits}
                  </span>
                  <span className="text-zinc-500 text-sm">{t("credits")}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 self-start border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                  onClick={() => navigate("/billing")}
                >
                  {t("Buy more")}
                </Button>
              </StatCard>

              <StatCard icon={<Crown />} label={t("Current plan")}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold capitalize text-zinc-100">
                    {me.data.plan_id}
                  </span>
                  {me.data.subscription ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {me.data.subscription.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                      {t("Free")}
                    </Badge>
                  )}
                </div>
                {me.data.subscription?.current_period_end ? (
                  <p className="text-zinc-500 text-xs mt-1">
                    {t("Renews")}{" "}
                    {new Date(
                      me.data.subscription.current_period_end,
                    ).toLocaleDateString()}
                  </p>
                ) : null}
              </StatCard>

              <StatCard icon={<Layers />} label={t("Batch limit")}>
                <span className="text-4xl font-bold tabular-nums text-zinc-100">
                  {me.data.entitlements.max_batch}
                </span>
                <span className="text-zinc-500 text-sm">
                  {t("videos per batch")}
                </span>
              </StatCard>
            </div>

            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6">
              <h2 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">{t("What's unlocked")}</h2>
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                <Entitlement on={!me.data.entitlements.watermark} label={t("No watermark")} />
                <Entitlement
                  on
                  label={`${t("Up to")} ${me.data.entitlements.max_resolution}`}
                />
                <Entitlement
                  on={me.data.entitlements.voices === "all"}
                  label={t("All voices")}
                />
                <Entitlement
                  on={me.data.entitlements.scheduling}
                  label={t("Scheduled posting")}
                />
                <Entitlement
                  on={me.data.entitlements.cloud_library}
                  label={t("Cloud library")}
                />
                <Entitlement on={me.data.entitlements.api} label={t("API access")} />
              </ul>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Entitlement({ on, label }: { on: boolean; label: string }) {
  return (
    <li
      className={
        on ? "flex items-center gap-2.5" : "text-zinc-600 flex items-center gap-2.5"
      }
    >
      <BadgeCheck className={on ? "text-emerald-400 size-4" : "size-4 text-zinc-700"} />
      <span className={on ? "text-zinc-300" : "text-zinc-600"}>{label}</span>
    </li>
  );
}
