# Operations Runbook

How to run MoneyPrinter Cloud (the account/credit/billing backend) in production.
Render is local on user machines — this only concerns the cloud service.

## Environment

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres in prod (Supabase/Neon/RDS). SQLite only for dev. |
| `SUPABASE_JWT_SECRET` / `JWT_ALG` | Verify user tokens. |
| `AUTH_DEV_MODE` | **Must be unset/0 in prod.** Dev-only `dev:` tokens. |
| `DEEPSEEK_API_KEY` / `DEEPSEEK_*` | Managed LLM (server-side only). |
| `SEPAY_WEBHOOK_API_KEY` | Authenticates the SePay webhook (`Apikey`). Required. |
| `SEPAY_ACCOUNT` / `SEPAY_BANK` | Build the checkout VietQR. |
| `ADMIN_API_KEY` | Gates `/v1/admin/*`. Unset ⇒ admin disabled. |
| `LLM_RATE_LIMIT_PER_MIN` | Per-user AI call cap (default 30). |
| `SENTRY_DSN` | Error tracking (optional; needs `sentry-sdk`). |
| `CORS_ALLOWED_ORIGINS` | Web + desktop origins. |

## The money invariants (do not break)

- **Ledger is append-only.** `CreditTransaction` is truth; `CreditBalance` is a
  locked cache. Never edit balances directly — go through grant/debit.
- **Webhook is idempotent** on the SePay transaction id *and* on the grant `ref`
  (`order:<code>`). A replayed webhook is a no-op.
- **All enforcement is server-side.** The client is never trusted for credits,
  plan, or batch limits.

## Backup & DR

- Postgres: automated daily snapshots + point-in-time recovery (PITR) enabled.
  The ledger is the source of truth for money — losing it is unacceptable.
- Test restore quarterly into a scratch DB.
- Keep `ProcessedPayment` and `Order` rows indefinitely for reconciliation.

## Payment reconciliation (weekly)

1. Export SePay transactions for the period.
2. For each incoming transfer, confirm a matching `ProcessedPayment` (by SePay
   id) and a `paid` `Order`.
3. Investigate `unmatched` webhooks (memo without a valid order code) and refund
   or credit manually via `POST /v1/admin/credits` with a clear reason.
4. Sum `paid` order amounts vs SePay settled total — they must agree.

## Incident: webhook outage / missed payments

- SePay retries failed webhooks; ensure the endpoint returns 2xx only after a
  successful fulfill. If the service was down, replay from the SePay dashboard.
- A user paid but has no credits → find the transfer memo (order code), confirm
  the `Order`, and run `POST /v1/admin/credits` (audited) to make them whole.

## Health & monitoring

- `GET /health` for liveness; put it behind your uptime monitor + a public
  status page.
- Alert on: 5xx rate, webhook 4xx/5xx, DeepSeek error rate (drives refunds),
  and credit-grant anomalies.

## Pre-launch checklist

- [ ] `AUTH_DEV_MODE` is off; real Supabase JWTs verified.
- [ ] `SEPAY_WEBHOOK_API_KEY` set; a sandbox transfer fulfills end-to-end.
- [ ] `ADMIN_API_KEY` set to a strong secret; `/v1/admin` reachable only by ops.
- [ ] Postgres backups + PITR on; restore tested.
- [ ] Legal pages live (Terms/Privacy/Refund) and linked at checkout.
- [ ] Rate limits tuned; Sentry receiving events.
- [ ] DeepSeek live-cost measured (`scripts/estimate_llm_cost.py --live`) and
      prices locked in `apps/cloud/app/plans.py`.
