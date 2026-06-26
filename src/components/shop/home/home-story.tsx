import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STATS = [
  { value: "85k+", label: "Products listed" },
  { value: "1,200+", label: "Verified sellers" },
  { value: "30+", label: "Industry verticals" },
];

/** Clean 2-column brand section with a stats panel. */
export function HomeStory() {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-3xl border bg-card p-7 sm:p-10 lg:grid-cols-2">
        <div className="max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
            Our story
          </p>
          <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl">
            Built for the way the region actually trades.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            NEPA Unite connects Northeastern Pennsylvania&apos;s buyers and
            suppliers on one transparent marketplace — fair pricing, vetted
            partners, and tooling that respects how businesses really buy.
          </p>
          <Link
            href="/products"
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-transform hover:-translate-y-0.5"
          >
            Start exploring
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-3xl bg-gradient-to-br from-brand to-[hsl(288_30%_34%)] p-7 text-white sm:p-9">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-serif text-3xl font-medium text-[hsl(24_72%_74%)] sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs leading-tight text-white/80">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
