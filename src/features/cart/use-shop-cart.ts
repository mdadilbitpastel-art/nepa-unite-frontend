"use client";

import { toast } from "sonner";
import { useAddToCart } from "@/features/cart/use-cart";
import { useGuestCart } from "@/stores/guest-cart-store";
import { useAuth } from "@/hooks/use-auth";
import type { Product } from "@/types";

/**
 * Storefront add-to-cart that works for both anonymous and signed-in shoppers.
 * - Signed in  → writes straight to the server cart.
 * - Anonymous  → stashes a snapshot in the guest cart (localStorage); login is
 *   deferred until checkout, at which point <CartSync/> flushes it to the server.
 */
export function useShopAddToCart() {
  const { isAuthenticated } = useAuth();
  const serverAdd = useAddToCart();
  const guestAdd = useGuestCart((s) => s.add);

  const add = (product: Product, quantity: number) => {
    if (isAuthenticated) {
      serverAdd.mutate({ productId: product.id, quantity });
      return;
    }
    guestAdd({
      productId: product.id,
      quantity,
      name: product.name,
      price: product.price,
      sku: product.sku,
      imageUrl: product.primary_image_url,
      minOrderQty: product.min_order_qty || 1,
    });
    toast.success("Added to cart");
  };

  return { add, isPending: serverAdd.isPending };
}
