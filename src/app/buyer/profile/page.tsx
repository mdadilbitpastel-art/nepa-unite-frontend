"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Building2, Shield, Lock, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailSkeleton, ErrorState } from "@/components/shared/states";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { memberService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import { initials, titleCase } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/constants";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
type EmailInput = z.infer<typeof emailSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: member, isLoading, isError, refetch } = useQuery({
    queryKey: qk.member(userId ?? ""),
    queryFn: () => memberService.get(userId as string),
    enabled: !!userId,
  });

  const qc = useQueryClient();
  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (member?.email) form.reset({ email: member.email });
  }, [member?.email, form]);

  const updateEmail = useMutation({
    mutationFn: (values: EmailInput) =>
      memberService.update(userId as string, { email: values.email }),
    onSuccess: (updated) => {
      qc.setQueryData(qk.member(userId as string), updated);
      toast.success("Email updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  if (!userId || isLoading) return <DetailSkeleton />;
  if (isError || !member)
    return (
      <ErrorState title="Couldn't load profile" onRetry={() => refetch()} />
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account details and security."
      />

      {/* Identity card */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-brand-gradient" />
        <CardContent className="-mt-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar className="size-20 border-4 border-card shadow-soft">
              <AvatarFallback className="bg-brand/10 text-xl text-brand">
                {initials(member.email)}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h2 className="text-lg font-semibold">{member.email}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="info">{ROLE_LABEL[member.role]}</Badge>
                <AccountStatusBadge status={member.status} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="size-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="size-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Edit email */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Account details</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit((v) => updateEmail.mutate(v))}
                  className="space-y-4"
                >
                  <Field
                    label="Email address"
                    required
                    error={form.formState.errors.email?.message}
                  >
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...form.register("email")}
                        type="email"
                        className="pl-9"
                      />
                    </div>
                  </Field>
                  <Button
                    type="submit"
                    variant="brand"
                    loading={updateEmail.isPending}
                    disabled={!form.formState.isDirty}
                  >
                    Save changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tenant / role info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4 text-muted-foreground" />
                  Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {member.tenant ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Business</p>
                      <p className="font-medium">{member.tenant.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Vertical</p>
                      <p className="font-medium">
                        {titleCase(member.tenant.vertical_type)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tenant status
                      </p>
                      <div className="mt-1">
                        <AccountStatusBadge status={member.tenant.status} />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    No organization linked.
                  </p>
                )}
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Shield className="size-4 text-brand" />
                    <span className="font-medium">
                      {ROLE_LABEL[member.role]}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Password & security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
                <Lock className="mt-0.5 size-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Change password</p>
                  <p className="text-muted-foreground">
                    To change your password, use the “Forgot password” flow on
                    the sign-in page. A secure reset link will be emailed to you.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline">
                <a href="/forgot-password">Reset password</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
