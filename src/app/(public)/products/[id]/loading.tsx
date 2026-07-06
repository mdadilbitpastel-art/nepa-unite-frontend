import { ProductDetailSkeleton } from "@/components/shared/states";

/** Instant skeleton shown while a product detail route loads. */
export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ProductDetailSkeleton />
    </div>
  );
}
