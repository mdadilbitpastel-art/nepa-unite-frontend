"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Package,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CartSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@/features/cart/use-cart";
import { formatCurrency, mediaUrl } from "@/lib/utils";
import type { CartItem } from "@/types";

function QtyStepper({ item }: { item: CartItem }) {
  const update = useUpdateCartItem();
  const minQty = item.product_min_order_qty || 1;
  const set = (q: number) => {
    if (q < minQty) return;
    update.mutate({ itemId: item.id, quantity: q });
  };
  return (
    <div className="inline-flex items-center rounded-lg border">
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-r-none"
        disabled={item.quantity <= minQty || update.isPending}
        onClick={() => set(item.quantity - 1)}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="w-10 text-center text-sm font-medium tabular-nums">
        {item.quantity}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-l-none"
        disabled={update.isPending}
        onClick={() => set(item.quantity + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

export default function CartPage() {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const [clearOpen, setClearOpen] = useState(false);

  const items = cart?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Shopping Cart" description="Review your items." />
        <CartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Shopping Cart" />
        <ErrorState title="Couldn't load your cart" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopping Cart"
        description={`${cart?.item_count ?? 0} item${
          (cart?.item_count ?? 0) === 1 ? "" : "s"
        } in your cart.`}
        actions={
          items.length > 0 && (
            <Button
              variant="ghost"
              className="text-danger hover:text-danger"
              onClick={() => setClearOpen(true)}
            >
              <Trash2 className="size-4" /> Clear cart
            </Button>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add products to your cart to check out."
          action={
            <Button asChild variant="brand">
              <Link href="/buyer/products">Browse products</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Line items */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-transparent">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {mediaUrl(item.product_image_url) ? (
                            <Image
                              src={mediaUrl(item.product_image_url)!}
                              alt={item.product_name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <Package className="size-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/buyer/products/${item.product}`}
                            className="line-clamp-1 text-sm font-medium hover:text-brand"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {item.product_sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <QtyStepper item={item} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {formatCurrency(item.line_total)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-danger"
                        aria-label="Remove item"
                        disabled={removeItem.isPending}
                        onClick={() => removeItem.mutate(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Summary */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(cart?.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">
                    Calculated at checkout
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(cart?.total)}
                  </span>
                </div>
                <Button asChild variant="brand" size="lg" className="w-full">
                  <Link href="/buyer/checkout">
                    Proceed to checkout <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/buyer/products">Continue shopping</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear your cart?"
        description="This will remove all items from your cart. This can't be undone."
        confirmLabel="Clear cart"
        destructive
        loading={clearCart.isPending}
        onConfirm={() =>
          clearCart.mutate(undefined, { onSuccess: () => setClearOpen(false) })
        }
      />
    </div>
  );
}
