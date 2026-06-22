# Vidova Cloud

The managed backend that powers accounts, **credits**, and the **LLM proxy**.
The desktop app calls this for AI text generation so the DeepSeek key never
ships to clients and every call is metered.

> Rendering stays local on the user's machine — this service only meters the
> cheap AI text step. That's the whole monetization model: sell credits at a
> small markup over DeepSeek's per-token cost.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | liveness |
| GET | `/v1/me` | Bearer | profile + credit balance |
| POST | `/v1/llm/script` | Bearer | debit 1 credit → DeepSeek script (refund on failure) |
| POST | `/v1/llm/terms` | Bearer | debit 1 credit → DeepSeek search terms |
| POST | `/v1/payments/webhook` | signature | idempotent credit top-up |

## Design guarantees

- **Atomic debit** — `credits.debit_credits` locks the balance row
  (`SELECT … FOR UPDATE` on Postgres) so concurrent requests can't overspend.
- **Refund on failure** — if the DeepSeek call throws after a debit, the credit
  is granted back (`reason="refund"`).
- **Idempotent top-ups** — `ProcessedPayment` records each provider payment id;
  duplicate webhooks are no-ops.
- **Append-only ledger** — `CreditTransaction` is the source of truth;
  `CreditBalance` is a locked cache.
- **Client is never trusted** — all enforcement is server-side; the desktop app
  only holds the user's JWT.

## Run locally

```bash
cd apps/cloud
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill DEEPSEEK_API_KEY + SUPABASE_JWT_SECRET
uvicorn app.main:app --reload --port 8787
```
Dev uses SQLite automatically when `DATABASE_URL` is unset.

## Desktop integration (Phase 3 wiring, in the React app)

When signed in, point the AI calls at this service instead of the local backend:
`@mpt/api-client` gains a cloud base URL + the user's JWT; `ContentPanel`'s
script/terms mutations call `/v1/llm/*`. Keep bring-your-own-key as the free
fallback (calls the local backend, no credits).

## TODO before production

- Verify real provider webhook signatures in `payments.verify_signature`.
- Switch `auth.py` to RS256 + JWKS if using Clerk/Auth0.
- Add Alembic migrations (instead of `create_all`).
- Rate-limit per user; alert on refund spikes (failed-call abuse).
