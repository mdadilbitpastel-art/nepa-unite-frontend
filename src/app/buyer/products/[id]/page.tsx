"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Package,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Store,
  Star,
} from "lucide-react";
import { ProductDetailSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Price } from "@/components/shop/price";
import { useProduct } from "@/features/products/use-products";
import { useAddToCart } from "@/features/cart/use-cart";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "@/features/wishlist/use-wishlist";
import { productService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import { reviewSchema } from "@/lib/validations";
import { formatCurrency, formatDate, titleCase, mediaUrl, cn } from "@/lib/utils";
import type { z } from "zod";

type ReviewInput = z.infer<typeof reviewSchema>;

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < value
              ? "fill-warning text-warning"
              : "fill-muted text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: wishlist } = useWishlist();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // Find this product's wishlist row (if saved) so the heart reflects state.
  const wishlistItemId = useMemo(() => {
    return (wishlist ?? []).find((w) => {
      const pid = typeof w.product === "string" ? w.product : w.product.id;
      return pid === id;
    })?.id;
  }, [wishlist, id]);

  // Default the quantity to the product's minimum order quantity.
  useEffect(() => {
    const min = product?.min_order_qty;
    if (min) setQty((q) => (q < min ? min : q));
  }, [product?.min_order_qty]);

  const reviewsQuery = useQuery({
    queryKey: qk.reviews(id),
    queryFn: () => productService.reviews(id),
    enabled: !!id,
  });

  const qc = useQueryClient();
  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, title: "", body: "" },
  });

  const addReview = useMutation({
    mutationFn: (values: ReviewInput) =>
      productService.addReview(id, { product: id, ...values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.reviews(id) });
      toast.success("Review submitted");
      form.reset({ rating: 5, title: "", body: "" });
    },
    onError: (e: ApiError) => toast.error(e.message),
  });

  if (isLoading) return <ProductDetailSkeleton />;
  if (isError || !product)
    return (
      <ErrorState
        title="Product not found"
        message="This product may have been removed."
        onRetry={() => refetch()}
      />
    );

  const minQty = product.min_order_qty || 1;
  const outOfStock = product.inventory_count <= 0;
  const wishlisted = !!wishlistItemId;

  const setQuantity = (n: number) =>
    setQty(Math.max(minQty, Math.min(n, product.inventory_count || n)));

  const toggleWishlist = () => {
    if (wishlistItemId) removeFromWishlist.mutate(wishlistItemId);
    else addToWishlist.mutate(product.id);
  };

  // Gallery: dedupe the primary image with the images array, resolving each
  // (possibly relative) media URL to an absolute backend URL.
  const gallery = (() => {
    const urls: string[] = [];
    const push = (raw?: string | null) => {
      const u = mediaUrl(raw);
      if (u && !urls.includes(u)) urls.push(u);
    };
    push(product.primary_image_url);
    (product.images ?? []).forEach((img) => push(img.url));
    return urls;
  })();
  const currentImage = gallery[activeImage] ?? gallery[0];

  const category =
    typeof product.attributes?.category === "string"
      ? product.attributes.category
      : undefined;

  // Specifications: every attribute except the category (shown as a badge).
  const specs = Object.entries(product.attributes ?? {})
    .filter(
      ([key, value]) =>
        key !== "category" &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== "",
    )
    .map(([key, value]) => [key, String(value)] as const);

  const reviews = reviewsQuery.data ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/buyer/products" className="hover:text-foreground">
          Marketplace
        </Link>
        <span>/</span>
        {category && (
          <>
            <span>{titleCase(category)}</span>
            <span>/</span>
          </>
        )}
        <span className="truncate font-medium text-foreground">
          {product.name}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[330px_minmax(0,1fr)]">
        {/* Gallery */}
        <div className="flex flex-col gap-3 lg:h-full">
          <Card className="mx-auto w-full max-w-[330px] overflow-hidden lg:flex-1">
            <div className="relative aspect-square bg-muted lg:aspect-auto lg:h-full">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  sizes="330px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Package className="size-16" />
                </div>
              )}
            </div>
          </Card>

          {gallery.length > 1 && (
            <div className="mx-auto flex max-w-[330px] flex-wrap gap-2">
              {gallery.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative size-16 overflow-hidden rounded-lg border bg-muted transition",
                    i === activeImage
                      ? "ring-2 ring-brand ring-offset-2"
                      : "hover:opacity-80",
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="space-y-5">
          <div className="space-y-2">
            {category && (
              <Badge variant="gold" className="font-normal">
                {titleCase(category)}
              </Badge>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>SKU: {product.sku}</span>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Stars value={Math.round(avgRating)} />
                  {avgRating.toFixed(1)} ({reviews.length})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <Price value={product.price} compareAt={product.mrp} size="xl" />
            {outOfStock ? (
              <Badge variant="danger">Out of stock</Badge>
            ) : product.inventory_count <= 10 ? (
              <Badge variant="warning">
                Only {product.inventory_count} left
              </Badge>
            ) : (
              <Badge variant="success">In stock</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              Available:{" "}
              <span className="font-medium text-foreground">
                {product.inventory_count} units
              </span>
            </span>
            <span className="text-muted-foreground">
              Min. order:{" "}
              <span className="font-medium text-foreground">{minQty}</span>
            </span>
          </div>

          {/* Quantity stepper */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Quantity</p>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-r-none"
                  disabled={qty <= minQty}
                  onClick={() => setQuantity(qty - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-12 text-center text-sm font-medium tabular-nums">
                  {qty}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-l-none"
                  disabled={outOfStock || qty >= product.inventory_count}
                  onClick={() => setQuantity(qty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Subtotal:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(parseFloat(product.price) * qty)}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="brand"
              disabled={outOfStock}
              loading={addToCart.isPending}
              onClick={() =>
                addToCart.mutate({ productId: product.id, quantity: qty })
              }
            >
              <ShoppingCart className="size-4" /> Add to cart
            </Button>
            <Button
              variant="outline"
              aria-pressed={wishlisted}
              onClick={toggleWishlist}
            >
              <Heart
                className={cn(
                  "size-4 transition-colors",
                  wishlisted && "fill-red-500 text-red-500",
                )}
              />
              {wishlisted ? "Saved" : "Wishlist"}
            </Button>
          </div>

          <Button asChild variant="ghost" size="sm" className="justify-start px-0 text-muted-foreground">
            <Link href={`/buyer/products?seller=${product.seller}`}>
              <Store className="size-4" /> View seller storefront
            </Link>
          </Button>
        </div>
      </div>

      {/* Description & specifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        {product.description && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className={cn(!product.description && "lg:col-span-3")}>
          <CardHeader>
            <CardTitle className="text-base">Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            {specs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No specifications provided.
              </p>
            ) : (
              <dl className="divide-y text-sm">
                {specs.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0"
                  >
                    <dt className="text-muted-foreground">
                      {titleCase(key.replace(/_/g, " "))}
                    </dt>
                    <dd className="text-right font-medium text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Reviews{reviews.length ? ` (${reviews.length})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reviewsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Be the first to review this product."
                className="border-0 bg-transparent py-10"
              />
            ) : (
              <div className="divide-y">
                {reviews.map((r) => (
                  <div key={r.id} className="flex gap-3 py-4 first:pt-0">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-brand/10 text-xs text-brand">
                        {(r.title || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {r.title}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                      <Stars value={r.rating} />
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Write a review</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((v) => addReview.mutate(v))}
              className="space-y-4"
            >
              <Field
                label="Rating"
                required
                error={form.formState.errors.rating?.message}
              >
                <Select
                  value={String(form.watch("rating"))}
                  onValueChange={(v) =>
                    form.setValue("rating", Number(v), {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} star{n === 1 ? "" : "s"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Title"
                required
                error={form.formState.errors.title?.message}
              >
                <Input
                  {...form.register("title")}
                  placeholder="Sum up your experience"
                />
              </Field>

              <Field
                label="Review"
                required
                error={form.formState.errors.body?.message}
              >
                <Textarea
                  {...form.register("body")}
                  placeholder="Share details about quality, delivery, etc."
                  rows={4}
                />
              </Field>

              <Button
                type="submit"
                variant="brand"
                className="w-full"
                loading={addReview.isPending}
              >
                Submit review
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
