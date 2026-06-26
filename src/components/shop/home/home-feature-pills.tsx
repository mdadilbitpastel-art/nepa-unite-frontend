import {
  BadgeCheck,
  PackageCheck,
  Truck,
  Lock,
  type LucideIcon,
} from "lucide-react";

const FEATURES: { icon: LucideIcon; label: string; sub: string }[] = [
  { icon: BadgeCheck, label: "Vetted suppliers", sub: "Every seller verified" },
  { icon: PackageCheck, label: "Bulk pricing", sub: "Volume rates built in" },
  { icon: Truck, label: "Regional dispatch", sub: "Faster local fulfilment" },
  { icon: Lock, label: "Secure checkout", sub: "Protected payments" },
];

/** Reassurance strip — clean icon cards. */
export function HomeFeaturePills() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-xs"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <f.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{f.label}</p>
              <p className="truncate text-xs text-muted-foreground">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
