/**
 * Client for the Vidova Cloud backend (apps/cloud) — accounts, credits,
 * plans, subscriptions and payments. Distinct from MptClient, which talks to the
 * local render backend. Auth is a Bearer token (Supabase JWT in production, or a
 * `dev:<uid>:<email>` token when the cloud runs with AUTH_DEV_MODE).
 */
import { ApiError } from "./types";

export interface Entitlements {
  watermark: boolean;
  max_resolution: "720p" | "1080p" | "4k";
  max_batch: number;
  sources: string[];
  voices: "basic" | "all";
  scheduling: boolean;
  api: boolean;
  cloud_library: boolean;
}

export interface SubscriptionSummary {
  plan_id: string;
  status: string;
  billing_cycle: "monthly" | "yearly";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export interface Me {
  id: string;
  email: string | null;
  credits: number;
  plan_id: string;
  entitlements: Entitlements;
  subscription: SubscriptionSummary | null;
}

export interface Plan {
  id: string;
  name: string;
  price_vnd_month: number;
  price_vnd_year: number;
  monthly_credits: number;
  signup_grant: number;
  entitlements: Entitlements;
}

export interface CreditPack {
  id: string;
  credits: number;
  price_vnd: number;
}

export interface PlansCatalog {
  plans: Plan[];
  credit_packs: CreditPack[];
}

export interface CheckoutInput {
  kind: "plan" | "pack";
  target_id: string;
  billing_cycle?: "monthly" | "yearly";
}

export interface CheckoutResult {
  order_code: string;
  amount_vnd: number;
  transfer_content: string;
  qr_url: string;
  account: string;
  bank: string;
  expires_in_minutes: number;
}

export interface OrderStatus {
  order_code: string;
  status: "pending" | "paid" | "expired";
  amount_vnd: number;
}

export interface Invoice {
  order_code: string;
  kind: string;
  target_id: string;
  amount_vnd: number;
  credits: number;
  paid_at: string | null;
}

export interface AdminUser {
  id: string;
  email: string | null;
  credits: number;
  plan_id: string;
  created_at: string;
}

export interface AdminStats {
  users: number;
  active_subscriptions: number;
  credits_outstanding: number;
  paid_orders: number;
  revenue_vnd: number;
}

export interface CloudClientOptions {
  baseUrl: string;
  /** Bearer token; omit for public endpoints (e.g. the plans catalog). */
  token?: string;
}

export class CloudClient {
  constructor(private opts: CloudClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (this.opts.token) headers["Authorization"] = `Bearer ${this.opts.token}`;

    const res = await fetch(`${this.opts.baseUrl}${path}`, { ...init, headers });
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    if (!res.ok) {
      const detail =
        (body as { detail?: string } | undefined)?.detail ??
        `Request failed: ${res.status}`;
      throw new ApiError(res.status, detail, body);
    }
    return body as T;
  }

  /** GET /health — true if the cloud backend is reachable. */
  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.opts.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /** GET /v1/me — profile, credit balance, plan and entitlements. */
  me(): Promise<Me> {
    return this.request<Me>("/v1/me");
  }

  /** GET /v1/plans — public pricing catalog. */
  plans(): Promise<PlansCatalog> {
    return this.request<PlansCatalog>("/v1/plans");
  }

  /** POST /v1/payments/checkout — create an order, returns the SePay QR + memo. */
  checkout(input: CheckoutInput): Promise<CheckoutResult> {
    return this.request<CheckoutResult>("/v1/payments/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** GET /v1/payments/orders/{code} — poll until status is "paid". */
  getOrder(code: string): Promise<OrderStatus> {
    return this.request<OrderStatus>(`/v1/payments/orders/${code}`);
  }

  /** GET /v1/payments/invoices — the user's paid orders. */
  invoices(): Promise<{ invoices: Invoice[] }> {
    return this.request<{ invoices: Invoice[] }>("/v1/payments/invoices");
  }

  // --- Admin (authenticated by a separate admin key, not the user token) ---

  adminUsers(adminKey: string): Promise<{ users: AdminUser[] }> {
    return this.request<{ users: AdminUser[] }>("/v1/admin/users", {
      headers: { "X-Admin-Key": adminKey },
    });
  }

  adminStats(adminKey: string): Promise<AdminStats> {
    return this.request<AdminStats>("/v1/admin/stats", {
      headers: { "X-Admin-Key": adminKey },
    });
  }

  adminAdjustCredits(
    adminKey: string,
    body: { user_id: string; delta: number; reason: string },
  ): Promise<{ user_id: string; balance: number }> {
    return this.request("/v1/admin/credits", {
      method: "POST",
      headers: { "X-Admin-Key": adminKey },
      body: JSON.stringify(body),
    });
  }
}
