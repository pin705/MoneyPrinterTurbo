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
    <div className="bg-card flex flex-col gap-2 rounded-xl border p-5">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
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
          <Button size="sm" onClick={() => navigate("/billing")}>
            <Sparkles /> {t("Upgrade / Buy credits")}
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
        {me.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-20 text-sm">
            <Loader2 className="size-4 animate-spin" /> {t("Loading…")}
          </div>
        ) : me.isError ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <AlertCircle className="text-destructive size-6" />
            <p className="text-sm font-medium">{t("Couldn’t reach the cloud backend")}</p>
            <p className="text-muted-foreground max-w-md text-sm">
              {t("Start the cloud service or check VITE_CLOUD_BASE_URL.")}
            </p>
            <Button variant="outline" size="sm" onClick={() => me.refetch()}>
              {t("Retry")}
            </Button>
          </div>
        ) : me.data ? (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={<Coins />} label={t("Credit balance")}>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums">
                    {me.data.credits}
                  </span>
                  <span className="text-muted-foreground text-sm">{t("credits")}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 self-start"
                  onClick={() => navigate("/billing")}
                >
                  {t("Buy more")}
                </Button>
              </StatCard>

              <StatCard icon={<Crown />} label={t("Current plan")}>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold capitalize">
                    {me.data.plan_id}
                  </span>
                  {me.data.subscription ? (
                    <Badge variant="secondary">{me.data.subscription.status}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("Free")}</Badge>
                  )}
                </div>
                {me.data.subscription?.current_period_end ? (
                  <p className="text-muted-foreground text-xs">
                    {t("Renews")}{" "}
                    {new Date(
                      me.data.subscription.current_period_end,
                    ).toLocaleDateString()}
                  </p>
                ) : null}
              </StatCard>

              <StatCard icon={<Layers />} label={t("Batch limit")}>
                <span className="text-3xl font-semibold tabular-nums">
                  {me.data.entitlements.max_batch}
                </span>
                <span className="text-muted-foreground text-xs">
                  {t("videos per batch")}
                </span>
              </StatCard>
            </div>

            <div className="bg-card rounded-xl border p-5">
              <h2 className="mb-3 text-sm font-semibold">{t("What's unlocked")}</h2>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
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
        on ? "flex items-center gap-2" : "text-muted-foreground/50 flex items-center gap-2"
      }
    >
      <BadgeCheck className={on ? "text-primary size-4" : "size-4"} />
      {label}
    </li>
  );
}
