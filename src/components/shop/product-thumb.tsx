"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { useProduct } from "@/features/products/use-products";
import { cn, mediaUrl } from "@/lib/utils";

/**
 * Product thumbnail resolved by id — order rows/items only carry the product
 * UUID, so this fetches the product (cached/deduped by React Query) to show its
 * image, falling back to a package glyph while loading or when there's none.
 */
export function ProductThumb({
  productId,
  alt,
  className,
  iconClassName,
}: {
  productId?: string;
  alt?: string;
  className?: string;
  /** Applied to the fallback glyph wrapper (e.g. a status tint). */
  iconClassName?: string;
}) {
  const { data } = useProduct(productId ?? "");
  const img = mediaUrl(data?.primary_image_url);

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden bg-muted",
        className,
      )}
    >
      {img ? (
        <Image
          src={img}
          alt={alt ?? data?.name ?? "Product"}
          fill
          sizes="56px"
          className="object-cover"
        />
      ) : (
        <span
          className={cn(
            "grid h-full w-full place-items-center text-muted-foreground",
            iconClassName,
          )}
        >
          <Package className="size-5" />
        </span>
      )}
    </span>
  );
}
