import { Badge } from "@/components/ui/badge";
import {
  ORDER_STATUS_VARIANT,
  PAYMENT_STATUS_VARIANT,
  COMMISSION_STATUS_VARIANT,
} from "@/lib/constants";
import { titleCase } from "@/lib/utils";
import type {
  OrderStatus,
  PaymentStatus,
  CommissionStatus,
  AccountStatus,
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
