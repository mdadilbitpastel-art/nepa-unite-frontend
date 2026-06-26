"use client";

import { useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Package,
  CreditCard,
  UserCog,
  Server,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  useNotificationStore,
  type AppNotification,
} from "@/stores/notification-store";
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
      type="button"
      onClick={() => !n.read && markRead(n.id)}
      className={cn(
        "flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/40",
        !n.read && "bg-brand/[0.03]",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          KIND_ACCENT[n.kind],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {n.title}
          </p>
          {!n.read && <span className="size-2 shrink-0 rounded-full bg-brand" />}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {timeAgo(n.createdAt)}
        </p>
      </div>
      <Badge variant="muted" className="shrink-0 capitalize">
        {n.kind}
      </Badge>
    </button>
  );
}

export default function NotificationsPage() {
  const { items, unread, markAllRead, setItems } = useNotificationStore();

  // Seed demo notifications once if the store is empty.
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
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unread > 0 ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "You're all caught up."
        }
        actions={
          unread > 0 && (
            <Button variant="outline" onClick={markAllRead}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Order, payment and account alerts will appear here."
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="divide-y p-0">
            {items.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
