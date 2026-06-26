import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Guest (pre-login) cart.
 *
 * The backend cart requires authentication, but our storefront defers login
 * until the buyer is ready to check out. So anonymous "add to cart" actions
 * are held here — in localStorage — with a small product snapshot for display.
 * On sign-in, <CartSync/> flushes these into the real server cart and clears
 * this store. The source of truth for an authenticated buyer is always the
 * server cart (TanStack Query); this only powers the guest experience.
 */
export interface GuestCartItem {
  productId: string;
  quantity: number;
  // Snapshot so the cart can render without re-fetching each product.
  name: string;
  price: string;
  sku: string;
  imageUrl?: string | null;
  minOrderQty: number;
}

interface GuestCartState {
  items: GuestCartItem[];
  add: (item: GuestCartItem) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...s.items, item] };
        }),
      setQty: (productId, quantity) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(i.minOrderQty || 1, quantity) }
              : i,
          ),
        })),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "nepa-guest-cart" },
  ),
);

/** Total units across the guest cart (for the header badge). */
export function guestCartCount(items: GuestCartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

/** Subtotal across the guest cart, as a number. */
export function guestCartSubtotal(items: GuestCartItem[]): number {
  return items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
}
