"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { returnService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import type { ReturnReason, ReturnStatus, ReturnType } from "@/types";

export function useReturns(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.returns(params),
    queryFn: () => returnService.list(params),
  });
}

export function useReturn(id: string) {
  return useQuery({
    queryKey: qk.return(id),
    queryFn: () => returnService.get(id),
    enabled: !!id,
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      order_item: string;
      type: ReturnType;
      reason: ReturnReason;
      reason_note?: string;
      quantity?: number;
      exchange_product?: string | null;
    }) => returnService.create(body),
    onSuccess: (rr) => {
      qc.setQueryData(qk.return(rr.id), rr);
      qc.invalidateQueries({ queryKey: ["returns"] });
      // The order's items now carry an active_return — refresh order views.
      qc.invalidateQueries({ queryKey: ["order"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(
        rr.type === "exchange"
          ? "Exchange request submitted"
          : "Return request submitted",
      );
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateReturnStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
      pickup_scheduled_at,
    }: {
      id: string;
      status: ReturnStatus;
      note?: string;
      pickup_scheduled_at?: string;
    }) =>
      returnService.updateStatus(id, { status, note, pickup_scheduled_at }),
    onSuccess: (rr) => {
      qc.setQueryData(qk.return(rr.id), rr);
      qc.invalidateQueries({ queryKey: ["returns"] });
      qc.invalidateQueries({ queryKey: ["order"] });
      toast.success(`Updated to "${rr.status_display}"`);
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
