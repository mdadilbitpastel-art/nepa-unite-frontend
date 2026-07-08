import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_VARIANT,
  PAYMENT_STATUS_VARIANT,
  COMMISSION_STATUS_VARIANT,
  RETURN_STATUS_VARIANT,
} from "@/lib/constants";
import { titleCase } from "@/lib/utils";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
  CommissionStatus,
  AccountStatus,
  ReturnStatus,
} from "@/types";

const ACCOUNT_VARIANT: Record<
  AccountStatus,
  "success" | "warning" | "danger"
> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_STATUS_VARIANT[status]} dot>
      {titleCase(status)}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={PAYMENT_STATUS_VARIANT[status]} dot>
      {titleCase(status)}
    </Badge>
  );
}

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  return (
    <Badge variant={COMMISSION_STATUS_VARIANT[status]} dot>
      {titleCase(status)}
    </Badge>
  );
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge variant={ACCOUNT_VARIANT[status]} dot>
      {titleCase(status)}
    </Badge>
  );
}

export function ReturnStatusBadge({
  status,
  label,
}: {
  status: ReturnStatus;
  label?: string;
}) {
  return (
    <Badge variant={RETURN_STATUS_VARIANT[status]} dot>
      {label ?? titleCase(status.replace(/_/g, " "))}
    </Badge>
  );
}

/**
 * The single status badge for an order-list row. Shows one status at a time:
 * an in-flight return/exchange (e.g. "Exchange requested", "Return rejected")
 * once the order is delivered, otherwise the order's own status. Pass a
 * `fallback` to control how the plain order status renders (e.g. a page's own
 * pill); defaults to the shared OrderStatusBadge.
 */
export function OrderEffectiveBadge({
  order,
  fallback,
}: {
  order: Order;
  fallback?: ReactNode;
}) {
  const ds = order.display_status;
  if (ds && ds.kind !== "order") {
    return (
      <ReturnStatusBadge status={ds.code as ReturnStatus} label={ds.full_label} />
    );
  }
  return <>{fallback ?? <OrderStatusBadge status={order.status} />}</>;
}
