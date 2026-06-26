"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";
import { TokenSync } from "./token-sync";
import { CartSync } from "./cart-sync";
import { AuthDialog } from "@/components/shared/auth-dialog";

/** App-wide client providers: session, query cache, toasts. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
      <QueryProvider>
        <TokenSync />
        <CartSync />
        {children}
        <AuthDialog />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ className: "rounded-xl" }}
        />
      </QueryProvider>
    </SessionProvider>
  );
}
