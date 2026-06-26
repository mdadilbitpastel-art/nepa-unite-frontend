"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Layers } from "lucide-react";
import { useProductSearch } from "@/features/products/use-products";
import { mediaUrl, titleCase } from "@/lib/utils";

/** A single category tile — top-product image on a clean white card. */
function CategoryTile({ category }: { category: string }) {
  const { data } = useProductSearch({
    category,
    in_stock: true,
    page: 1,
    page_size: 1,
  });
  const product = data?.results?.[0];
  const img = product ? mediaUrl(product.primary_image_url) : null;

  return (
    <Link
      href={`/products?category=${encodeURIComponent(category)}`}
      className="group overflow-hidden rounded-2xl border bg-card shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {img ? (
          <Image
            src={img}
            alt={titleCase(category)}
            fill
            sizes="(max-width:640px) 50vw, 25vw"
            className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Layers className="size-10" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t px-3.5 py-2.5">
        <span className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-brand">
          {titleCase(category)}
        </span>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>
    </Link>
  );
}

export function HomeCategories({ categories }: { categories: string[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Shop by category
          </h2>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
          >
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((c) => (
            <CategoryTile key={c} category={c} />
          ))}
        </div>
      </div>
    </section>
  );
}
