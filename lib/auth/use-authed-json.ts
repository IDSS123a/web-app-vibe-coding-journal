"use client";

/**
 * Fetches a JSON endpoint with the session's access token and exposes the
 * HTTP status. Used by the paid pages (dashboard, archive) that render
 * client-side from the server-side-paywalled /api/reports routes — the
 * session lives in the browser, so the token has to be attached by client
 * code. Response envelope expected: { success: true, data: T }.
 */

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";

export interface AuthedJsonState<T> {
  data: T | null;
  status: number | null;
  loading: boolean;
  error: string | null;
}

export function useAuthedJson<T>(path: string): AuthedJsonState<T> {
  const { token, loading: sessionLoading } = useSession();
  const [state, setState] = useState<AuthedJsonState<T>>({ data: null, status: null, loading: true, error: null });

  useEffect(() => {
    if (sessionLoading || !token) return;
    let active = true;
    setState({ data: null, status: null, loading: true, error: null });
    fetch(path, { headers: { authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as { data?: T; error?: string } | null;
        if (!active) return;
        if (!res.ok) {
          setState({ data: null, status: res.status, loading: false, error: body?.error ?? `HTTP ${res.status}` });
          return;
        }
        setState({ data: (body?.data ?? null) as T | null, status: res.status, loading: false, error: null });
      })
      .catch(() => {
        if (active) setState({ data: null, status: null, loading: false, error: "Network error" });
      });
    return () => {
      active = false;
    };
  }, [path, token, sessionLoading]);

  return state;
}
