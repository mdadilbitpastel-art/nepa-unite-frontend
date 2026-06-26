"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package, Star } from "lucide-react";
import { Price } from "@/components/shop/price";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductSearch } from "@/features/products/use-products";
import { mediaUrl } from "@/lib/utils";
import type { Product } from "@/types";
import type { ProductSort } from "@/services";

function RailCard({ product }: { product: Product }) {
  const img = mediaUrl(product.primary_image_url);
  const price = parseFloat(product.price);
  const mrp = product.mrp ? parseFloat(product.mrp) : null;
  const discount =
    mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const rating = product.rating_avg ?? 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block w-[160px] shrink-0 overflow-hidden rounded-xl border bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card sm:w-[185px]"
    >
      <div className="relative aspect-square bg-white">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="185px"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="size-10" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-success px-2 py-0.5 text-[11px] font-bold text-success-foreground">
            -{discount}%
          </span>
        )}
      </div>
      <div className="space-y-1 border-t p-3">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-brand">
          {product.name}
        </h3>
        {rating > 0 && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-success px-1.5 py-0.5 text-[11px] font-semibold text-success-foreground">
            {rating.toFixed(1)}
            <Star className="size-2.5 fill-current" />
          </span>
        )}
        <Price value={product.price} compareAt={product.mrp} size="md" />
      </div>
    </Link>
  );
}

export function HomeFeatured({
  title,
  sort,
}: {
  title: string;
  sort: ProductSort;
}) {
  const { data, isLoading } = useProductSearch({
    sort,
    in_stock: true,
    page: 1,
    page_size: 10,
  });
  const products = data?.results ?? [];
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[160px] shrink-0 sm:w-[185px]">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="mt-2 h-4 w-3/4" />
                </div>
              ))
            : products.map((p) => <RailCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
