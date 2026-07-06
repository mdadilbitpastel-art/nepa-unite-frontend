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
  Lock,
  Tag,
  X,
} from "lucide-react";
import { CartSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Price } from "@/components/shop/price";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@/features/cart/use-cart";
import { useGuestCart, guestCartSubtotal } from "@/stores/guest-cart-store";
import { useUiStore } from "@/stores/ui-store";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, mediaUrl } from "@/lib/utils";

/** Estimated tax rate shown in the cart breakdown (finalised at checkout). */
const TAX_RATE = 0.08;
/** Demo coupons applied client-side in the cart summary. */
const COUPONS: Record<string, { label: string; rate?: number; amount?: number }> = {
  SAVE10: { label: "10% off", rate: 0.1 },
  WELCOME5: { label: "$5 off", amount: 5 },
};

interface CartRow {
  id: string;
  productId: string;
  name: string;
  sku: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  minOrderQty: number;
}

function CartView({
  rows,
  subtotal,
  onQty,
  onRemove,
  onClear,
  busy,
  clearing,
  checkout,
  checkoutNote,
}: {
  rows: CartRow[];
  subtotal: number;
  onQty: (row: CartRow, qty: number) => void;
  onRemove: (row: CartRow) => void;
  onClear: () => void;
  busy?: boolean;
  clearing?: boolean;
  checkout: React.ReactNode;
  checkoutNote?: React.ReactNode;
}) {
  const [clearOpen, setClearOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const count = rows.reduce((n, r) => n + r.quantity, 0);

  const applied = coupon ? COUPONS[coupon] : null;
  const discount = applied
    ? applied.rate
      ? subtotal * applied.rate
      : Math.min(applied.amount ?? 0, subtotal)
    : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * TAX_RATE;
  const total = taxable + tax;

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (COUPONS[code]) {
      setCoupon(code);
      setCouponError(null);
      setCouponInput("");
    } else {
      setCoupon(null);
      setCouponError("That code isn't valid.");
    }
  };
  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse the marketplace and add products to get started."
        action={
          <Button asChild variant="brand">
            <Link href="/products">Browse products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {count} item{count === 1 ? "" : "s"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger"
              onClick={() => setClearOpen(true)}
            >
              <Trash2 className="size-4" /> Clear cart
            </Button>
          </div>

          {rows.map((row) => (
            <Card key={row.id} className="overflow-hidden">
              <div className="flex gap-4 p-3.5">
                <Link
                  href={`/products/${row.productId}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  {mediaUrl(row.imageUrl) ? (
                    <Image
                      src={mediaUrl(row.imageUrl)!}
                      alt={row.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package className="size-7" />
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${row.productId}`}
                        className="line-clamp-2 text-sm font-semibold hover:text-brand"
                      >
                        {row.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        SKU: {row.sku}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemove(row)}
                      disabled={busy}
                      aria-label="Remove item"
                      className="shrink-0 text-muted-foreground transition-colors hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div className="inline-flex items-center rounded-lg border">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-r-none"
                        disabled={busy || row.quantity <= row.minOrderQty}
                        onClick={() => onQty(row, row.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-10 text-center text-sm font-medium tabular-nums">
                        {row.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-l-none"
                        disabled={busy}
                        onClick={() => onQty(row, row.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <Price value={row.unitPrice * row.quantity} size="md" />
                      <p className="text-xs text-muted-foreground">
                        {row.quantity} × ${row.unitPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coupon */}
              {applied ? (
                <div className="flex items-center justify-between rounded-lg border border-teal/30 bg-teal/[0.06] px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-teal">
                    <Tag className="size-4" />
                    {coupon} · {applied.label}
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Remove coupon"
                    className="text-muted-foreground transition-colors hover:text-danger"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyCoupon();
                        }
                      }}
                      placeholder="Coupon code (e.g. SAVE10)"
                      aria-label="Coupon code"
                    />
                    <Button
                      variant="outline"
                      className="shrink-0"
                      onClick={applyCoupon}
                      disabled={!couponInput.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-danger">{couponError}</p>
                  )}
                </div>
              )}

              {/* Price breakdown */}
              <div className="space-y-2.5 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal ({count} item{count === 1 ? "" : "s"})
                  </span>
                  <span className="font-medium">
                    <Price value={subtotal} />
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount ({coupon})
                    </span>
                    <span className="font-medium text-teal">
                      −{formatCurrency(discount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated tax</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-semibold">Total</span>
                <Price value={total} size="lg" />
              </div>

              {/* Actions — Proceed to checkout sits at the bottom */}
              <Button asChild variant="outline" className="w-full">
                <Link href="/products">Continue shopping</Link>
              </Button>
              {checkout}
              {checkoutNote}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear your cart?"
        description="This will remove all items from your cart."
        confirmLabel="Clear cart"
        destructive
        loading={clearing}
        onConfirm={() => {
          onClear();
          setClearOpen(false);
        }}
      />
    </>
  );
}

function AuthedCart() {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const clear = useClearCart();

  if (isLoading) return <CartSkeleton />;
  if (isError) return <ErrorState title="Couldn't load your cart" onRetry={() => refetch()} />;

  const rows: CartRow[] = (cart?.items ?? []).map((i) => ({
    id: i.id,
    productId: i.product,
    name: i.product_name,
    sku: i.product_sku,
    imageUrl: i.product_image_url,
    unitPrice: parseFloat(i.unit_price),
    quantity: i.quantity,
    minOrderQty: i.product_min_order_qty || 1,
  }));

  return (
    <CartView
      rows={rows}
      subtotal={parseFloat(cart?.total ?? "0")}
      busy={update.isPending || remove.isPending}
      clearing={clear.isPending}
      onQty={(row, qty) => {
        if (qty < row.minOrderQty) return;
        update.mutate({ itemId: row.id, quantity: qty });
      }}
      onRemove={(row) => remove.mutate(row.id)}
      onClear={() => clear.mutate()}
      checkout={
        <Button
          asChild
          variant="brand"
          size="lg"
          className="w-full"
          disabled={rows.length === 0}
        >
          <Link href="/checkout">
            <Lock className="size-4" /> Proceed to checkout
          </Link>
        </Button>
      }
      checkoutNote={
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="size-3" /> Secure payment powered by Stripe
        </p>
      }
    />
  );
}

function GuestCart() {
  const items = useGuestCart((s) => s.items);
  const setQty = useGuestCart((s) => s.setQty);
  const removeItem = useGuestCart((s) => s.remove);
  const clear = useGuestCart((s) => s.clear);
  const openAuth = useUiStore((s) => s.openAuth);

  const rows: CartRow[] = items.map((i) => ({
    id: i.productId,
    productId: i.productId,
    name: i.name,
    sku: i.sku,
    imageUrl: i.imageUrl,
    unitPrice: parseFloat(i.price),
    quantity: i.quantity,
    minOrderQty: i.minOrderQty || 1,
  }));

  return (
    <CartView
      rows={rows}
      subtotal={guestCartSubtotal(items)}
      onQty={(row, qty) => setQty(row.productId, qty)}
      onRemove={(row) => removeItem(row.productId)}
      onClear={() => clear()}
      checkout={
        <Button
          variant="brand"
          size="lg"
          className="w-full"
          disabled={rows.length === 0}
          onClick={() => openAuth("login", "/checkout")}
        >
          <Lock className="size-4" /> Sign in to checkout
        </Button>
      }
      checkoutNote={
        <p className="text-center text-xs text-muted-foreground">
          Sign in or create an account to complete your purchase securely.
        </p>
      }
    />
  );
}

export default function CartPage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Shopping cart</h1>
      {isLoading ? <CartSkeleton /> : isAuthenticated ? <AuthedCart /> : <GuestCart />}
    </div>
  );
}
