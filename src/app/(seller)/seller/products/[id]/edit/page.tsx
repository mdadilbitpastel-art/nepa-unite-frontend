"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/shop/product-form";
import { useProduct } from "@/features/products/use-products";
import { DetailSkeleton, ErrorState } from "@/components/shared/states";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const { data: product, isLoading, isError, refetch } = useProduct(params.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit product"
        description="Update details and the return / exchange policy."
      />
      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !product ? (
        <ErrorState
          title="Product not found"
          onRetry={() => refetch()}
        />
      ) : (
        <ProductForm product={product} />
      )}
    </div>
  );
}
