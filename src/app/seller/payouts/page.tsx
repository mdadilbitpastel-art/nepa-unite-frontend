"use client";

import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Banknote,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FormSkeleton } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMember } from "@/features/members/use-members";
import { useOnboardSeller } from "@/features/payments/use-payments";
import { useAuth } from "@/hooks/use-auth";

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Verify your identity",
    desc: "Stripe collects business and identity details to comply with regulations.",
  },
  {
    icon: Banknote,
    title: "Add a bank account",
    desc: "Connect the account where you'd like to receive payouts.",
  },
  {
    icon: CheckCircle2,
    title: "Start receiving payouts",
    desc: "Earnings are settled to your account after each order is delivered.",
  },
];

export default function SellerPayoutsPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const { data: member, isLoading } = useMember(sellerId);
  const onboard = useOnboardSeller();

  const connected = !!member?.stripe_account_id;

  const handleConnect = () => {
    onboard.mutate(undefined, {
      onSuccess: (res) => {
        window.location.href = res.onboarding_url;
      },
    });
  };

  if (isLoading) return <FormSkeleton fields={3} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stripe Connect"
        description="Connect your account to receive payouts for your sales."
      />

      {/* Status banner */}
      <Card
        className={
          connected
            ? "border-success/30 bg-success/5"
            : "border-brand/20 bg-brand/5"
        }
      >
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex size-12 items-center justify-center rounded-xl ${
                connected
                  ? "bg-success/15 text-success"
                  : "bg-brand/15 text-brand"
              }`}
            >
              <CreditCard className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {connected ? "Account connected" : "Not connected yet"}
                </h3>
                <Badge variant={connected ? "success" : "warning"} dot>
                  {connected ? "Active" : "Action needed"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {connected
                  ? "Your Stripe account is linked and ready to receive payouts."
                  : "Connect a Stripe account to start receiving payouts."}
              </p>
            </div>
          </div>
          <Button
            variant={connected ? "outline" : "brand"}
            loading={onboard.isPending}
            onClick={handleConnect}
          >
            {connected ? "Manage account" : "Connect Stripe"}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How payouts work</CardTitle>
          <CardDescription>
            A quick, secure onboarding handled entirely by Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="space-y-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <s.icon className="size-5" />
                </div>
                <p className="text-sm font-semibold">
                  {i + 1}. {s.title}
                </p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
