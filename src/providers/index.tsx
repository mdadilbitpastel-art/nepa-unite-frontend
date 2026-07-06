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
          position="top-center"
          expand
          richColors
          gap={10}
          offset={18}
          duration={3500}
          toastOptions={{
            // Width is handled in globals.css (fit-content) so the box hugs the
            // text; here we just style the pill and centre the text.
            classNames: {
              toast:
                "rounded-2xl border border-border/60 shadow-elevated backdrop-blur-md px-4 py-3.5",
              title: "text-sm font-semibold tracking-tight text-center",
              description: "text-xs opacity-90 text-center",
              actionButton: "rounded-full",
            },
          }}
        />
      </QueryProvider>
    </SessionProvider>
  );
}
