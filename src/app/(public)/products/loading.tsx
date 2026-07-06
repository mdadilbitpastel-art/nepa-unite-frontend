import { CardGridSkeleton } from "@/components/shared/states";

/** Instant skeleton shown while the products route chunk + data load. */
export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <CardGridSkeleton count={12} />
    </div>
  );
}
