"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { commissionService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import type { CommissionRate } from "@/types";

export function useCommissions(params?: { status?: string; seller?: string }) {
  return useQuery({
    queryKey: qk.commissions(params),
    queryFn: () => commissionService.list(params),
  });
}

export function useCommissionSummary() {
  return useQuery({
    queryKey: qk.commissionSummary,
    queryFn: () => commissionService.summary(),
  });
}

export function useCommissionRates() {
  return useQuery({
    queryKey: qk.commissionRates,
    queryFn: () => commissionService.rates(),
  });
}

export function useCreateCommissionRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { category: string; percent: string; min_fee?: string }) =>
      commissionService.createRate(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.commissionRates });
      toast.success("Rate created");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateCommissionRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CommissionRate> }) =>
      commissionService.updateRate(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.commissionRates });
      toast.success("Rate updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useDeleteCommissionRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commissionService.deleteRate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.commissionRates });
      toast.success("Rate deleted");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
