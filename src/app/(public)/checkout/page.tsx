"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CreditCard,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { CartSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Price } from "@/components/shop/price";
import { StripePayment } from "@/components/shop/stripe-payment";
import { useCart, useCheckout } from "@/features/cart/use-cart";
import { useAddresses } from "@/features/addresses/use-addresses";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";

interface ShippingForm {
  shipping_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  buyer_notes: string;
}

const EMPTY_FORM: ShippingForm = {
  shipping_name: "",
  shipping_phone: "",
  shipping_address_line1: "",
  shipping_address_line2: "",
  shipping_city: "",
  shipping_state: "",
  shipping_zip: "",
  buyer_notes: "",
};

const REQUIRED_FIELDS: (keyof ShippingForm)[] = [
  "shipping_name",
  "shipping_phone",
  "shipping_address_line1",
  "shipping_city",
  "shipping_state",
  "shipping_zip",
];

export default function CheckoutPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const openAuth = useUiStore((s) => s.openAuth);

  // Guests can't check out — pop the sign-in dialog; on success they land back
  // on checkout (which then renders, since they're now authenticated).
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuth("login", "/checkout");
    }
  }, [authLoading, isAuthenticated, openAuth]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <CartSkeleton />
      </div>
    );
  }

  return <CheckoutFlow />;
}

function CheckoutFlow() {
  const router = useRouter();
  const { data: cart, isLoading, isError, refetch } = useCart();
  const { data: addresses } = useAddresses();
  const checkout = useCheckout();

  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM);

  // Default to the buyer's default (or first) saved address when available.
  useEffect(() => {
    if (order) return; // don't override once we've moved to payment
    if (addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, order]);

  const subtotal = parseFloat(cart?.total ?? "0");
  const itemCount = cart?.item_count ?? 0;

  const set = (k: keyof ShippingForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const inlineValid = useMemo(
    () => REQUIRED_FIELDS.every((f) => form[f].trim().length > 0),
    [form],
  );
  const canContinue =
    selectedAddressId !== "new" || inlineValid;

  async function handlePlaceOrder() {
    if (order) {
      setStep("payment");
      return;
    }
    try {
      const body =
        selectedAddressId !== "new"
          ? { address_id: selectedAddressId }
          : {
              shipping_name: form.shipping_name,
              shipping_phone: form.shipping_phone,
              shipping_address_line1: form.shipping_address_line1,
              shipping_address_line2: form.shipping_address_line2 || undefined,
              shipping_city: form.shipping_city,
              shipping_state: form.shipping_state,
              shipping_zip: form.shipping_zip,
              buyer_notes: form.buyer_notes || undefined,
            };
      const created = await checkout.mutateAsync(body);
      setOrder(created);
      setStep("payment");
    } catch {
      /* toast handled by the hook */
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <CartSkeleton />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="Couldn't load checkout" onRetry={() => refetch()} />
      </div>
    );
  }

  // Cart empty and no order created yet → nothing to check out.
  if (!order && itemCount === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          icon={Package}
          title="Your cart is empty"
          description="Add some products before heading to checkout."
          action={
            <Button asChild variant="brand">
              <Link href="/products">Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Order summary rows: from the created order once placed, else the live cart.
  const summaryRows = order
    ? order.items.map((i) => ({
        id: i.id,
        name: i.product_name ?? "Item",
        quantity: i.quantity,
        lineTotal: parseFloat(i.unit_price) * i.quantity,
      }))
    : (cart?.items ?? []).map((i) => ({
        id: i.id,
        name: i.product_name,
        quantity: i.quantity,
        lineTotal: parseFloat(i.unit_price) * i.quantity,
      }));

  const total = order ? parseFloat(order.total_amount) : subtotal;
  const returnUrl =
    order && typeof window !== "undefined"
      ? `${window.location.origin}/account/orders/${order.id}?paid=1`
      : undefined;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/cart">
            <ArrowLeft className="size-4" /> Back to cart
          </Link>
        </Button>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-3 text-sm">
        <StepDot active={step === "shipping"} done={step === "payment"} n={1} label="Shipping" />
        <div className="h-px flex-1 bg-border" />
        <StepDot active={step === "payment"} done={false} n={2} label="Payment" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {step === "shipping" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="size-4 text-brand" /> Shipping details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses && addresses.length > 0 && (
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAddressId(a.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                          selectedAddressId === a.id
                            ? "border-brand bg-brand/[0.04] ring-1 ring-brand"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {a.label || a.recipient_name}
                            {a.is_default && (
                              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.recipient_name}, {a.line1}
                            {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state}{" "}
                            {a.zip_code}
                          </p>
                        </div>
                        {selectedAddressId === a.id && (
                          <Check className="size-4 shrink-0 text-brand" />
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedAddressId("new")}
                      className={cn(
                        "w-full rounded-lg border border-dashed p-3 text-left text-sm transition-colors",
                        selectedAddressId === "new"
                          ? "border-brand bg-brand/[0.04] ring-1 ring-brand"
                          : "hover:bg-muted/50",
                      )}
                    >
                      + Ship to a new address
                    </button>
                  </div>
                )}

                {selectedAddressId === "new" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Full name" required>
                      <Input value={form.shipping_name} onChange={set("shipping_name")} placeholder="Jane Doe" />
                    </Field>
                    <Field label="Phone" required>
                      <Input value={form.shipping_phone} onChange={set("shipping_phone")} placeholder="(570) 555-0100" />
                    </Field>
                    <Field label="Address line 1" required className="sm:col-span-2">
                      <Input value={form.shipping_address_line1} onChange={set("shipping_address_line1")} placeholder="123 Main St" />
                    </Field>
                    <Field label="Address line 2" className="sm:col-span-2">
                      <Input value={form.shipping_address_line2} onChange={set("shipping_address_line2")} placeholder="Suite 200 (optional)" />
                    </Field>
                    <Field label="City" required>
                      <Input value={form.shipping_city} onChange={set("shipping_city")} placeholder="Scranton" />
                    </Field>
                    <Field label="State" required>
                      <Input value={form.shipping_state} onChange={set("shipping_state")} placeholder="PA" />
                    </Field>
                    <Field label="ZIP code" required>
                      <Input value={form.shipping_zip} onChange={set("shipping_zip")} placeholder="18503" />
                    </Field>
                    <Field label="Order notes" className="sm:col-span-2">
                      <Textarea value={form.buyer_notes} onChange={set("buyer_notes")} placeholder="Delivery instructions (optional)" rows={2} />
                    </Field>
                  </div>
                )}

                <Button
                  variant="brand"
                  size="lg"
                  className="w-full"
                  disabled={!canContinue}
                  loading={checkout.isPending}
                  onClick={handlePlaceOrder}
                >
                  Continue to payment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="size-4 text-brand" /> Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Order{" "}
                  <span className="font-mono font-medium text-foreground">
                    #{order?.id.slice(0, 8).toUpperCase()}
                  </span>{" "}
                  is reserved. Complete payment to confirm it.
                </p>
                {order && (
                  <StripePayment
                    orderId={order.id}
                    amount={order.total_amount}
                    returnUrl={returnUrl}
                    onPaid={() => {
                      toast.success("Order confirmed!");
                      router.push(`/account/orders/${order.id}?paid=1`);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {summaryRows.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 text-muted-foreground">
                      <span className="line-clamp-1">{r.name}</span>
                      <span className="text-xs">Qty {r.quantity}</span>
                    </span>
                    <span className="font-medium tabular-nums">
                      <Price value={r.lineTotal} size="sm" />
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-4 text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({order ? order.items.length : itemCount} item
                  {(order ? order.items.length : itemCount) === 1 ? "" : "s"})
                </span>
                <span className="font-medium">
                  <Price value={total} />
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-semibold">Total</span>
                <Price value={total} size="lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StepDot({
  active,
  done,
  n,
  label,
}: {
  active: boolean;
  done: boolean;
  n: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
          done
            ? "bg-success text-white"
            : active
              ? "bg-brand text-white"
              : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" /> : n}
      </span>
      <span className={cn("font-medium", active || done ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
    </div>
  );
}
