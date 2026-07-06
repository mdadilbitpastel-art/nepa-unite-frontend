"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { AlertCircle, CreditCard, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/states";
import {
  usePaymentConfig,
  useCreateIntent,
  useSyncPayment,
} from "@/features/payments/use-payments";
import { formatCurrency } from "@/lib/utils";

/**
 * Full Stripe card-payment flow for a single order:
 *   config → PaymentIntent (client_secret) → PaymentElement → confirmPayment
 *   → backend sync → onPaid()
 *
 * Works in Stripe test mode with no webhook configured: after the card is
 * confirmed we POST /payments/{id}/sync to move the order to Confirmed, then
 * fire `onPaid`. Used by both the checkout page and the order-detail pay panel.
 */

// Cache one Stripe.js instance per publishable key (loadStripe is expensive).
const stripeCache = new Map<string, Promise<Stripe | null>>();
function getStripe(publishableKey: string): Promise<Stripe | null> {
  let promise = stripeCache.get(publishableKey);
  if (!promise) {
    promise = loadStripe(publishableKey);
    stripeCache.set(publishableKey, promise);
  }
  return promise;
}

interface StripePaymentProps {
  orderId: string;
  /** Decimal string, e.g. "129.00" — displayed on the pay button. */
  amount: string;
  /** Called once the payment has succeeded and the order has been synced. */
  onPaid: () => void;
  /** Where Stripe should send the buyer for redirect-based methods. */
  returnUrl?: string;
}

export function StripePayment({
  orderId,
  amount,
  onPaid,
  returnUrl,
}: StripePaymentProps) {
  const {
    data: config,
    isLoading: configLoading,
    isError: configError,
  } = usePaymentConfig();
  const createIntent = useCreateIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const publishableKey =
    config?.publishable_key ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "";
  const stripePromise = useMemo(
    () => (publishableKey ? getStripe(publishableKey) : null),
    [publishableKey],
  );

  // Create (or reuse) the PaymentIntent once the order id is known. The ref
  // both dedups the request (so Strict Mode's double-mount fires it only once)
  // and marks which order the in-flight request belongs to, so a late response
  // for a since-changed order is ignored. We intentionally do NOT use an
  // effect-cleanup `active` flag: under Strict Mode the cleanup from the first
  // run flips it to false, and the ref guard stops the second run from
  // re-arming it — which would drop the client_secret and leave Stripe unloaded.
  const { mutateAsync: startIntent } = createIntent;
  const startedForOrder = useRef<string | null>(null);
  useEffect(() => {
    if (!orderId || clientSecret) return;
    if (startedForOrder.current === orderId) return;
    startedForOrder.current = orderId;
    startIntent(orderId)
      .then((res) => {
        // Ignore a stale response if the order changed while in flight.
        if (startedForOrder.current === orderId) {
          setClientSecret(res.client_secret);
        }
      })
      .catch(() => {
        // Allow a retry on the next render if the request failed.
        if (startedForOrder.current === orderId) {
          startedForOrder.current = null;
        }
      });
  }, [orderId, clientSecret, startIntent]);

  if (configLoading || (!clientSecret && createIntent.isPending)) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <Spinner className="text-brand" /> Preparing secure payment…
      </div>
    );
  }

  if (configError || !config?.configured || !publishableKey) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/[0.04] p-4 text-sm">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
        <p className="text-muted-foreground">
          Online payments are not configured. Please contact support to complete
          your order.
        </p>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/[0.04] p-4 text-sm">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
        <p className="text-muted-foreground">
          Couldn&apos;t initialize payment. Please refresh and try again.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2563EB",
            borderRadius: "10px",
            fontFamily: "inherit",
          },
        },
      }}
    >
      <CheckoutForm
        orderId={orderId}
        amount={amount}
        onPaid={onPaid}
        returnUrl={returnUrl}
      />
    </Elements>
  );
}

function CheckoutForm({
  orderId,
  amount,
  onPaid,
  returnUrl,
}: StripePaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const sync = useSyncPayment();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = submitting || sync.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: returnUrl ? { return_url: returnUrl } : {},
      // Stay on the page for card payments; only redirect when a method demands it.
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Reconcile server-side (webhook-free path), then hand back to the caller.
      try {
        await sync.mutateAsync(orderId);
      } catch {
        /* handled by the hook toast; order will still reconcile via webhook */
      }
      toast.success("Payment successful!");
      onPaid();
      return;
    }

    // Processing / requires further action but no redirect happened.
    if (paymentIntent) {
      toast.message("Payment is processing — we'll update your order shortly.");
      try {
        await sync.mutateAsync(orderId);
      } catch {
        /* ignore */
      }
      onPaid();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/[0.04] p-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="w-full"
        loading={busy}
        disabled={!stripe || !elements || busy}
      >
        <CreditCard className="size-4" /> Pay {formatCurrency(amount)}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="size-3" /> Secured by Stripe · Test card 4242 4242 4242
        4242, any future expiry &amp; CVC
      </p>
    </form>
  );
}
