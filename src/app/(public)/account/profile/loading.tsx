import { FormSkeleton } from "@/components/shared/states";

/** Instant skeleton shown while the profile route loads. */
export default function ProfileLoading() {
  return <FormSkeleton fields={6} />;
}
