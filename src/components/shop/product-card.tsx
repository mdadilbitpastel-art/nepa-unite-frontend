"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Package, ShoppingCart, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Price } from "./price";
import { useShopAddToCart } from "@/features/cart/use-shop-cart";
import { useCart, useRemoveCartItem } from "@/features/cart/use-cart";
import { useGuestCart } from "@/stores/guest-cart-store";
import { useAuth } from "@/hooks/use-auth";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
} from "@/features/wishlist/use-wishlist";
import { cn, mediaUrl, titleCase } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductCard({
  product,
  wishlistItemId,
  className,
}: {
  product: Product;
  /** Passed when the parent already knows this product is wishlisted. */
  wishlistItemId?: string;
  className?: string;
}) {
  const { isAuthenticated } = useAuth();
  const { add, isPending } = useShopAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  // Whether this product is already in the cart (server cart when signed in,
  // otherwise the local guest cart) — hooks run unconditionally.
  const { data: cart } = useCart();
  const removeCartItem = useRemoveCartItem();
  const guestItems = useGuestCart((s) => s.items);
  const guestRemove = useGuestCart((s) => s.remove);
  const cartItemId = (cart?.items ?? []).find(
    (i) => i.product === product.id,
  )?.id;
  const inCart = isAuthenticated ? !!cartItemId : guestItems.some((i) => i.productId === product.id);

  const removeFromCart = () => {
    if (isAuthenticated) {
      if (cartItemId) removeCartItem.mutate(cartItemId);
    } else {
      guestRemove(product.id);
    }
  };

  const outOfStock = product.inventory_count <= 0;
  const lowStock = !outOfStock && product.inventory_count <= 10;
  const wishlisted = !!wishlistItemId;
  const rating = product.rating_avg ?? 0;
  const reviewCount = product.review_count ?? 0;
  const img = mediaUrl(product.primary_image_url);
  const category =
    typeof product.attributes?.category === "string"
      ? product.attributes.category
      : undefined;

  const toggleWishlist = () => {
    if (wishlistItemId) removeFromWishlist.mutate(wishlistItemId);
    else addToWishlist.mutate(product.id);
  };

  return (
    <div
      className={cn(
        "group relative flex h-full transform-gpu flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-200 [backface-visibility:hidden] hover:-translate-y-1 hover:border-brand/30 hover:shadow-elevated",
        className,
      )}
    >
      {/* Image */}
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden rounded-t-2xl bg-muted"
      >
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="size-10" />
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-background">
              Out of stock
            </span>
          </div>
        )}
        {lowStock && (
          <span className="absolute left-2 top-2 rounded-full bg-warning px-2 py-0.5 text-[11px] font-semibold text-warning-foreground shadow-sm">
            Only {product.inventory_count} left
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {category && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-brand">
            {titleCase(category)}
          </span>
        )}
        <Link href={`/products/${product.id}`} className="flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-brand">
            {product.name}
          </h3>
        </Link>

        {/* Flipkart-style green rating pill */}
        {rating > 0 && (
          <span className="inline-flex w-fit items-center gap-1 text-xs">
            <span className="inline-flex items-center gap-0.5 rounded-sm bg-success px-1.5 py-0.5 font-semibold text-success-foreground">
              {rating.toFixed(1)}
              <Star className="size-3 fill-current" />
            </span>
            {reviewCount > 0 && (
              <span className="text-muted-foreground tabular-nums">
                ({reviewCount.toLocaleString()})
              </span>
            )}
          </span>
        )}

        {/* Price on the left, wishlist heart on the opposite side */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <Price value={product.price} compareAt={product.mrp} size="lg" />
          {isAuthenticated && (
            <button
              type="button"
              onClick={toggleWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
            >
              <Heart
                className={cn(
                  "size-4 transition-colors",
                  wishlisted
                    ? "fill-rose-500 text-rose-500"
                    : "text-muted-foreground",
                )}
              />
            </button>
          )}
        </div>

        <Button
          variant="brand"
          size="sm"
          // When already in the cart the button stays clickable and, on hover,
          // switches to "Remove from cart" (click removes it).
          className="group/cart mt-1 w-full"
          disabled={outOfStock}
          loading={isPending || removeCartItem.isPending}
          onClick={() =>
            inCart ? removeFromCart() : add(product, product.min_order_qty || 1)
          }
        >
          {inCart ? (
            <>
              <ShoppingCart className="size-4 fill-current group-hover/cart:hidden" />
              <Trash2 className="hidden size-4 group-hover/cart:block" />
              <span className="group-hover/cart:hidden">Added</span>
              <span className="hidden group-hover/cart:inline">
                Remove from cart
              </span>
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" />
              Add to cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
