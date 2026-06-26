"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package } from "lucide-react";
import { useProductSearch } from "@/features/products/use-products";
import { mediaUrl, formatCurrency } from "@/lib/utils";

/** Standard split promo banner — brand text panel + product image + pricing. */
export function HomeDeal() {
  const { data } = useProductSearch({
    sort: "discount_desc",
    in_stock: true,
    page: 1,
    page_size: 2,
  });
  const product = data?.results?.[1] ?? data?.results?.[0];
  if (!product) return null;

  const img = mediaUrl(product.primary_image_url);
  const price = parseFloat(product.price);
  const mrp = product.mrp ? parseFloat(product.mrp) : null;
  const discount =
    mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border bg-card sm:grid-cols-2">
        {/* Copy */}
        <div className="order-2 bg-gradient-to-br from-brand to-[hsl(288_30%_34%)] p-7 text-white sm:order-1 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(24_72%_74%)]">
            Limited-time offer
          </p>
          <h2 className="mt-2 text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
            {discount > 0 ? `Save ${discount}% today` : "Today's standout deal"}
          </h2>
          <p className="mt-2 line-clamp-2 max-w-sm text-sm text-white/85">
            {product.name}
          </p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold">{formatCurrency(price)}</span>
            {mrp && mrp > price && (
              <span className="text-base text-white/70 line-through">
                {formatCurrency(mrp)}
              </span>
            )}
          </div>
          <Link
            href={`/products/${product.id}`}
            className="group mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand transition-transform hover:-translate-y-0.5"
          >
            Buy now
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Image */}
        <div className="relative order-1 min-h-[220px] bg-muted sm:order-2">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width:640px) 100vw, 50vw"
              className="object-contain p-8"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Package className="size-16" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
