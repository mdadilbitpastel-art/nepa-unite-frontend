"use client";

import { Bell, Menu, PanelLeftClose, PanelLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/layouts/breadcrumbs";
import { UserMenu } from "@/layouts/user-menu";
import { useUiStore } from "@/stores/ui-store";
import { useNotificationStore } from "@/stores/notification-store";

export function Topbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const setNotifOpen = useUiStore((s) => s.setNotificationsOpen);
  const unread = useNotificationStore((s) => s.unread);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl glass md:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Desktop collapse */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <PanelLeft className="size-5" />
        ) : (
          <PanelLeftClose className="size-5" />
        )}
      </Button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5">
        {/* Global search trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent md:flex"
        >
          <Search className="size-4" />
          <span>Search…</span>
          <kbd className="ml-6 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label="Search"
        >
          <Search className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setNotifOpen(true)}
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-danger" />
            </span>
          )}
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}
