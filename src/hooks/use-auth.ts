"use client";

import { useSession, signOut as nextSignOut } from "next-auth/react";
import { useCallback } from "react";
import type { Role } from "@/types";

/** Convenience wrapper around the NextAuth session. */
export function useAuth() {
  const { data: session, status } = useSession();
  const signOut = useCallback(
    () => nextSignOut({ callbackUrl: "/" }),
    [],
  );
  return {
    session,
    user: session?.user,
    role: session?.user?.role as Role | undefined,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    signOut,
  };
}
