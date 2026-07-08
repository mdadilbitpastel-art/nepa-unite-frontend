"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RotateCcw } from "lucide-react";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/features/products/use-products";
import { productSchema, type ProductInput } from "@/lib/validations";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/** Add / edit form for a seller's product, including the return policy. */
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const editing = !!product;

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: product?.sku ?? "",
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price ?? "",
      mrp: product?.mrp ?? "",
      inventory_count: product?.inventory_count ?? 0,
      min_order_qty: product?.min_order_qty ?? 1,
      category:
        typeof product?.attributes?.category === "string"
          ? product.attributes.category
          : "",
      is_returnable: product?.is_returnable ?? true,
      return_window_days: product?.return_window_days ?? 7,
      is_exchangeable: product?.is_exchangeable ?? true,
      return_policy_note: product?.return_policy_note ?? "",
    },
  });

  const { register, handleSubmit, watch, formState } = form;
  const isReturnable = watch("is_returnable");
  const pending = create.isPending || update.isPending;

  const onSubmit = (values: ProductInput) => {
    const body: Partial<Product> & { attributes?: Record<string, unknown> } = {
      sku: values.sku,
      name: values.name,
      description: values.description,
      price: values.price,
      mrp: values.mrp ? values.mrp : null,
      inventory_count: values.inventory_count,
      min_order_qty: values.min_order_qty,
      attributes: {
        ...(product?.attributes ?? {}),
        category: values.category || undefined,
      },
      is_returnable: values.is_returnable,
      return_window_days: values.return_window_days,
      is_exchangeable: values.is_exchangeable,
      return_policy_note: values.return_policy_note || "",
    };

    const done = () => router.push("/seller/products");
    if (editing) {
      update.mutate({ id: product!.id, body }, { onSuccess: done });
    } else {
      create.mutate(body, { onSuccess: done });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={formState.errors.name?.message}>
            <Input {...register("name")} placeholder="Cordless Driver Drill" />
          </Field>
          <Field label="SKU" required error={formState.errors.sku?.message}>
            <Input {...register("sku")} placeholder="LT-001" />
          </Field>
          <Field
            label="Category"
            error={formState.errors.category?.message}
            className="sm:col-span-2"
          >
            <Input {...register("category")} placeholder="Electrical" />
          </Field>
          <Field
            label="Description"
            required
            error={formState.errors.description?.message}
            className="sm:col-span-2"
          >
            <Textarea
              {...register("description")}
              rows={4}
              placeholder="Describe the product…"
            />
          </Field>
          <Field label="Price" required error={formState.errors.price?.message}>
            <Input {...register("price")} placeholder="130.00" inputMode="decimal" />
          </Field>
          <Field label="MRP (optional)" error={formState.errors.mrp?.message}>
            <Input {...register("mrp")} placeholder="160.00" inputMode="decimal" />
          </Field>
          <Field
            label="Inventory"
            required
            error={formState.errors.inventory_count?.message}
          >
            <Input type="number" min={0} {...register("inventory_count")} />
          </Field>
          <Field
            label="Min. order qty"
            required
            error={formState.errors.min_order_qty?.message}
          >
            <Input type="number" min={1} {...register("min_order_qty")} />
          </Field>
        </CardContent>
      </Card>

      {/* Return / exchange policy */}
      <Card>
        <CardHeader className="flex-row items-center gap-2.5 space-y-0">
          <RotateCcw className="size-4 text-brand" />
          <CardTitle className="text-base">Return &amp; exchange policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register("is_returnable")}
              className="size-4 rounded border-input accent-[hsl(var(--brand))]"
            />
            <span className="text-sm">
              Allow returns
              <span className="block text-xs text-muted-foreground">
                Buyers can return this item for a refund after delivery.
              </span>
            </span>
          </label>

          <div className={cn(!isReturnable && "pointer-events-none opacity-50")}>
            <Field
              label="Return window (days)"
              error={formState.errors.return_window_days?.message}
            >
              <Input
                type="number"
                min={0}
                max={365}
                className="max-w-[10rem]"
                {...register("return_window_days")}
              />
            </Field>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register("is_exchangeable")}
              className="size-4 rounded border-input accent-[hsl(var(--brand))]"
            />
            <span className="text-sm">
              Allow exchanges
              <span className="block text-xs text-muted-foreground">
                Buyers can swap this item within the return window.
              </span>
            </span>
          </label>

          <Field
            label="Policy note (optional)"
            error={formState.errors.return_policy_note?.message}
          >
            <Textarea
              {...register("return_policy_note")}
              rows={2}
              placeholder="e.g. Must be unused and in original packaging."
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/seller/products")}
        >
          Cancel
        </Button>
        <Button type="submit" variant="brand" loading={pending}>
          {editing ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
