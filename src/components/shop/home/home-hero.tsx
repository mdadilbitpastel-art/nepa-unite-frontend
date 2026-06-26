"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, ShieldCheck } from "lucide-react";
import { useProductSearch } from "@/features/products/use-products";
import { mediaUrl, formatCurrency } from "@/lib/utils";

/**
 * Editorial hero banner — deep-plum gradient panel with a serif headline and
 * CTAs on the left and a floating product preview on the right.
 */
export function HomeHero() {
  const { data } = useProductSearch({
    sort: "discount_desc",
    in_stock: true,
    page: 1,
    page_size: 1,
  });
  const product = data?.results?.[0];
  const img = product ? mediaUrl(product.primary_image_url) : null;

  return (
    <section className="px-4 pt-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-[hsl(288_30%_34%)] text-white shadow-card">
        <div className="absolute inset-0 bg-grid-slate [background-size:32px_32px] opacity-[0.10]" />
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full opacity-50 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, hsl(22 60% 54% / 0.6), transparent 70%)",
          }}
        />
        <div className="relative grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:p-14">
          {/* Copy */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ring-1 ring-white/20">
              <ShieldCheck className="size-3.5" /> 85,000+ products · 1,200+ verified sellers
            </span>
            <h1 className="mt-5 text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Source smarter.
              <br />
              <span className="italic text-[hsl(24_72%_74%)]">Buy better.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/85">
              The B2B marketplace for Northeastern Pennsylvania — browse freely,
              compare openly, and order with confidence.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand transition-transform hover:-translate-y-0.5"
              >
                Shop all products
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/products?sort=discount_desc"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Today&apos;s deals
              </Link>
            </div>
          </div>

          {/* Floating product preview */}
          <div className="hidden justify-center lg:flex">
            <div className="relative w-[260px]">
              <div className="aspect-square overflow-hidden rounded-2xl border bg-white shadow-elevated">
                {img ? (
                  <div className="relative size-full">
                    <Image
                      src={img}
                      alt={product?.name ?? "Featured product"}
                      fill
                      sizes="260px"
                      className="object-contain p-6"
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Package className="size-16" />
                  </div>
                )}
              </div>
              {product && (
                <span className="absolute -bottom-3 left-5 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background shadow-lg">
                  {formatCurrency(parseFloat(product.price))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
