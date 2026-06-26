"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductSearch } from "@/features/products/use-products";
import { cn, mediaUrl } from "@/lib/utils";

const SLIDES = [
  {
    eyebrow: "Deals of the Day",
    title: "Up to 60% off business supplies",
    sub: "Bulk pricing across thousands of verified SKUs.",
    cta: "Shop deals",
    href: "/products?sort=discount_desc",
    grad: "from-blue-600 via-indigo-600 to-violet-600",
  },
  {
    eyebrow: "Verified Suppliers",
    title: "Source with total confidence",
    sub: "Every seller is vetted before they can trade.",
    cta: "Explore sellers",
    href: "/products",
    grad: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    eyebrow: "Fresh Arrivals",
    title: "New inventory, every week",
    sub: "Discover what just landed across every vertical.",
    cta: "Shop new",
    href: "/products?sort=newest",
    grad: "from-emerald-500 via-teal-500 to-cyan-600",
  },
];

/** Rotating promotional hero banner with a featured product image. */
export function HeroBanner() {
  const { data } = useProductSearch({
    sort: "discount_desc",
    in_stock: true,
    page: 1,
    page_size: 3,
  });
  const products = data?.results ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((p) => (p + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];
  const product = products.length ? products[index % products.length] : null;
  const img = product ? mediaUrl(product.primary_image_url) : null;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-r text-white shadow-card transition-colors duration-700",
        slide.grad,
      )}
    >
      <div className="absolute inset-0 bg-grid-slate [background-size:32px_32px] opacity-[0.12]" />
      <div className="relative grid items-center gap-4 p-6 sm:p-8 md:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-white/25">
            {slide.eyebrow}
          </span>
          <h2 className="mt-3 text-fluid-2xl font-extrabold leading-[1.1] tracking-tight text-balance">
            {slide.title}
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/85">{slide.sub}</p>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="mt-5 rounded-full"
          >
            <Link href={slide.href}>
              {slide.cta} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {/* Featured product image */}
        <div className="hidden justify-end md:flex">
          <div className="relative size-44 rounded-2xl bg-white/95 p-3 shadow-elevated">
            {img ? (
              <Image
                src={img}
                alt={product?.name ?? "Featured product"}
                fill
                sizes="176px"
                className="object-contain p-2"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Package className="size-12" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-6 flex gap-1.5 sm:left-8">
        {SLIDES.map((s, i) => (
          <button
            key={s.eyebrow}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80",
            )}
          />
        ))}
      </div>
    </section>
  );
}
