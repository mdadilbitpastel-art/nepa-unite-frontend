"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/layouts/dashboard-shell";
import { DetailSkeleton } from "@/components/shared/states";

/** Seller portal shell — gated to signed-in sellers. */
export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || role !== "seller")) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, role, router]);

  if (isLoading || !isAuthenticated || role !== "seller") {
    return (
      <div className="mx-auto w-full max-w-5xl p-8">
        <DetailSkeleton />
      </div>
    );
  }

  return <DashboardShell role="seller">{children}</DashboardShell>;
}
