"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarNav, MobileSidebarNav } from "@/layouts/sidebar-nav";
import { Topbar } from "@/layouts/topbar";
import { CommandPalette } from "@/layouts/command-palette";
import { NotificationCenter } from "@/layouts/notification-center";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { useUiStore } from "@/stores/ui-store";
import type { Role } from "@/types";

/**
 * Shared dashboard shell for all four role portals: responsive sidebar,
 * topbar, command palette (⌘K), notification drawer and an error boundary
 * around page content.
 */
export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-background">
        <SidebarNav role={role} />

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0" hideClose>
            <MobileSidebarNav role={role} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1600px] animate-fade-in">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>

        <CommandPalette role={role} />
        <NotificationCenter />
      </div>
    </TooltipProvider>
  );
}
