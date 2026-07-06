import { FormSkeleton } from "@/components/shared/states";

/** Instant skeleton shown while the checkout route loads. */
export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <FormSkeleton fields={6} />
    </div>
  );
}
