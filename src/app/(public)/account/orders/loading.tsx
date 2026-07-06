import { TableSkeleton } from "@/components/shared/states";

/** Instant skeleton shown while the orders route loads. */
export default function OrdersLoading() {
  return <TableSkeleton rows={8} />;
}
