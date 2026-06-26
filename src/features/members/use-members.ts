"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { memberService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import type { Member } from "@/types";

/** A single member's profile (self or any, scoped by backend). */
export function useMember(id: string) {
  return useQuery({
    queryKey: qk.member(id),
    queryFn: () => memberService.get(id),
    enabled: !!id,
  });
}

/** Update own member profile (e.g. email). */
export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Member> }) =>
      memberService.update(id, body),
    onSuccess: (member) => {
      qc.setQueryData(qk.member(member.id), member);
      qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Profile updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

/** All members (admin scope). Backend returns a plain array. */
export function useAdminMembers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: qk.adminMembers(params),
    queryFn: () => memberService.adminList(params),
  });
}

export function useAdminMember(id: string) {
  return useQuery({
    queryKey: qk.member(id),
    queryFn: () => memberService.adminGet(id),
    enabled: !!id,
  });
}

export function useApproveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => memberService.approve(id),
    onSuccess: (member) => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success(`Approved ${member.email}`);
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useSuspendMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => memberService.suspend(id),
    onSuccess: (member) => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success(`Suspended ${member.email}`);
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
