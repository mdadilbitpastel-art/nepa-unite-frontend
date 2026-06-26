import { Suspense } from "react";
import { StorefrontHeader } from "@/components/shop/storefront-header";
import { StorefrontFooter } from "@/components/shop/storefront-footer";

/**
 * Public storefront shell — the shopping surface anyone can browse without
 * logging in. Login is only required at checkout (handled per-page). Distinct
 * from the role dashboards under /buyer, /seller, /admin, /auditor, which use
 * the DashboardShell.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* useSearchParams in the header requires a Suspense boundary. */}
      <Suspense fallback={<div className="h-16 border-b" />}>
        <StorefrontHeader />
      </Suspense>
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
