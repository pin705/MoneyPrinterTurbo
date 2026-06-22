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
        toast.success(t("Payment received — credits added 🎉"));
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
        {/* Billing cycle toggle */}
        <div className="mb-6 flex justify-center">
          <div className="bg-muted inline-flex rounded-lg p-0.5">
            {(["monthly", "yearly"] as Cycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors " +
                  (cycle === c
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground")
                }
              >
                {c === "monthly" ? t("Monthly") : t("Yearly")}
                {c === "yearly" ? (
                  <span className="text-primary ml-1 text-xs">{t("-17%")}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {plans.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
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

            <h2 className="mt-10 mb-3 text-sm font-semibold">
              {t("Credit top-ups")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.data.credit_packs.map((pack) => (
                <div
                  key={pack.id}
                  className="bg-card flex flex-col gap-3 rounded-xl border p-5"
                >
                  <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                    <Coins className="size-4" /> {pack.credits} {t("credits")}
                  </div>
                  <div className="text-2xl font-semibold">{vnd(pack.price_vnd)}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={buy.isPending}
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
                <h2 className="mt-10 mb-3 text-sm font-semibold">{t("Invoices")}</h2>
                <div className="bg-card overflow-hidden rounded-xl border">
                  {invoices.data.invoices.map((inv) => (
                    <div
                      key={inv.order_code}
                      className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-0"
                    >
                      <span className="font-mono text-xs">{inv.order_code}</span>
                      <span className="capitalize">{inv.target_id}</span>
                      <span className="tabular-nums">{vnd(inv.amount_vnd)}</span>
                      <span className="text-muted-foreground text-xs">
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
          <p className="text-muted-foreground py-16 text-center text-sm">
            {t("Couldn’t load plans. Is the cloud backend running?")}
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
        "bg-card relative flex flex-col gap-4 rounded-xl border p-6 " +
        (featured ? "border-primary ring-primary/20 ring-1" : "")
      }
    >
      {featured ? (
        <Badge className="absolute -top-2 right-4">{t("Popular")}</Badge>
      ) : null}
      <div>
        <h3 className="text-base font-semibold">{plan.name}</h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-semibold">{vnd(price)}</span>
          {!isFree ? (
            <span className="text-muted-foreground text-sm">
              /{cycle === "yearly" ? t("yr") : t("mo")}
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {plan.monthly_credits} {t("credits/mo")}
        </p>
      </div>

      <ul className="flex flex-col gap-1.5 text-sm">
        <Feat ok={!plan.entitlements.watermark} label={t("No watermark")} />
        <Feat ok label={`${t("Up to")} ${plan.entitlements.max_resolution}`} />
        <Feat ok label={`${t("Batch")} ${plan.entitlements.max_batch}`} />
        <Feat ok={plan.entitlements.scheduling} label={t("Scheduled posting")} />
        <Feat ok={plan.entitlements.api} label={t("API access")} />
      </ul>

      <div className="mt-auto">
        {current ? (
          <Button variant="outline" className="w-full" disabled>
            {t("Current plan")}
          </Button>
        ) : isFree ? (
          <Button variant="ghost" className="w-full" disabled>
            {t("Free forever")}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={featured ? "default" : "outline"}
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
    <li className={ok ? "flex items-center gap-2" : "text-muted-foreground/40 flex items-center gap-2"}>
      <Check className={ok ? "text-primary size-4" : "size-4"} />
      {label}
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("Scan to pay with SePay")}</DialogTitle>
          <DialogDescription>
            {t("Transfer the exact amount — your account updates automatically.")}
          </DialogDescription>
        </DialogHeader>
        {checkout ? (
          <div className="flex flex-col items-center gap-3">
            {checkout.qr_url ? (
              <img
                src={checkout.qr_url}
                alt="SePay QR"
                className="size-56 rounded-lg border"
              />
            ) : (
              <p className="text-muted-foreground text-center text-xs">
                {t("Set SEPAY_ACCOUNT/SEPAY_BANK to render the QR.")}
              </p>
            )}
            <div className="w-full rounded-lg border p-3 text-sm">
              <Row label={t("Amount")} value={vnd(checkout.amount_vnd)} />
              <Row label={t("Content")} value={checkout.transfer_content} mono />
              {checkout.account ? (
                <Row label={t("Account")} value={`${checkout.account} · ${checkout.bank}`} />
              ) : null}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin" />
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
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={mono ? "font-mono text-xs" : "text-sm font-medium"}>{value}</span>
    </div>
  );
}
