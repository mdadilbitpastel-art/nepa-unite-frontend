"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "../product-form";
import { useCreateProduct } from "@/features/products/use-products";
import type { ProductInput } from "@/lib/validations";

export default function NewProductPage() {
  const router = useRouter();
  const create = useCreateProduct();

  const onSubmit = (values: ProductInput) => {
    const { category, mrp, ...rest } = values;
    create.mutate(
      {
        ...rest,
        mrp: mrp ? mrp : null,
        attributes: category ? { category } : {},
      },
      {
        onSuccess: () => router.push("/seller/products"),
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add product"
        description="Create a new listing for your catalog."
      />
      <ProductForm
        submitting={create.isPending}
        submitLabel="Create product"
        onSubmit={onSubmit}
      />
    </div>
  );
}
