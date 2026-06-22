import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@mpt/api-client";
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
import { useAuth } from "@/store/auth";

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
    <div className="bg-card flex flex-col gap-3 rounded-2xl border border-border p-6 transition-all duration-200 hover:border-border/80">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
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
  const qc = useQueryClient();
  const signOut = useAuth((s) => s.signOut);
  const me = useMe();
  const authErr =
    me.error instanceof ApiError &&
    (me.error.status === 401 || me.error.status === 403);
  const reauth = () => {
    signOut();
    qc.clear();
    navigate("/login");
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title={t("Dashboard")}
        subtitle={t("Your credits, plan and what's unlocked")}
        actions={
          <Button size="sm" onClick={() => navigate("/billing")} className="bg-primary text-primary-foreground font-semibold">
            <Sparkles /> {t("Upgrade / Buy credits")}
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {me.isLoading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-24 text-sm">
            <Loader2 className="size-4 animate-spin" /> {t("Loading…")}
          </div>
        ) : me.isError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="bg-destructive/10 text-destructive rounded-2xl p-4">
              <AlertCircle className="size-8" />
            </div>
            {authErr ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  {t("Session not authorized")}
                </p>
                <p className="text-muted-foreground max-w-md text-sm">
                  {t("Your session is invalid, or the cloud's SUPABASE_JWT_SECRET doesn't match your Supabase project. Sign in again or fix the secret.")}
                </p>
                <Button variant="outline" size="sm" onClick={reauth}>
                  {t("Sign in again")}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  {t("Couldn't reach the cloud backend")}
                </p>
                <p className="text-muted-foreground max-w-md text-sm">
                  {t("Start the cloud service or check VITE_CLOUD_BASE_URL.")}
                </p>
                <Button variant="outline" size="sm" onClick={() => me.refetch()}>
                  {t("Retry")}
                </Button>
              </>
            )}
          </div>
        ) : me.data ? (
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={<Coins />} label={t("Credit balance")}>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums text-foreground">
                    {me.data.credits}
                  </span>
                  <span className="text-muted-foreground text-sm">{t("credits")}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 self-start"
                  onClick={() => navigate("/billing")}
                >
                  {t("Buy more")}
                </Button>
              </StatCard>

              <StatCard icon={<Crown />} label={t("Current plan")}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold capitalize text-foreground">
                    {me.data.plan_id}
                  </span>
                  {me.data.subscription ? (
                    <Badge variant="secondary">
                      {me.data.subscription.status}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {t("Free")}
                    </Badge>
                  )}
                </div>
                {me.data.subscription?.current_period_end ? (
                  <p className="text-muted-foreground text-xs mt-1">
                    {t("Renews")}{" "}
                    {new Date(
                      me.data.subscription.current_period_end,
                    ).toLocaleDateString()}
                  </p>
                ) : null}
              </StatCard>

              <StatCard icon={<Layers />} label={t("Batch limit")}>
                <span className="text-4xl font-bold tabular-nums text-foreground">
                  {me.data.entitlements.max_batch}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t("videos per batch")}
                </span>
              </StatCard>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wider">{t("What's unlocked")}</h2>
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
        on ? "flex items-center gap-2.5" : "text-muted-foreground/50 flex items-center gap-2.5"
      }
    >
      <BadgeCheck className={on ? "text-primary size-4" : "size-4 text-muted-foreground/30"} />
      <span className={on ? "text-foreground" : "text-muted-foreground/50"}>{label}</span>
    </li>
  );
}
