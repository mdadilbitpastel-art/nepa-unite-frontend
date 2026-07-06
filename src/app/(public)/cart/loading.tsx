import { CartSkeleton } from "@/components/shared/states";

/** Instant skeleton shown while the cart route loads. */
export default function CartLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <CartSkeleton />
    </div>
  );
}
