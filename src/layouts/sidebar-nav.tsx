"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/brand-logo";
import { NAV_BY_ROLE } from "@/lib/navigation";
import { APP_NAME, ROLE_LABEL } from "@/lib/constants";
import { useUiStore } from "@/stores/ui-store";
import { useCartUiStore } from "@/stores/cart-store";
import { useNotificationStore } from "@/stores/notification-store";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

function NavBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-accent px-1.5 text-[11px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const cartCount = useCartUiStore((s) => s.count);
  const unread = useNotificationStore((s) => s.unread);
  const sections = NAV_BY_ROLE[role];

  const badgeFor = (key?: string) => {
    if (key === "cart") return cartCount;
    if (key === "notifications") return unread;
    return 0;
  };

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 lg:sticky lg:top-0 lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5",
          collapsed && "justify-center px-0",
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-gradient shadow-glow">
          <BrandLogo className="size-6 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-white">
              {APP_NAME}
            </span>
            <span className="text-[11px] text-sidebar-muted">
              {ROLE_LABEL[role]} Portal
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-thin px-3 py-5">
        {sections.map((section, si) => (
          <div key={si} className="space-y-1">
            {section.heading && !collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.heading}
              </p>
            )}
            {section.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              const count = badgeFor(item.badgeKey);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-accent/15 text-white"
                      : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                  )}
                >
                  <span className="relative">
                    <Icon className="size-[18px] shrink-0" />
                    {collapsed && count > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 size-2 rounded-full bg-sidebar-accent" />
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="truncate">{item.label}</span>
                      <NavBadge count={count} />
                    </>
                  )}
                  {active && !collapsed && (
                    <span className="absolute left-0 h-6 w-1 rounded-r-full bg-sidebar-accent" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-medium text-white">Need help?</p>
            <p className="mt-0.5 text-[11px] text-sidebar-muted">
              Visit the docs or contact support.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

/** Mobile sidebar contents (rendered inside a Sheet). */
export function MobileSidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const sections = NAV_BY_ROLE[role];

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-teal-gradient">
          <BrandLogo className="size-6 text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-white">{APP_NAME}</span>
          <span className="text-[11px] text-sidebar-muted">
            {ROLE_LABEL[role]} Portal
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section, si) => (
          <div key={si} className="space-y-1">
            {section.heading && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.heading}
              </p>
            )}
            {section.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent/15 text-white"
                      : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="size-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
