"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUiStore } from "@/stores/ui-store";

/**
 * Reached from the password-reset email link (/reset-password?uid=..&token=..).
 * Opens the global popup in "reset" view with those credentials, then bounces
 * to the storefront — there is no standalone reset screen.
 */
function ResetRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const openReset = useUiStore((s) => s.openReset);

  useEffect(() => {
    openReset(params.get("uid") ?? "", params.get("token") ?? "");
    router.replace("/");
  }, [openReset, params, router]);

  return null;
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetRedirect />
    </Suspense>
  );
}
