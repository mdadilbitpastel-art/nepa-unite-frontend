"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { wishlistService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import type { WishlistItem } from "@/types";

/** Wishlist rows serialize `product` as a UUID string, but tolerate nested. */
function itemProductId(item: WishlistItem): string {
  return typeof item.product === "string" ? item.product : item.product.id;
}

export function useWishlist() {
  // Wishlist is auth-only; anonymous shoppers never hit the endpoint.
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: qk.wishlist,
    queryFn: wishlistService.list,
    enabled: isAuthenticated,
  });
}

export function useAddToWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (product: string) => wishlistService.add(product),
    // Optimistically insert a placeholder so the heart fills instantly.
    onMutate: async (product) => {
      await qc.cancelQueries({ queryKey: qk.wishlist });
      const previous = qc.getQueryData<WishlistItem[]>(qk.wishlist);
      qc.setQueryData<WishlistItem[]>(qk.wishlist, (old = []) =>
        old.some((w) => itemProductId(w) === product)
          ? old
          : [...old, { id: `optimistic-${product}`, product }],
      );
      return { previous };
    },
    onError: (e: ApiError, _product, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.wishlist, ctx.previous);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Saved to wishlist"),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.wishlist }),
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wishlistService.remove(id),
    // Optimistically drop the item so the heart empties instantly.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.wishlist });
      const previous = qc.getQueryData<WishlistItem[]>(qk.wishlist);
      qc.setQueryData<WishlistItem[]>(qk.wishlist, (old = []) =>
        old.filter((w) => w.id !== id),
      );
      return { previous };
    },
    onError: (e: ApiError, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.wishlist, ctx.previous);
      toast.error(e.message);
    },
    onSuccess: () => toast.success("Removed from wishlist"),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.wishlist }),
  });
}
