"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/shop/product-form";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add product"
        description="List a new product and set its return / exchange policy."
      />
      <ProductForm />
    </div>
  );
}
