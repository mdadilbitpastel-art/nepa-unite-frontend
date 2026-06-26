"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cartService } from "@/services";
import { qk } from "@/lib/query-keys";
import { useGuestCart } from "@/stores/guest-cart-store";

/**
 * On sign-in, flush the anonymous guest cart into the authenticated server
 * cart, then clear it. Gated on the access token actually being present (not
 * just session status) to avoid racing <TokenSync/> and firing an unauthorized
 * request. Only buyers own a server cart; for other roles the flush no-ops and
 * the guest items are simply left in place.
 */
export function CartSync() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const role = session?.user?.role;
  const items = useGuestCart((s) => s.items);
  const clear = useGuestCart((s) => s.clear);
  const qc = useQueryClient();
  const flushing = useRef(false);

  useEffect(() => {
    if (!token || role !== "buyer" || items.length === 0 || flushing.current) {
      return;
    }
    flushing.current = true;
    void (async () => {
      try {
        for (const it of items) {
          await cartService.addItem(it.productId, it.quantity);
        }
        clear();
        qc.invalidateQueries({ queryKey: qk.cart });
        toast.success("Your cart is ready");
      } catch {
        // Leave the guest cart intact so the buyer can retry from /cart.
      } finally {
        flushing.current = false;
      }
    })();
  }, [token, role, items, clear, qc]);

  return null;
}
