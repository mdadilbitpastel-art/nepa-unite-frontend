"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { setAccessToken, setUnauthorizedHandler } from "@/lib/api-token";

/**
 * Keeps the axios access token in sync with the NextAuth session and wires the
 * global 401 handler to sign the user out (covers suspended/expired accounts).
 */
export function TokenSync() {
  const { data: session } = useSession();

  useEffect(() => {
    setAccessToken(session?.accessToken ?? null);
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      void signOut({ callbackUrl: "/login?reason=session-expired" });
    }
  }, [session?.error]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut({ callbackUrl: "/login?reason=session-expired" });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  return null;
}
