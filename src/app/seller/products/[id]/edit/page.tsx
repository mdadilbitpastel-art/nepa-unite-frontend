"use client";

import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { FormSkeleton, ErrorState } from "@/components/shared/states";
import {
  ProductForm,
  productToFormValues,
} from "../../product-form";
import {
  useProduct,
  useUpdateProduct,
} from "@/features/products/use-products";
import type { ProductInput } from "@/lib/validations";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const update = useUpdateProduct();

  const onSubmit = (values: ProductInput) => {
    const { category, mrp, ...rest } = values;
    update.mutate(
      {
        id,
        body: {
          ...rest,
          mrp: mrp ? mrp : null,
          attributes: category ? { category } : {},
        },
      },
      {
        onSuccess: () => router.push("/seller/products"),
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit product"
        description="Update the details of your listing."
      />
      {isLoading ? (
        <FormSkeleton fields={8} />
      ) : isError || !product ? (
        <ErrorState
          message="We couldn't load this product."
          onRetry={() => refetch()}
        />
      ) : (
        <ProductForm
          defaultValues={productToFormValues(product)}
          submitting={update.isPending}
          submitLabel="Save changes"
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
