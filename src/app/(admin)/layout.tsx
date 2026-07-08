"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { DashboardShell } from "@/layouts/dashboard-shell";
import { DetailSkeleton } from "@/components/shared/states";

/** Admin portal shell — gated to signed-in admins. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || role !== "admin")) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, role, router]);

  if (isLoading || !isAuthenticated || role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-5xl p-8">
        <DetailSkeleton />
      </div>
    );
  }

  return <DashboardShell role="admin">{children}</DashboardShell>;
}
