"use client";

import { useEffect } from "react";
import { Bell, CheckCheck, Package, CreditCard, UserCog, Server } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useNotificationStore,
  type AppNotification,
} from "@/stores/notification-store";
import { useUiStore } from "@/stores/ui-store";
import { cn, timeAgo } from "@/lib/utils";

const KIND_ICON = {
  order: Package,
  payment: CreditCard,
  account: UserCog,
  system: Server,
} as const;

const KIND_ACCENT = {
  order: "bg-brand/10 text-brand",
  payment: "bg-success/10 text-success",
  account: "bg-warning/10 text-warning",
  system: "bg-muted text-muted-foreground",
} as const;

function NotificationRow({ n }: { n: AppNotification }) {
  const markRead = useNotificationStore((s) => s.markRead);
  const Icon = KIND_ICON[n.kind];
  return (
    <button
      onClick={() => markRead(n.id)}
      className={cn(
        "flex w-full gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent/50",
        !n.read && "border-brand/20 bg-brand/[0.03]",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          KIND_ACCENT[n.kind],
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {n.title}
          </p>
          {!n.read && <span className="size-2 shrink-0 rounded-full bg-brand" />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {n.body}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {timeAgo(n.createdAt)}
        </p>
      </div>
    </button>
  );
}

export function NotificationCenter() {
  const open = useUiStore((s) => s.notificationsOpen);
  const setOpen = useUiStore((s) => s.setNotificationsOpen);
  const { items, unread, markAllRead, setItems } = useNotificationStore();

  // Seed demo notifications once (replace with a real endpoint/socket).
  useEffect(() => {
    if (items.length === 0) {
      setItems([
        {
          id: "1",
          title: "Order confirmed",
          body: "Order #A1B2 has been confirmed and is awaiting fulfillment.",
          kind: "order",
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        },
        {
          id: "2",
          title: "Payment received",
          body: "A payment of $1,240.00 was captured successfully.",
          kind: "payment",
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
        {
          id: "3",
          title: "Welcome to NEPA Unite",
          body: "Your account is active. Explore the marketplace to get started.",
          kind: "account",
          read: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Bell className="size-4" /> Notifications
              </SheetTitle>
              <SheetDescription>
                {unread > 0 ? `${unread} unread` : "You're all caught up"}
              </SheetDescription>
            </div>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <CheckCheck className="size-4" /> Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin p-4">
          {items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="Order, payment and account alerts will appear here."
            />
          ) : (
            items.map((n) => <NotificationRow key={n.id} n={n} />)
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
