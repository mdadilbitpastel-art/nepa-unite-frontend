"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { cartService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import { useCartUiStore } from "@/stores/cart-store";
import { useAuth } from "@/hooks/use-auth";

export function useCart() {
  const setCount = useCartUiStore((s) => s.setCount);
  // The server cart is auth-only; skip the request for anonymous shoppers
  // (the storefront uses a localStorage guest cart until checkout).
  const { isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: qk.cart,
    queryFn: cartService.get,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) setCount(query.data.item_count);
  }, [query.data, setCount]);

  return query;
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartService.addItem(productId, quantity),
    onSuccess: (cart) => {
      qc.setQueryData(qk.cart, cart);
      toast.success("Added to cart");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: (cart) => qc.setQueryData(qk.cart, cart),
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: (cart) => {
      qc.setQueryData(qk.cart, cart);
      toast.success("Item removed");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: (cart) => qc.setQueryData(qk.cart, cart),
    onError: (e: ApiError) => toast.error(e.message),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cartService.checkout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cart });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
