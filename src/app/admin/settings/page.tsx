"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Building2,
  Percent,
  Bell,
  ShieldCheck,
  ArrowRight,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from "@/lib/constants";

function NotificationRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState(APP_NAME);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Configure marketplace defaults, notifications, and security."
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="size-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="commission">
            <Percent className="size-4" />
            Commission
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform identity</CardTitle>
              <CardDescription>
                Display name shown across the marketplace and emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Platform name"
                hint="Cosmetic only in this build — not yet persisted to the backend."
              >
                <Input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="max-w-md"
                />
              </Field>
              <div className="flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
                <Info className="mt-0.5 size-4 shrink-0 text-brand" />
                <p className="text-muted-foreground">
                  Persisting platform settings requires a backend endpoint that
                  is not yet in the API contract.
                </p>
              </div>
              <Button
                variant="brand"
                onClick={() => toast.success("Saved locally")}
              >
                Save changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission defaults</CardTitle>
              <CardDescription>
                The platform takes a category-based referral fee on each sold
                line item. Categories without a rate are commission-free.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Rate schedule</p>
                    <p className="text-xs text-muted-foreground">
                      Manage per-category percentages and minimum fees.
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/commissions">
                      Manage rates <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Rate changes are snapshotted on each ledger row and only affect
                future orders.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Admin notifications
              </CardTitle>
              <CardDescription>
                Choose which platform events alert the admin team. Preferences
                are stored locally for now.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y py-0">
              <NotificationRow
                label="New seller applications"
                description="Notify when a seller registers and awaits approval."
                defaultChecked
              />
              <NotificationRow
                label="High-value orders"
                description="Alert when an order exceeds $5,000."
                defaultChecked
              />
              <NotificationRow
                label="Payment disputes"
                description="Notify on chargebacks and disputed payments."
                defaultChecked
              />
              <NotificationRow
                label="System health alerts"
                description="Alert when a dependency goes down."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security posture</CardTitle>
              <CardDescription>
                Account state and access controls enforced by the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>JWT access tokens</span>
                <Badge variant="success" dot>
                  Enforced
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Inactive accounts blocked at the API</span>
                <Badge variant="success" dot>
                  Enforced
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Role-based route gating (middleware)</span>
                <Badge variant="success" dot>
                  Enforced
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Rate limiting (100 req/min/user)</span>
                <Badge variant="success" dot>
                  Enforced
                </Badge>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Admins cannot self-register; staff accounts are provisioned
                out-of-band.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
