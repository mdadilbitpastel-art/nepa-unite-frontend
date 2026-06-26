import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/**
 * Styled brand wordmark — first word in ink, second in a blue→amber gradient
 * (matching the ring colors). Tight tracking + extrabold for a designed feel,
 * deliberately not a plain system label.
 */
export function BrandWordmark({ className }: { className?: string }) {
  const [first, ...rest] = APP_NAME.split(" ");
  const second = rest.join(" ");
  return (
    <span
      className={cn(
        "select-none text-lg font-extrabold tracking-tight",
        className,
      )}
    >
      <span className="text-foreground">{first}</span>
      {second && (
        <>
          {" "}
          <span className="bg-gradient-to-r from-brand to-[hsl(var(--teal))] bg-clip-text italic text-transparent">
            {second}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * NEPA Unite brand mark — two overlapping rings ("unite").
 *
 * By default the rings inherit `currentColor` so the mark adapts to dark
 * surfaces (white on the navy sidebar / auth panel). Pass `colored` for the
 * storefront header: a transparent background with the two rings tinted in the
 * brand palette — blue + amber — so the logo reads on a plain white bar.
 */
export function BrandLogo({
  className,
  colored = false,
}: {
  className?: string;
  colored?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      <circle
        cx="11.5"
        cy="16"
        r="7.2"
        stroke={colored ? "hsl(var(--brand))" : "currentColor"}
        strokeWidth="2.4"
      />
      <circle
        cx="20.5"
        cy="16"
        r="7.2"
        stroke={colored ? "hsl(var(--teal))" : "currentColor"}
        strokeWidth="2.4"
        opacity={colored ? 1 : 0.55}
      />
    </svg>
  );
}
