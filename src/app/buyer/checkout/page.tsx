"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Plus, Check, ShoppingCart, Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailSkeleton } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart, useCheckout } from "@/features/cart/use-cart";
import { addressService } from "@/services";
import { qk } from "@/lib/query-keys";
import { formatCurrency, cn } from "@/lib/utils";
import type { Address } from "@/types";

const NEW_ADDRESS = "__new__";

interface InlineShipping {
  shipping_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  buyer_notes: string;
}

const EMPTY_SHIPPING: InlineShipping = {
  shipping_name: "",
  shipping_phone: "",
  shipping_address_line1: "",
  shipping_address_line2: "",
  shipping_city: "",
  shipping_state: "",
  shipping_zip: "",
  buyer_notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart, isLoading: cartLoading } = useCart();
  const checkout = useCheckout();

  const addressesQuery = useQuery({
    queryKey: qk.addresses,
    queryFn: addressService.list,
  });
  const addresses = addressesQuery.data ?? [];

  const [selected, setSelected] = useState<string>(NEW_ADDRESS);
  const [shipping, setShipping] = useState<InlineShipping>(EMPTY_SHIPPING);

  // Default to the user's default (or first) saved address once loaded.
  useEffect(() => {
    if (addresses.length > 0 && selected === NEW_ADDRESS) {
      const def = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelected(def.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressesQuery.data]);

  const items = cart?.items ?? [];

  const onSubmit = () => {
    if (selected !== NEW_ADDRESS) {
      checkout.mutate(
        { address_id: selected },
        {
          onSuccess: (order) => {
            toast.success("Order created");
            router.push(`/buyer/orders/${order.id}`);
          },
        },
      );
      return;
    }

    // Inline shipping validation
    const required: (keyof InlineShipping)[] = [
      "shipping_name",
      "shipping_phone",
      "shipping_address_line1",
      "shipping_city",
      "shipping_state",
      "shipping_zip",
    ];
    const missing = required.some((k) => !shipping[k].trim());
    if (missing) {
      toast.error("Please fill in all required shipping fields.");
      return;
    }
    checkout.mutate(
      {
        shipping_name: shipping.shipping_name,
        shipping_phone: shipping.shipping_phone,
        shipping_address_line1: shipping.shipping_address_line1,
        shipping_address_line2: shipping.shipping_address_line2 || undefined,
        shipping_city: shipping.shipping_city,
        shipping_state: shipping.shipping_state,
        shipping_zip: shipping.shipping_zip,
        buyer_notes: shipping.buyer_notes || undefined,
      },
      {
        onSuccess: (order) => {
          toast.success("Order created");
          router.push(`/buyer/orders/${order.id}`);
        },
      },
    );
  };

  if (cartLoading) return <DetailSkeleton />;

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checkout" />
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add items to your cart before checking out."
          action={
            <Button asChild variant="brand">
              <Link href="/buyer/products">Browse products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const field =
    (key: keyof InlineShipping) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setShipping((s) => ({ ...s, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout"
        description="Choose where to ship your order and review the summary."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Saved addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {addressesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading addresses…
                </p>
              ) : (
                addresses.map((a: Address) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-brand/40",
                      selected === a.id && "border-brand bg-brand/[0.03]",
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                        selected === a.id
                          ? "border-brand bg-brand text-brand-foreground"
                          : "border-border",
                      )}
                    >
                      {selected === a.id && <Check className="size-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{a.label}</p>
                        {a.is_default && (
                          <Badge variant="info">Default</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {a.recipient_name} · {a.phone}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state}{" "}
                        {a.zip_code}, {a.country}
                      </p>
                    </div>
                  </button>
                ))
              )}

              <button
                type="button"
                onClick={() => setSelected(NEW_ADDRESS)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border border-dashed p-4 text-left transition-colors hover:border-brand/40",
                  selected === NEW_ADDRESS && "border-brand bg-brand/[0.03]",
                )}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Plus className="size-4" />
                </div>
                <p className="text-sm font-medium">Ship to a new address</p>
              </button>

              {selected === NEW_ADDRESS && (
                <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
                  <Field label="Recipient name" required>
                    <Input
                      value={shipping.shipping_name}
                      onChange={field("shipping_name")}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field label="Phone" required>
                    <Input
                      value={shipping.shipping_phone}
                      onChange={field("shipping_phone")}
                      placeholder="+977…"
                    />
                  </Field>
                  <Field label="Address line 1" required className="sm:col-span-2">
                    <Input
                      value={shipping.shipping_address_line1}
                      onChange={field("shipping_address_line1")}
                      placeholder="Street address"
                    />
                  </Field>
                  <Field label="Address line 2" className="sm:col-span-2">
                    <Input
                      value={shipping.shipping_address_line2}
                      onChange={field("shipping_address_line2")}
                      placeholder="Apt, suite, etc. (optional)"
                    />
                  </Field>
                  <Field label="City" required>
                    <Input
                      value={shipping.shipping_city}
                      onChange={field("shipping_city")}
                    />
                  </Field>
                  <Field label="State" required>
                    <Input
                      value={shipping.shipping_state}
                      onChange={field("shipping_state")}
                    />
                  </Field>
                  <Field label="ZIP code" required>
                    <Input
                      value={shipping.shipping_zip}
                      onChange={field("shipping_zip")}
                    />
                  </Field>
                  <Field label="Notes" className="sm:col-span-2">
                    <Textarea
                      value={shipping.buyer_notes}
                      onChange={field("buyer_notes")}
                      placeholder="Delivery instructions (optional)"
                      rows={2}
                    />
                  </Field>
                </div>
              )}

              {addresses.length === 0 && !addressesQuery.isLoading && (
                <p className="text-xs text-muted-foreground">
                  No saved addresses.{" "}
                  <Link
                    href="/buyer/addresses"
                    className="text-brand hover:underline"
                  >
                    Manage your address book
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {item.product_name}{" "}
                      <span className="text-foreground">× {item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(cart?.total)}
                </span>
              </div>
              <Button
                variant="brand"
                size="lg"
                className="w-full"
                loading={checkout.isPending}
                onClick={onSubmit}
              >
                <Lock className="size-4" /> Place order
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                Payment is collected after the order is created.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
