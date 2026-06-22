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
        <div className="bg-zinc-900/50 mb-6 flex items-end gap-3 rounded-2xl border border-zinc-800/50 p-5">
          <div className="flex-1">
            <label className="text-zinc-500 mb-1.5 block text-xs font-medium uppercase tracking-wider">
              {t("Admin key")}
            </label>
            <Input
              type="password"
              value={key}
              placeholder="X-Admin-Key"
              onChange={(e) => setKey(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
            />
          </div>
          <Button onClick={connect} disabled={!key.trim()} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
            <ShieldCheck /> {t("Connect")}
          </Button>
        </div>

        {active && stats.isError ? (
          <p className="text-red-400 text-sm">{t("Invalid admin key or backend offline.")}</p>
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
          <div className="bg-zinc-900/50 overflow-hidden rounded-2xl border border-zinc-800/50">
            {users.data.users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 border-b border-zinc-800/50 px-5 py-4 text-sm last:border-0"
              >
                <span className="flex-1 truncate text-zinc-300">{u.email ?? u.id}</span>
                <span className="capitalize text-zinc-400">{u.plan_id}</span>
                <span className="w-20 text-right tabular-nums font-medium text-zinc-200">{u.credits}</span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjust.mutate({ user_id: u.id, delta: 50 })}
                    className="border-zinc-700 hover:bg-emerald-500/10 text-emerald-400"
                  >
                    +50
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjust.mutate({ user_id: u.id, delta: -50 })}
                    className="border-zinc-700 hover:bg-red-500/10 text-red-400"
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
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-5">
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}
