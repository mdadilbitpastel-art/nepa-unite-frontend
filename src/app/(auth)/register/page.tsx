"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUiStore } from "@/stores/ui-store";

/**
 * No standalone signup screen — registration lives in the global popup
 * (Create account tab). This route just opens that popup and returns the
 * visitor to the storefront.
 */
function RegisterRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const openAuth = useUiStore((s) => s.openAuth);

  useEffect(() => {
    const callbackUrl = params.get("callbackUrl") ?? undefined;
    openAuth("register", callbackUrl);
    router.replace("/");
  }, [openAuth, params, router]);

  return null;
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterRedirect />
    </Suspense>
  );
}
