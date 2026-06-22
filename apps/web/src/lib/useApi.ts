import { useMemo } from "react";
import { MptClient } from "@mpt/api-client";

import { useSettings } from "@/store/settings";

/** A backend client bound to the user-configured backend URL. */
export function useApi() {
  const backendUrl = useSettings((s) => s.backendUrl);
  return useMemo(() => new MptClient({ baseUrl: backendUrl }), [backendUrl]);
}
