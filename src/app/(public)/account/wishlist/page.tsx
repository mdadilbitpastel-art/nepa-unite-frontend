"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shop/product-card";
import { useWishlist } from "@/features/wishlist/use-wishlist";
import { useProduct } from "@/features/products/use-products";
import type { WishlistItem } from "@/types";

/** Wishlist rows serialize `product` as a UUID string, but tolerate nested. */
function productId(item: WishlistItem): string {
  return typeof item.product === "string" ? item.product : item.product.id;
}

/**
 * Saved items only carry the product id, so resolve the full product and render
 * the exact same card used on the products listing (heart wired to remove it).
 */
function FavouriteCard({ item }: { item: WishlistItem }) {
  const { data, isLoading } = useProduct(productId(item));
  if (isLoading) return <Skeleton className="h-80 rounded-2xl" />;
  if (!data) return null;
  return <ProductCard product={data} wishlistItemId={item.id} />;
}

export default function WishlistPage() {
  const { data, isLoading, isError, refetch } = useWishlist();
  const items = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favourites"
        description="Products you've saved for later — add them to your cart when you're ready."
        actions={
          <Button asChild variant="outline">
            <Link href="/products">
              <ShoppingBag className="size-4" /> Browse products
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Couldn't load favourites" onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favourites yet"
          description="Tap the heart on any product to save it here for later."
          action={
            <Button asChild variant="brand">
              <Link href="/products">Start browsing</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <FavouriteCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
