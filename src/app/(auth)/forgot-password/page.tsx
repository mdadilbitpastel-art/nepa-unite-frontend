"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/stores/ui-store";

/** Password reset happens in the global popup — open it and bounce home. */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const openAuth = useUiStore((s) => s.openAuth);

  useEffect(() => {
    openAuth("forgot");
    router.replace("/");
  }, [openAuth, router]);

  return null;
}
