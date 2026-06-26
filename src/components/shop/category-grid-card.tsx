"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductSearch } from "@/features/products/use-products";
import { mediaUrl, titleCase, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

function Tile({ product }: { product: Product }) {
  const img = mediaUrl(product.primary_image_url);
  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="160px"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="size-7" />
          </div>
        )}
      </div>
      <p className="mt-1.5 line-clamp-1 text-xs text-foreground">
        {product.name}
      </p>
      <p className="text-xs font-semibold text-success">
        {formatCurrency(parseFloat(product.price))}
      </p>
    </Link>
  );
}

/**
 * Flipkart/Amazon-style merchandising card: a heading, a 2×2 grid of product
 * thumbnails for one category, and a "See all" link.
 */
export function CategoryGridCard({ category }: { category: string }) {
  const { data, isLoading } = useProductSearch({
    category,
    in_stock: true,
    page: 1,
    page_size: 4,
  });
  const products = data?.results ?? [];
  if (!isLoading && products.length === 0) return null;

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-4 shadow-xs">
      <h3 className="mb-3 line-clamp-1 text-base font-bold tracking-tight">
        {titleCase(category)}
      </h3>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="mt-1.5 h-3 w-3/4" />
              </div>
            ))
          : products.slice(0, 4).map((p) => <Tile key={p.id} product={p} />)}
      </div>
      <Link
        href={`/products?category=${encodeURIComponent(category)}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
      >
        See all <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
