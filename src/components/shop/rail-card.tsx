"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, Star } from "lucide-react";
import { Price } from "./price";
import { mediaUrl } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Landing-page rail card — image-forward and editorial, deliberately distinct
 * from the square catalog ProductCard: a tall portrait image with overlaid
 * discount / rating badges and a minimal caption (no add-to-cart button).
 */
export function RailCard({ product }: { product: Product }) {
  const img = mediaUrl(product.primary_image_url);
  const rating = product.rating_avg ?? 0;
  const price = parseFloat(product.price);
  const mrp = product.mrp ? parseFloat(product.mrp) : null;
  const discount =
    mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl border bg-white">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width:640px) 50vw, 200px"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="size-12" />
          </div>
        )}

        {discount > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-success px-2 py-0.5 text-[11px] font-bold text-success-foreground shadow-sm">
            {discount}% OFF
          </span>
        )}
        {rating > 0 && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            {rating.toFixed(1)}
            <Star className="size-3 fill-current" />
          </span>
        )}
      </div>

      <div className="mt-2.5 space-y-1">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-brand">
          {product.name}
        </h3>
        <Price value={product.price} compareAt={product.mrp} size="md" />
      </div>
    </Link>
  );
}
