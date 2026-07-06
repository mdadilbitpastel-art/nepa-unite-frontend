"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { orderService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import type { OrderStatus } from "@/types";

export function useOrders(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.orders(params),
    queryFn: () => orderService.list(params),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: qk.order(id),
    queryFn: () => orderService.get(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateStatus(id, status),
    onSuccess: (order) => {
      qc.setQueryData(qk.order(order.id), order);
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Order moved to "${order.status}"`);
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useInvoice(orderId: string, enabled = false) {
  return useQuery({
    queryKey: qk.invoice(orderId),
    queryFn: () => orderService.invoice(orderId),
    enabled: enabled && !!orderId,
    // Fail fast so the caller can fall back to a client-side invoice without
    // waiting through retry backoff (e.g. when object storage is unconfigured).
    retry: false,
  });
}
