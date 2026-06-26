"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/shared/form-field";
import { productSchema, type ProductInput } from "@/lib/validations";
import type { Product } from "@/types";

export interface ProductFormProps {
  defaultValues?: Partial<ProductInput>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: ProductInput) => void;
}

/** Map a Product object to form defaults. */
export function productToFormValues(p: Product): Partial<ProductInput> {
  return {
    sku: p.sku,
    name: p.name,
    description: p.description,
    price: p.price,
    mrp: p.mrp ?? "",
    inventory_count: p.inventory_count,
    min_order_qty: p.min_order_qty,
    category:
      typeof p.attributes?.category === "string"
        ? (p.attributes.category as string)
        : "",
  };
}

export function ProductForm({
  defaultValues,
  submitting,
  submitLabel = "Save product",
  onSubmit,
}: ProductFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      min_order_qty: 1,
      inventory_count: 0,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product details</CardTitle>
          <CardDescription>
            Fill in the basics buyers will see in the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="SKU" required error={errors.sku?.message}>
              <Input placeholder="SKU-1001" {...register("sku")} />
            </Field>
            <Field
              label="Category"
              hint="e.g. Lighting, Fasteners"
              error={errors.category?.message}
            >
              <Input placeholder="Category" {...register("category")} />
            </Field>
          </div>

          <Field label="Product name" required error={errors.name?.message}>
            <Input placeholder="Stainless Steel Widget" {...register("name")} />
          </Field>

          <Field
            label="Description"
            required
            error={errors.description?.message}
          >
            <Textarea
              rows={4}
              placeholder="Describe the product, materials, specs…"
              {...register("description")}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Price (USD)" required error={errors.price?.message}>
              <Input placeholder="19.99" inputMode="decimal" {...register("price")} />
            </Field>
            <Field
              label="MRP / list price (USD)"
              hint="Optional — shown struck-through with a discount badge"
              error={errors.mrp?.message}
            >
              <Input placeholder="24.99" inputMode="decimal" {...register("mrp")} />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Inventory"
              required
              error={errors.inventory_count?.message}
            >
              <Input
                type="number"
                min={0}
                placeholder="100"
                {...register("inventory_count")}
              />
            </Field>
            <Field
              label="Min order qty"
              required
              error={errors.min_order_qty?.message}
            >
              <Input
                type="number"
                min={1}
                placeholder="1"
                {...register("min_order_qty")}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <Button asChild variant="ghost" type="button">
          <Link href="/seller/products">
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/seller/products")}
          >
            Cancel
          </Button>
          <Button variant="brand" type="submit" loading={submitting}>
            <Save className="size-4" /> {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
