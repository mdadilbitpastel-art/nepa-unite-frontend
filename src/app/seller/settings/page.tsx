"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Bell, CreditCard, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FormSkeleton } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/shared/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMember,
  useUpdateMember,
} from "@/features/members/use-members";
import { useAuth } from "@/hooks/use-auth";
import { titleCase } from "@/lib/utils";

const NOTIFICATION_PREFS = [
  {
    key: "newOrders",
    label: "New orders",
    desc: "Get notified when a buyer places an order with your items.",
  },
  {
    key: "lowStock",
    label: "Low stock alerts",
    desc: "Alert me when a product drops below its threshold.",
  },
  {
    key: "payouts",
    label: "Payout updates",
    desc: "Notifications when payouts are sent to your account.",
  },
  {
    key: "marketing",
    label: "Product tips & updates",
    desc: "Occasional emails about selling on NEPA Unite.",
  },
] as const;

export default function SellerSettingsPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const { data: member, isLoading } = useMember(sellerId);
  const update = useUpdateMember();

  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    newOrders: true,
    lowStock: true,
    payouts: true,
    marketing: false,
  });

  useEffect(() => {
    if (member?.email) setEmail(member.email);
  }, [member?.email]);

  if (isLoading) return <FormSkeleton />;

  const connected = !!member?.stripe_account_id;
  const emailChanged = email !== member?.email && email.trim().length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your business profile, notifications, and payouts."
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <Building2 className="size-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="payouts">
            <CreditCard className="size-4" /> Payouts
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business profile</CardTitle>
              <CardDescription>
                Your tenant details and contact email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Business name" hint="Managed by your tenant">
                  <Input value={member?.tenant?.name ?? ""} disabled />
                </Field>
                <Field label="Industry vertical">
                  <Input
                    value={titleCase(member?.tenant?.vertical_type ?? "")}
                    disabled
                  />
                </Field>
              </div>
              <Field label="Contact email" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <div className="flex justify-end">
                <Button
                  variant="brand"
                  disabled={!emailChanged}
                  loading={update.isPending}
                  onClick={() =>
                    update.mutate({ id: sellerId, body: { email } })
                  }
                >
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification preferences</CardTitle>
              <CardDescription>
                Choose which updates you want to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {NOTIFICATION_PREFS.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                  <Switch
                    checked={prefs[p.key]}
                    onCheckedChange={(v) =>
                      setPrefs((prev) => ({ ...prev, [p.key]: v }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stripe Connect</CardTitle>
              <CardDescription>
                Your payout account status.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Payout account</p>
                    <Badge variant={connected ? "success" : "warning"} dot>
                      {connected ? "Connected" : "Not connected"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {connected
                      ? "You're set up to receive payouts."
                      : "Connect a Stripe account to receive payouts."}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link href="/seller/payouts">
                  Manage <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
