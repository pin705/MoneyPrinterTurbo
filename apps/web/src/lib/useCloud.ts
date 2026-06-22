import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CloudClient, type Me, type PlansCatalog } from "@mpt/api-client";

import { CLOUD_BASE_URL } from "@/lib/cloud";
import { useAuth } from "@/store/auth";

/** A cloud client bound to the current session token. */
export function useCloud(): CloudClient {
  const token = useAuth((s) => s.token);
  return useMemo(
    () => new CloudClient({ baseUrl: CLOUD_BASE_URL, token: token ?? undefined }),
    [token],
  );
}

/** Current account: credits, plan, entitlements. Enabled only when signed in. */
export function useMe() {
  const cloud = useCloud();
  const token = useAuth((s) => s.token);
  return useQuery<Me>({
    queryKey: ["me", token],
    queryFn: () => cloud.me(),
    enabled: !!token,
    staleTime: 30_000,
  });
}

/** Public pricing catalog (no auth required). */
export function usePlans() {
  const cloud = useCloud();
  return useQuery<PlansCatalog>({
    queryKey: ["plans"],
    queryFn: () => cloud.plans(),
    staleTime: 5 * 60_000,
  });
}
