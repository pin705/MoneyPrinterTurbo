import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Coins, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { CheckoutInput, CheckoutResult, Plan } from "@mpt/api-client";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCloud, useMe, usePlans } from "@/lib/useCloud";

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";

type Cycle = "monthly" | "yearly";

export function BillingPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const cloud = useCloud();
  const me = useMe();
  const plans = usePlans();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);

  const buy = useMutation({
    mutationFn: (input: CheckoutInput) => cloud.checkout(input),
    onSuccess: (res) => setCheckout(res),
    onError: (e: Error) => toast.error(e.message),
  });

  // Poll the open order until SePay confirms payment — stopping on any terminal
  // status so an unpaid/expired order never polls the backend forever.
  useQuery({
    queryKey: ["order", checkout?.order_code],
    queryFn: async () => {
      const o = await cloud.getOrder(checkout!.order_code);
      if (o.status === "paid") {
        toast.success(t("Payment received — credits added"));
        setCheckout(null);
        qc.invalidateQueries({ queryKey: ["me"] });
        qc.invalidateQueries({ queryKey: ["invoices"] });
      } else if (o.status === "expired") {
        toast.error(t("Payment expired — please try again"));
        setCheckout(null);
      }
      return o;
    },
    enabled: !!checkout,
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 3000 : false),
  });

  const invoices = useQuery({
    queryKey: ["invoices", me.data?.id],
    queryFn: () => cloud.invoices(),
    enabled: !!me.data,
  });

  const currentPlan = me.data?.plan_id ?? "free";

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader title={t("Billing")} subtitle={t("Plans and credit top-ups")} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* Billing cycle toggle */}
        <div className="mb-8 flex justify-center">
          <div className="bg-zinc-800/50 inline-flex rounded-xl p-1">
            {(["monthly", "yearly"] as Cycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={
                  "rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 " +
                  (cycle === c
                    ? "bg-zinc-700 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300")
                }
              >
                {c === "monthly" ? t("Monthly") : t("Yearly")}
                {c === "yearly" ? (
                  <span className="text-emerald-400 ml-1.5 text-xs font-semibold">{t("-17%")}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {plans.isLoading ? (
          <div className="text-zinc-500 flex items-center gap-2 py-16 text-sm">
            <Loader2 className="size-4 animate-spin" /> {t("Loading…")}
          </div>
        ) : plans.data ? (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              {plans.data.plans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  cycle={cycle}
                  current={currentPlan === p.id}
                  pending={buy.isPending}
                  onChoose={() =>
                    buy.mutate({
                      kind: "plan",
                      target_id: p.id,
                      billing_cycle: cycle,
                    })
                  }
                />
              ))}
            </div>

            <h2 className="mt-12 mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">
              {t("Credit top-ups")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.data.credit_packs.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-zinc-900/50 flex flex-col gap-3 rounded-2xl border border-zinc-800/50 p-6 transition-all duration-200 hover:border-zinc-700/50"
                >
                  <div className="text-zinc-500 flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                    <Coins className="size-4" /> {pack.credits} {t("credits")}
                  </div>
                  <div className="text-3xl font-bold text-zinc-100">{vnd(pack.price_vnd)}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={buy.isPending}
                    className="mt-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                    onClick={() =>
                      buy.mutate({ kind: "pack", target_id: pack.id })
                    }
                  >
                    {t("Buy")}
                  </Button>
                </div>
              ))}
            </div>

            {invoices.data && invoices.data.invoices.length > 0 ? (
              <>
                <h2 className="mt-12 mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">{t("Invoices")}</h2>
                <div className="bg-zinc-900/50 overflow-hidden rounded-2xl border border-zinc-800/50">
                  {invoices.data.invoices.map((inv) => (
                    <div
                      key={inv.order_code}
                      className="flex items-center justify-between border-b border-zinc-800/50 px-5 py-4 text-sm last:border-0"
                    >
                      <span className="font-mono text-xs text-zinc-500">{inv.order_code}</span>
                      <span className="capitalize text-zinc-300">{inv.target_id}</span>
                      <span className="tabular-nums font-medium text-zinc-200">{vnd(inv.amount_vnd)}</span>
                      <span className="text-zinc-500 text-xs">
                        {inv.paid_at
                          ? new Date(inv.paid_at).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : (
          <p className="text-zinc-500 py-16 text-center text-sm">
            {t("Couldn't load plans. Is the cloud backend running?")}
          </p>
        )}
      </main>

      <PaymentDialog checkout={checkout} onClose={() => setCheckout(null)} />
    </div>
  );
}

function PlanCard({
  plan,
  cycle,
  current,
  pending,
  onChoose,
}: {
  plan: Plan;
  cycle: Cycle;
  current: boolean;
  pending: boolean;
  onChoose: () => void;
}) {
  const { t } = useTranslation();
  const price = cycle === "yearly" ? plan.price_vnd_year : plan.price_vnd_month;
  const isFree = plan.id === "free";
  const featured = plan.id === "creator";

  return (
    <div
      className={
        "bg-zinc-900/50 relative flex flex-col gap-4 rounded-2xl border p-6 transition-all duration-200 " +
        (featured
          ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
          : "border-zinc-800/50 hover:border-zinc-700/50")
      }
    >
      {featured ? (
        <Badge className="absolute -top-3 right-6 bg-emerald-500 text-black border-0 font-semibold">{t("Popular")}</Badge>
      ) : null}
      <div>
        <h3 className="text-base font-semibold text-zinc-200">{plan.name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-zinc-100">{vnd(price)}</span>
          {!isFree ? (
            <span className="text-zinc-500 text-sm">
              /{cycle === "yearly" ? t("yr") : t("mo")}
            </span>
          ) : null}
        </div>
        <p className="text-zinc-500 mt-1 text-xs">
          {plan.monthly_credits} {t("credits/mo")}
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-sm">
        <Feat ok={!plan.entitlements.watermark} label={t("No watermark")} />
        <Feat ok label={`${t("Up to")} ${plan.entitlements.max_resolution}`} />
        <Feat ok label={`${t("Batch")} ${plan.entitlements.max_batch}`} />
        <Feat ok={plan.entitlements.scheduling} label={t("Scheduled posting")} />
        <Feat ok={plan.entitlements.api} label={t("API access")} />
      </ul>

      <div className="mt-auto pt-2">
        {current ? (
          <Button variant="outline" className="w-full border-zinc-700 text-zinc-400" disabled>
            {t("Current plan")}
          </Button>
        ) : isFree ? (
          <Button variant="ghost" className="w-full text-zinc-500" disabled>
            {t("Free forever")}
          </Button>
        ) : (
          <Button
            className={
              "w-full font-semibold " +
              (featured
                ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100")
            }
            disabled={pending}
            onClick={onChoose}
          >
            <Sparkles /> {t("Choose")} {plan.name}
          </Button>
        )}
      </div>
    </div>
  );
}

function Feat({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? "flex items-center gap-2.5" : "text-zinc-600 flex items-center gap-2.5"}>
      <Check className={ok ? "text-emerald-400 size-4" : "size-4 text-zinc-700"} />
      <span className={ok ? "text-zinc-300" : "text-zinc-600"}>{label}</span>
    </li>
  );
}

function PaymentDialog({
  checkout,
  onClose,
}: {
  checkout: CheckoutResult | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={!!checkout} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{t("Scan to pay with SePay")}</DialogTitle>
          <DialogDescription className="text-zinc-500">
            {t("Transfer the exact amount — your account updates automatically.")}
          </DialogDescription>
        </DialogHeader>
        {checkout ? (
          <div className="flex flex-col items-center gap-4">
            {checkout.qr_url ? (
              <img
                src={checkout.qr_url}
                alt="SePay QR"
                className="size-56 rounded-xl border border-zinc-800"
              />
            ) : (
              <p className="text-zinc-500 text-center text-xs">
                {t("Set SEPAY_ACCOUNT/SEPAY_BANK to render the QR.")}
              </p>
            )}
            <div className="w-full rounded-xl border border-zinc-800 bg-zinc-800/50 p-4 text-sm">
              <Row label={t("Amount")} value={vnd(checkout.amount_vnd)} />
              <Row label={t("Content")} value={checkout.transfer_content} mono />
              {checkout.account ? (
                <Row label={t("Account")} value={`${checkout.account} · ${checkout.bank}`} />
              ) : null}
            </div>
            <div className="text-zinc-500 flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin text-emerald-400" />
              {t("Waiting for payment…")}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-zinc-500 text-xs">{label}</span>
      <span className={mono ? "font-mono text-xs text-zinc-300" : "text-sm font-medium text-zinc-200"}>{value}</span>
    </div>
  );
}
