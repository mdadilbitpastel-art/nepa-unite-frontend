"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Building2,
  Lock,
  User as UserIcon,
  Calendar,
  Layers,
  KeyRound,
  Camera,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailSkeleton, ErrorState } from "@/components/shared/states";
import { AccountStatusBadge } from "@/components/shared/status-badge";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/stores/ui-store";
import { useProfileStore } from "@/stores/profile-store";
import { memberService } from "@/services";
import { qk } from "@/lib/query-keys";
import { initials, titleCase, formatDate } from "@/lib/utils";

/**
 * Locally-persisted profile fields. The backend member API is read-only for
 * name/photo (it only stores email/role/tenant), so name + avatar are saved
 * per-device in localStorage. Email is shown but not editable.
 */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const storageKey = (id: string) => `nepa:profile:${id}`;

type LocalProfile = { firstName: string; lastName: string; avatar: string | null };

export default function ProfilePage() {
  const { user } = useAuth();
  const userId = user?.id;
  const openAuth = useUiStore((s) => s.openAuth);
  const saveProfile = useProfileStore((s) => s.save);
  const hydrateProfile = useProfileStore((s) => s.hydrate);

  const { data: member, isLoading, isError, refetch } = useQuery({
    queryKey: qk.member(userId ?? ""),
    queryFn: () => memberService.get(userId as string),
    enabled: !!userId,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage (falling back to any names the backend returns),
  // and mirror into the shared store so the header reflects the saved name.
  useEffect(() => {
    if (!userId) return;
    hydrateProfile(userId);
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) {
        const saved = JSON.parse(raw) as LocalProfile;
        setFirstName(saved.firstName ?? "");
        setLastName(saved.lastName ?? "");
        setAvatar(saved.avatar ?? null);
        return;
      }
    } catch {
      /* ignore malformed cache */
    }
    setFirstName(member?.first_name ?? "");
    setLastName(member?.last_name ?? "");
  }, [userId, member?.first_name, member?.last_name, hydrateProfile]);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      setDirty(true);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setAvatar(null);
    setDirty(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const payload: LocalProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatar,
      };
      // Persist + update the shared store so the header updates immediately.
      saveProfile(userId, payload);
      setDirty(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Couldn't save your profile on this device.");
    } finally {
      setSaving(false);
    }
  }

  if (!userId || isLoading) return <DetailSkeleton />;
  if (isError || !member)
    return (
      <ErrorState title="Couldn't load profile" onRetry={() => refetch()} />
    );

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    member.email.split("@")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account settings"
        description="Manage your personal details, organization and security."
      />

      {/* Hidden file input, shared by the photo controls. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickPhoto}
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ─── Left rail: identity card ─── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="overflow-hidden">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="relative">
                <Avatar className="size-28 border-4 border-card shadow-elevated ring-1 ring-border">
                  {avatar ? (
                    <AvatarImage src={avatar} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-brand to-teal text-3xl font-semibold text-white">
                    {initials(displayName || member.email)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full border-2 border-card bg-gold-gradient text-gold-foreground shadow-sm transition-all hover:brightness-[1.05] hover:shadow-glow-gold"
                >
                  <Camera className="size-4" />
                </button>
              </div>

              <h2 className="mt-4 max-w-full truncate text-lg font-semibold capitalize text-foreground">
                {displayName}
              </h2>
              <p className="mt-0.5 flex max-w-full items-center gap-1.5 truncate text-sm text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{member.email}</span>
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <AccountStatusBadge status={member.status} />
              </div>

              <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="size-4" /> Change photo
                </Button>
                {avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger"
                    onClick={removePhoto}
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                )}
              </div>
            </CardContent>

            {/* Quick facts */}
            <div className="space-y-3 border-t bg-muted/20 px-6 py-5">
              <MetaRow
                icon={Calendar}
                label="Member since"
                value={formatDate(member.created_at)}
              />
              {member.tenant && (
                <MetaRow
                  icon={Building2}
                  label="Business"
                  value={member.tenant.name}
                />
              )}
            </div>
          </Card>
        </aside>

        {/* ─── Right column: editable sections ─── */}
        <div className="space-y-6">
          {/* Personal information */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon className="size-4 text-brand" />
                Personal information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name">
                    <Input
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="e.g. Adil"
                    />
                  </Field>
                  <Field label="Last name">
                    <Input
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="e.g. Alam"
                    />
                  </Field>
                </div>

                <Field
                  label="Email address"
                  hint="Your sign-in email can’t be changed here — contact support to update it."
                >
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={member.email}
                      readOnly
                      disabled
                      className="bg-muted/50 pl-9 pr-9"
                    />
                    <Lock className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>

                <div className="flex items-center justify-end gap-3 border-t pt-5">
                  {dirty && (
                    <span className="text-xs text-muted-foreground">
                      Unsaved changes
                    </span>
                  )}
                  <Button
                    type="submit"
                    variant="brand"
                    loading={saving}
                    disabled={!dirty}
                  >
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-brand" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {member.tenant ? (
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <DetailItem
                    icon={Building2}
                    label="Business name"
                    value={member.tenant.name}
                  />
                  <DetailItem
                    icon={Layers}
                    label="Industry vertical"
                    value={titleCase(member.tenant.vertical_type)}
                  />
                  <DetailItem
                    icon={ShieldCheck}
                    label="Tenant status"
                    value={titleCase(member.tenant.status)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Building2 className="size-5 shrink-0 text-muted-foreground" />
                  No organization is linked to this account yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="size-4 text-brand" />
                Password &amp; security
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <KeyRound className="size-5" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Password</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Reset it via a secure link sent to your email.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => openAuth("forgot")}
                >
                  <Lock className="size-4" /> Reset password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Compact icon + label/value row used in the identity rail. */
function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-brand" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto truncate text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

/** Labelled value with an icon chip, used in the detail grids. */
function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
