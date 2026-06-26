"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Package, ShoppingCart, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useWishlist,
  useRemoveFromWishlist,
} from "@/features/wishlist/use-wishlist";
import { useAddToCart } from "@/features/cart/use-cart";
import { formatCurrency, mediaUrl } from "@/lib/utils";
import type { Product, WishlistItem } from "@/types";

function isProduct(p: WishlistItem["product"]): p is Product {
  return typeof p === "object" && p !== null && "name" in p;
}

function WishlistCard({ item }: { item: WishlistItem }) {
  const remove = useRemoveFromWishlist();
  const addToCart = useAddToCart();
  const product = isProduct(item.product) ? item.product : null;
  const productId = isProduct(item.product) ? item.product.id : item.product;

  // Prefer the nested product, falling back to the flat fields the API returns.
  const name = product?.name ?? item.product_name ?? "Saved product";
  const sku = product?.sku;
  const price = product?.price ?? item.product_price;
  const image = mediaUrl(product?.primary_image_url ?? item.product_image_url);
  const outOfStock = !!product && product.inventory_count <= 0;

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-elevated">
      <Link
        href={`/buyer/products/${productId}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="size-10" />
          </div>
        )}
      </Link>
      <CardContent className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex-1">
          <Link href={`/buyer/products/${productId}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors hover:text-brand">
              {name}
            </h3>
          </Link>
          {sku && (
            <p className="mt-0.5 text-xs text-muted-foreground">SKU: {sku}</p>
          )}
        </div>
        {price !== undefined && (
          <p className="text-base font-semibold tracking-tight text-foreground">
            {formatCurrency(price)}
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            className="flex-1"
            disabled={outOfStock}
            loading={addToCart.isPending}
            onClick={() =>
              addToCart.mutate({
                productId,
                quantity: product?.min_order_qty || 1,
              })
            }
          >
            <ShoppingCart className="size-4" /> Move to cart
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Remove from wishlist"
            loading={remove.isPending}
            onClick={() => remove.mutate(item.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WishlistPage() {
  const { data, isLoading, isError, refetch } = useWishlist();
  const items = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wishlist"
        description="Products you've saved for later."
        actions={
          <Button asChild variant="outline">
            <Link href="/buyer/products">Browse more</Link>
          </Button>
        }
      />

      {isLoading ? (
        <CardGridSkeleton count={8} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load wishlist"
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here."
          action={
            <Button asChild variant="brand">
              <Link href="/buyer/products">Start browsing</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
