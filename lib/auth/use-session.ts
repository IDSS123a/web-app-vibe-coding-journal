"use client";

/**
 * Client-side session hook.
 * Reads the Supabase session (stored in localStorage by supabase-js after
 * signInWithPassword) and exposes the access_token for Authorization headers
 * on admin API calls. Identity only — the API still verifies the token and
 * looks up the role in user_profiles (M-7: DB is the authority on role).
 */

import { useEffect, useState } from "react";
import { supabase } from "@/lib/db/client";

export interface SessionState {
  token: string | null;
  email: string | null;
  loading: boolean;
}

export function useSession(): SessionState {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setToken(data.session?.access_token ?? null);
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { token, email, loading };
}
