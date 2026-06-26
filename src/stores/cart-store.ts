import { create } from "zustand";

/**
 * Lightweight client mirror of cart count for instant header badge updates.
 * The source of truth is the server cart (TanStack Query); this only smooths
 * the optimistic UX between fetches.
 */
interface CartUiState {
  count: number;
  setCount: (n: number) => void;
}

export const useCartUiStore = create<CartUiState>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
}));
