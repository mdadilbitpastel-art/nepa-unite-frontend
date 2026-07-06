"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";

export function usePaymentConfig() {
  return useQuery({
    queryKey: qk.paymentConfig,
    queryFn: paymentService.config,
    staleTime: 5 * 60_000,
  });
}

export function useOrderPayments(orderId: string, enabled = true) {
  return useQuery({
    queryKey: qk.payments(orderId),
    queryFn: () => paymentService.forOrder(orderId),
    enabled: enabled && !!orderId,
  });
}

/** Create (or reuse) the PaymentIntent for an order — returns the client_secret. */
export function useCreateIntent() {
  return useMutation({
    mutationFn: (orderId: string) => paymentService.createIntent(orderId),
    onError: (e: ApiError) => toast.error(e.message),
  });
}

/** Reconcile the order with Stripe after payment; refreshes order + payment caches. */
export function useSyncPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => paymentService.sync(orderId),
    onSuccess: (_data, orderId) => {
      qc.invalidateQueries({ queryKey: qk.payments(orderId) });
      qc.invalidateQueries({ queryKey: qk.order(orderId) });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useOnboardSeller() {
  return useMutation({
    mutationFn: () => paymentService.onboardSeller(),
    onError: (e: ApiError) => toast.error(e.message),
  });
}

/** Admin: disburse an order item's share to its seller. */
export function useDisburse(orderId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderItemId: string) => paymentService.disburse(orderItemId),
    onSuccess: () => {
      if (orderId) qc.invalidateQueries({ queryKey: qk.payments(orderId) });
      toast.success("Payout initiated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
