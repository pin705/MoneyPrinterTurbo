import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCloud } from "@/lib/useCloud";

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
const KEY_STORE = "mpt-admin-key";

export function AdminPage() {
  const { t } = useTranslation();
  const cloud = useCloud();
  const qc = useQueryClient();
  const [key, setKey] = useState(() => localStorage.getItem(KEY_STORE) ?? "");
  const [active, setActive] = useState(!!key);

  // Key the queries by the admin key so reconnecting with a different key
  // refetches instead of serving the previous key's cached data.
  const stats = useQuery({
    queryKey: ["admin-stats", key],
    queryFn: () => cloud.adminStats(key),
    enabled: active,
  });
  const users = useQuery({
    queryKey: ["admin-users", key],
    queryFn: () => cloud.adminUsers(key),
    enabled: active,
  });

  const adjust = useMutation({
    mutationFn: (v: { user_id: string; delta: number }) =>
      cloud.adminAdjustCredits(key, { ...v, reason: "admin-ui" }),
    onSuccess: () => {
      toast.success(t("Credits updated"));
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const connect = () => {
    localStorage.setItem(KEY_STORE, key);
    setActive(true);
  };

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={t("Admin")} subtitle={t("Users, credits and revenue")} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="bg-card mb-6 flex items-end gap-3 rounded-xl border border-border shadow-xs p-5">
          <div className="flex-1">
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium uppercase tracking-wider">
              {t("Admin key")}
            </label>
            <Input
              type="password"
              value={key}
              placeholder="X-Admin-Key"
              onChange={(e) => setKey(e.target.value)}
              className="font-mono"
            />
          </div>
          <Button onClick={connect} disabled={!key.trim()}>
            <ShieldCheck /> {t("Connect")}
          </Button>
        </div>

        {active && stats.isError ? (
          <p className="text-destructive text-sm">{t("Invalid admin key or backend offline.")}</p>
        ) : null}

        {stats.data ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={t("Users")} value={String(stats.data.users)} />
            <Stat label={t("Active subs")} value={String(stats.data.active_subscriptions)} />
            <Stat label={t("Credits out")} value={String(stats.data.credits_outstanding)} />
            <Stat label={t("Revenue")} value={vnd(stats.data.revenue_vnd)} />
          </div>
        ) : null}

        {users.data ? (
          <div className="bg-card overflow-hidden rounded-xl border border-border shadow-xs">
            {users.data.users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 border-b border-border px-5 py-3.5 text-sm last:border-0"
              >
                <span className="flex-1 truncate text-foreground">{u.email ?? u.id}</span>
                <span className="text-muted-foreground capitalize">{u.plan_id}</span>
                <span className="w-20 text-right tabular-nums font-medium text-foreground">{u.credits}</span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjust.mutate({ user_id: u.id, delta: 50 })}
                    className="text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    +50
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjust.mutate({ user_id: u.id, delta: -50 })}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    −50
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-xs p-5">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
