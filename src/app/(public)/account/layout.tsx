"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/stores/ui-store";
import { DetailSkeleton } from "@/components/shared/states";

/**
 * Account section shell. Lives inside the public storefront (so it keeps the
 * storefront header/footer, not the old dashboard) but requires a signed-in
 * user — guests are bounced to the sign-in page.
 */
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const openAuth = useUiStore((s) => s.openAuth);

  // The account area needs a signed-in user. Guests get the sign-in popup and
  // are sent back to the storefront home (there is no standalone login page).
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openAuth("login");
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, openAuth, router]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {isLoading || !isAuthenticated ? <DetailSkeleton /> : children}
    </div>
  );
}
