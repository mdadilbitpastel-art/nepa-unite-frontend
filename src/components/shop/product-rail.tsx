"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { ProductCard } from "./product-card";
import { RailCard } from "./rail-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types";

/** Horizontally-scrolling rail of product cards with a heading + arrows. */
export function ProductRail({
  title,
  subtitle,
  icon: Icon,
  products,
  viewAllHref,
  loading,
  variant = "default",
}: {
  title: string;
  subtitle?: string;
  /** Optional icon shown before the heading. */
  icon?: LucideIcon;
  products: Product[];
  viewAllHref?: string;
  loading?: boolean;
  /** "feature" uses the image-forward RailCard with larger tiles (landing). */
  variant?: "default" | "feature";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const feature = variant === "feature";
  // Feature tiles are sized so ~5 fit across the container without clipping.
  const tileWidth = feature
    ? "w-[150px] shrink-0 sm:w-[200px]"
    : "w-[200px] shrink-0 sm:w-[230px]";

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl">
            {Icon && (
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Icon className="size-4" />
              </span>
            )}
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden items-center gap-1 text-sm font-semibold text-brand hover:underline sm:inline-flex"
            >
              View all <ArrowRight className="size-4" />
            </Link>
          )}
          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="flex size-9 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="flex size-9 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-1"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={tileWidth}>
                <Skeleton
                  className={
                    feature
                      ? "aspect-[4/5] w-full rounded-2xl"
                      : "aspect-square w-full rounded-2xl"
                  }
                />
                <Skeleton className="mt-3 h-4 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </div>
            ))
          : products.map((p) => (
              <div key={p.id} className={`${tileWidth} snap-start`}>
                {feature ? (
                  <RailCard product={p} />
                ) : (
                  <ProductCard product={p} />
                )}
              </div>
            ))}
      </div>
    </section>
  );
}
