"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Plus, Pencil, Trash2, Star, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/features/addresses/use-addresses";
import { addressSchema, type AddressInput } from "@/lib/validations";
import type { Address } from "@/types";

const EMPTY: AddressInput = {
  label: "",
  recipient_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip_code: "",
  country: "NP",
  is_default: false,
};

export default function AddressesPage() {
  const { data, isLoading, isError, refetch } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY,
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    form.reset({
      label: a.label,
      recipient_name: a.recipient_name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      zip_code: a.zip_code,
      country: a.country,
      is_default: a.is_default,
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: AddressInput) => {
    if (editing) {
      updateAddress.mutate(
        { id: editing.id, body: values },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createAddress.mutate(
        { ...values, is_default: values.is_default ?? false },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const addresses = data ?? [];
  const saving = createAddress.isPending || updateAddress.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Address Book"
        description="Manage your shipping addresses."
        actions={
          <Button variant="brand" onClick={openCreate}>
            <Plus className="size-4" /> Add address
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : isError ? (
        <ErrorState title="Couldn't load addresses" onRetry={() => refetch()} />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses yet"
          description="Add a shipping address to speed up checkout."
          action={
            <Button variant="brand" onClick={openCreate}>
              <Plus className="size-4" /> Add address
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {addresses.map((a) => (
            <Card key={a.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <MapPin className="size-4" />
                    </div>
                    <p className="font-semibold">{a.label}</p>
                  </div>
                  {a.is_default && <Badge variant="info">Default</Badge>}
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {a.recipient_name}
                  </p>
                  <p>{a.phone}</p>
                  <p className="mt-1">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}
                  </p>
                  <p>
                    {a.city}, {a.state} {a.zip_code}, {a.country}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {!a.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      loading={
                        setDefault.isPending &&
                        setDefault.variables === a.id
                      }
                      onClick={() => setDefault.mutate(a.id)}
                    >
                      <Star className="size-3.5" /> Set default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Edit address"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Delete address"
                    className="text-danger hover:text-danger"
                    onClick={() => setDeleteId(a.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit address" : "Add a new address"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Field
              label="Label"
              required
              error={form.formState.errors.label?.message}
            >
              <Input {...form.register("label")} placeholder="Home, Office…" />
            </Field>
            <Field
              label="Recipient name"
              required
              error={form.formState.errors.recipient_name?.message}
            >
              <Input {...form.register("recipient_name")} />
            </Field>
            <Field
              label="Phone"
              required
              error={form.formState.errors.phone?.message}
              className="sm:col-span-2"
            >
              <Input {...form.register("phone")} placeholder="+977…" />
            </Field>
            <Field
              label="Address line 1"
              required
              error={form.formState.errors.line1?.message}
              className="sm:col-span-2"
            >
              <Input {...form.register("line1")} />
            </Field>
            <Field
              label="Address line 2"
              error={form.formState.errors.line2?.message}
              className="sm:col-span-2"
            >
              <Input {...form.register("line2")} placeholder="Optional" />
            </Field>
            <Field
              label="City"
              required
              error={form.formState.errors.city?.message}
            >
              <Input {...form.register("city")} />
            </Field>
            <Field
              label="State"
              required
              error={form.formState.errors.state?.message}
            >
              <Input {...form.register("state")} />
            </Field>
            <Field
              label="ZIP code"
              required
              error={form.formState.errors.zip_code?.message}
            >
              <Input {...form.register("zip_code")} />
            </Field>
            <Field
              label="Country"
              required
              error={form.formState.errors.country?.message}
            >
              <Input {...form.register("country")} placeholder="NP" />
            </Field>

            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <Label htmlFor="is-default" className="cursor-pointer">
                Set as default address
              </Label>
              <Switch
                id="is-default"
                checked={form.watch("is_default") ?? false}
                onCheckedChange={(v) => form.setValue("is_default", v)}
              />
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={saving}>
                <Check className="size-4" />
                {editing ? "Save changes" : "Add address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this address?"
        description="This address will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={deleteAddress.isPending}
        onConfirm={() =>
          deleteId &&
          deleteAddress.mutate(deleteId, {
            onSuccess: () => setDeleteId(null),
          })
        }
      />
    </div>
  );
}
