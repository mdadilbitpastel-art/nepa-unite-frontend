"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useUiStore } from "@/stores/ui-store";

/**
 * There is no standalone login screen — authentication always happens in the
 * global popup. This route only exists so NextAuth/middleware redirects to
 * "/login" still work: it opens the popup and bounces back to the storefront.
 */
function LoginRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const openAuth = useUiStore((s) => s.openAuth);

  useEffect(() => {
    if (params.get("reason") === "session-expired") {
      toast.warning("Your session expired. Please sign in again.");
    }
    const callbackUrl = params.get("callbackUrl") ?? undefined;
    openAuth("login", callbackUrl);
    router.replace("/");
  }, [openAuth, params, router]);

  return null;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginRedirect />
    </Suspense>
  );
}
