"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { addressService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import type { Address } from "@/types";

export function useAddresses() {
  return useQuery({
    queryKey: qk.addresses,
    queryFn: addressService.list,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Address, "id" | "created_at" | "updated_at">) =>
      addressService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.addresses });
      toast.success("Address added");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Address> }) =>
      addressService.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.addresses });
      toast.success("Address updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.addresses });
      toast.success("Address removed");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressService.setDefault(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.addresses });
      toast.success("Default address updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
