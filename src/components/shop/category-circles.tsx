"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ArrowRight,
  Stethoscope,
  Ruler,
  HardHat,
  Store,
  HeartPulse,
  Cpu,
  Factory,
  Warehouse,
  Car,
  GraduationCap,
  Scale,
  Truck,
  UtensilsCrossed,
  Building2,
  Shirt,
  Lightbulb,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import { cn, titleCase } from "@/lib/utils";
import type { Category } from "@/types";

// Keyword → icon. Matched loosely against the category name.
const ICON_RULES: { match: RegExp; icon: LucideIcon }[] = [
  { match: /dental|implant|teeth/i, icon: Stethoscope },
  { match: /health|medical|med|pharma/i, icon: HeartPulse },
  { match: /architect|design|drafting|ruler/i, icon: Ruler },
  { match: /construct|build|hardhat|cement|tool/i, icon: HardHat },
  { match: /retail|store|shop/i, icon: Store },
  { match: /tech|electronic|computer|hardware|cpu/i, icon: Cpu },
  { match: /manufactur|industrial|machine/i, icon: Factory },
  { match: /wholesale|warehouse|bulk/i, icon: Warehouse },
  { match: /auto|vehicle|car/i, icon: Car },
  { match: /education|school|learn/i, icon: GraduationCap },
  { match: /law|legal|office/i, icon: Scale },
  { match: /logistic|ship|transport|freight/i, icon: Truck },
  { match: /food|beverage|restaurant|catering/i, icon: UtensilsCrossed },
  { match: /real.?estate|property|hospitality|hotel/i, icon: Building2 },
  { match: /textile|cloth|apparel|fashion|dry.?clean/i, icon: Shirt },
  { match: /light|lamp|electric/i, icon: Lightbulb },
];

function iconFor(name: string): LucideIcon {
  return ICON_RULES.find((r) => r.match.test(name))?.icon ?? Boxes;
}

// Rotating gradient tints so the row reads as a colorful, lively strip.
const TINTS = [
  "from-blue-500/15 to-sky-500/15 text-blue-600",
  "from-amber-500/15 to-orange-500/15 text-amber-600",
  "from-emerald-500/15 to-green-500/15 text-emerald-600",
  "from-sky-500/15 to-blue-500/15 text-sky-600",
  "from-rose-500/15 to-pink-500/15 text-rose-600",
  "from-violet-500/15 to-purple-500/15 text-violet-600",
];

export function CategoryCircles({
  categories,
  limit = 14,
  browseAllHref,
}: {
  categories: Category[];
  limit?: number;
  /** When set, a "Browse all" pill is appended at the end of the row. */
  browseAllHref?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = categories.slice(0, limit);
  if (items.length === 0) return null;

  // Distinctive horizontal "pill" strip — icon chip + label side by side,
  // deliberately unlike the round category icons of other marketplaces.
  // Collapsed to a single row; the toggle smoothly animates the rest open.
  return (
    <div className="flex items-start gap-2.5">
      <div
        className={cn(
          "flex flex-1 flex-wrap gap-2.5 overflow-hidden transition-[max-height] duration-300 ease-in-out",
          expanded ? "max-h-[40rem]" : "max-h-9",
        )}
      >
        {items.map((c, i) => {
          const Icon = iconFor(c.category);
          const tint = TINTS[i % TINTS.length];
          return (
            <Link
              key={c.category}
              href={`/products?category=${encodeURIComponent(c.category)}`}
              className="group inline-flex h-9 shrink-0 items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3.5 text-sm font-medium shadow-xs transition-all hover:border-brand/40 hover:shadow-card"
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full bg-gradient-to-br ${tint} transition-transform group-hover:scale-110`}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="whitespace-nowrap text-foreground transition-colors group-hover:text-brand">
                {titleCase(c.category)}
              </span>
            </Link>
          );
        })}

        {browseAllHref && (
          <Link
            href={browseAllHref}
            className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
          >
            Browse all
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={expanded ? "Show fewer categories" : "Show all categories"}
        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border bg-card px-3.5 text-sm font-medium text-muted-foreground shadow-xs transition-colors hover:border-brand/40 hover:text-brand"
      >
        {expanded ? "Less" : "More"}
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-300",
            expanded && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
