"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Package,
  Heart,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Store,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  Zap,
  FileText,
  ListChecks,
} from "lucide-react";
import { ProductDetailSkeleton, ErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Field } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Price } from "@/components/shop/price";
import { Rating } from "@/components/shop/rating";
import { ProductRail } from "@/components/shop/product-rail";
import { MagnifierImage } from "@/components/shop/magnifier-image";
import { useProduct, useProductSearch } from "@/features/products/use-products";
import { useShopAddToCart } from "@/features/cart/use-shop-cart";
import { useCart, useRemoveCartItem } from "@/features/cart/use-cart";
import { useGuestCart } from "@/stores/guest-cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useUiStore } from "@/stores/ui-store";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "@/features/wishlist/use-wishlist";
import { productService } from "@/services";
import { qk } from "@/lib/query-keys";
import { ApiError } from "@/lib/axios";
import { reviewSchema } from "@/lib/validations";
import { formatDate, titleCase, mediaUrl, cn } from "@/lib/utils";
import type { z } from "zod";
import type { Product } from "@/types";

type ReviewInput = z.infer<typeof reviewSchema>;

function SimilarProducts({ category, excludeId }: { category?: string; excludeId: string }) {
  const { data, isLoading } = useProductSearch({
    category,
    page: 1,
    page_size: 12,
  });
  const products = (data?.results ?? []).filter((p) => p.id !== excludeId);
  if (!isLoading && products.length === 0) return null;
  return (
    <ProductRail
      title="Similar products"
      products={products}
      viewAllHref={category ? `/products?category=${encodeURIComponent(category)}` : "/products"}
      loading={isLoading}
    />
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { isAuthenticated, role } = useAuth();
  const openAuth = useUiStore((s) => s.openAuth);
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const { add, isPending: adding } = useShopAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: wishlist } = useWishlist();
  const { data: cart } = useCart();
  const removeCartItem = useRemoveCartItem();
  const guestItems = useGuestCart((s) => s.items);
  const guestRemove = useGuestCart((s) => s.remove);
  const cartItemId = (cart?.items ?? []).find(
    (i) => i.product === product?.id,
  )?.id;
  const inCart = isAuthenticated
    ? !!cartItemId
    : guestItems.some((i) => i.productId === product?.id);

  const removeFromCart = () => {
    if (isAuthenticated) {
      if (cartItemId) removeCartItem.mutate(cartItemId);
    } else if (product) {
      guestRemove(product.id);
    }
  };
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // Sticky compact bar: reveal once the main buy-box scrolls out of view.
  const heroRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product?.id]);

  const wishlistItemId = useMemo(() => {
    return (wishlist ?? []).find((w) => {
      const pid = typeof w.product === "string" ? w.product : w.product.id;
      return pid === id;
    })?.id;
  }, [wishlist, id]);

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

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><ProductDetailSkeleton /></div>;
  if (isError || !product)
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState
          title="Product not found"
          message="This product may have been removed."
          onRetry={() => refetch()}
        />
      </div>
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

  const buyNow = () => {
    add(product, qty);
    router.push("/cart");
  };

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

  const canReview = isAuthenticated && role === "buyer";

  return (
    <>
      {/* Sticky compact bar — collapses the hero (image, title, price, qty,
          actions) into a single row once you scroll past it. Kept OUT of the
          content flow so it doesn't push the breadcrumb down. */}
      <div
        aria-hidden={!showBar}
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b border-brand/15 bg-card shadow-[0_12px_28px_-10px_rgba(30,58,107,0.35)] transition-all duration-[600ms] ease-in-out lg:top-16 lg:z-30",
          showBar
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-3.5 lg:px-8">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border bg-muted shadow-sm sm:size-14">
            {currentImage ? (
              <Image src={currentImage} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <Package className="size-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
              {product.name}
            </p>
            <div className="flex items-center gap-2">
              <Price value={product.price} compareAt={product.mrp} size="sm" />
              {outOfStock && (
                <Badge variant="danger" className="hidden sm:inline-flex">
                  Out of stock
                </Badge>
              )}
            </div>
          </div>

          {!outOfStock && (
            <div className="hidden items-center rounded-lg border md:inline-flex">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-r-none"
                disabled={qty <= minQty}
                onClick={() => setQuantity(qty - 1)}
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium tabular-nums">
                {qty}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-l-none"
                disabled={qty >= product.inventory_count}
                onClick={() => setQuantity(qty + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="group/barcart"
              disabled={outOfStock}
              loading={adding || removeCartItem.isPending}
              onClick={() => (inCart ? removeFromCart() : add(product, qty))}
            >
              {inCart ? (
                <>
                  <ShoppingCart className="size-4 fill-current group-hover/barcart:hidden" />
                  <Trash2 className="hidden size-4 group-hover/barcart:block" />
                  <span className="hidden sm:inline">
                    <span className="group-hover/barcart:hidden">Added</span>
                    <span className="hidden group-hover/barcart:inline">Remove</span>
                  </span>
                </>
              ) : (
                <>
                  <ShoppingCart className="size-4" />
                  <span className="hidden sm:inline">Add to cart</span>
                </>
              )}
            </Button>
            <Button
              variant="brand"
              size="sm"
              disabled={outOfStock}
              onClick={buyNow}
            >
              <Zap className="size-4" />
              <span className="hidden sm:inline">Buy now</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          All products
        </Link>
        {category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link
              href={`/products?category=${encodeURIComponent(category)}`}
              className="hover:text-foreground"
            >
              {titleCase(category)}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="truncate font-medium text-foreground">{product.name}</span>
        </nav>

        <div className="space-y-10">
        <div
        ref={heroRef}
        className="grid items-start gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]"
      >
        {/* Gallery */}
        <div className="flex gap-3 lg:sticky lg:top-36 lg:self-start">
          {gallery.length > 1 && (
            <div className="flex flex-col gap-2">
              {gallery.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-xl border bg-muted transition",
                    i === activeImage
                      ? "ring-2 ring-brand ring-offset-2"
                      : "hover:opacity-80",
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="flex-1">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              {currentImage ? (
                <MagnifierImage src={currentImage} alt={product.name} />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Package className="size-16" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buy box */}
        <div className="space-y-5">
          <div className="space-y-2">
            <h1
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {category && (
                <Link
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className="shrink-0"
                >
                  <Badge variant="info" className="font-normal">
                    {titleCase(category)}
                  </Badge>
                </Link>
              )}
              <span>SKU: {product.sku}</span>
              {(product.review_count ?? reviews.length) > 0 && (
                <Rating
                  value={product.rating_avg ?? avgRating}
                  count={product.review_count ?? reviews.length}
                  showValue
                />
              )}
            </div>
          </div>

          {/* Purchase panel — price, stock, quantity and actions grouped into
              one block so the buy area has no floaty vacant space. */}
          <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-card sm:p-5">
          <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
            {/* Left: price, stock, availability and quantity */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
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

              {!outOfStock && (
                <div className="flex items-center gap-2.5">
                  <span className="text-sm text-muted-foreground">Qty</span>
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
                      disabled={qty >= product.inventory_count}
                      onClick={() => setQuantity(qty + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: live order summary — fills the panel's right side */}
            {!outOfStock && (
              <div className="rounded-xl border bg-muted/30 px-3.5 py-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Order summary
                </p>
                <dl className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Unit price</dt>
                    <dd className="font-medium text-foreground">
                      <Price value={product.price} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Quantity</dt>
                    <dd className="font-medium tabular-nums text-foreground">
                      {qty}
                    </dd>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between border-t pt-1.5">
                    <dt className="font-semibold text-foreground">Subtotal</dt>
                    <dd className="text-base font-bold text-foreground">
                      <Price value={parseFloat(product.price) * qty} />
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
            <Truck className="size-4 shrink-0 text-teal" />
            <span>Free tracked delivery · Dispatched in 1–2 business days</span>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="group/cart flex-1"
              disabled={outOfStock}
              loading={adding || removeCartItem.isPending}
              onClick={() => (inCart ? removeFromCart() : add(product, qty))}
            >
              {inCart ? (
                <>
                  <ShoppingCart className="size-4 fill-current group-hover/cart:hidden" />
                  <Trash2 className="hidden size-4 group-hover/cart:block" />
                  <span className="group-hover/cart:hidden">Added</span>
                  <span className="hidden group-hover/cart:inline">
                    Remove from cart
                  </span>
                </>
              ) : (
                <>
                  <ShoppingCart className="size-4" /> Add to cart
                </>
              )}
            </Button>
            <Button
              variant="brand"
              size="lg"
              className="flex-1"
              disabled={outOfStock}
              onClick={buyNow}
            >
              <Zap className="size-4" /> Buy now
            </Button>
            {isAuthenticated && (
              <Button
                variant="outline"
                size="lg"
                aria-pressed={wishlisted}
                onClick={toggleWishlist}
                aria-label="Wishlist"
              >
                <Heart
                  className={cn(
                    "size-5 transition-colors",
                    wishlisted && "fill-rose-500 text-rose-500",
                  )}
                />
              </Button>
            )}
          </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-card/50 p-3 text-center">
            {[
              { icon: Truck, t: "Tracked delivery", tint: "bg-teal/10 text-teal" },
              {
                icon: ShieldCheck,
                t: "Secure payment",
                tint: "bg-success/10 text-success",
              },
              {
                icon: RotateCcw,
                t: "Verified seller",
                tint: "bg-warning/10 text-warning",
              },
            ].map((f) => (
              <div key={f.t} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full",
                    f.tint,
                  )}
                >
                  <f.icon className="size-5" />
                </span>
                <span className="text-xs text-muted-foreground">{f.t}</span>
              </div>
            ))}
          </div>

          {/* Sold by — seller storefront identity */}
          <div className="flex items-center gap-3 rounded-2xl border bg-card/50 p-3">
            <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border bg-muted">
              {product.seller_logo_url ? (
                <Image
                  src={mediaUrl(product.seller_logo_url) ?? product.seller_logo_url}
                  alt={product.seller_name ?? "Seller"}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <Store className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Sold by</p>
              <p className="truncate text-sm font-semibold text-foreground">
                {product.seller_name || "Verified seller"}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link
                href={
                  product.seller_name
                    ? `/products?brand=${encodeURIComponent(product.seller_name)}`
                    : "/products"
                }
              >
                Visit store
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Description & specs */}
      <div className="space-y-6">
        {product.description && (
          <Card className="overflow-hidden shadow-card">
            <CardHeader className="flex-row items-center gap-3 space-y-0 border-b bg-gradient-to-r from-success/15 to-transparent py-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success ring-1 ring-success/20">
                <FileText className="size-[1.15rem]" />
              </span>
              <CardTitle className="text-base font-semibold text-success">
                Product description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden shadow-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b bg-gradient-to-r from-teal/10 to-transparent py-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal/15 text-teal ring-1 ring-teal/20">
              <ListChecks className="size-[1.15rem]" />
            </span>
            <CardTitle className="text-base font-semibold">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {specs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No specifications provided.
              </p>
            ) : (
              <dl className="grid grid-cols-1 gap-x-10 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {specs.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5"
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

        {/* Return & exchange policy */}
        <Card className="overflow-hidden shadow-card">
          <CardHeader className="flex-row items-center gap-3 space-y-0 border-b bg-gradient-to-r from-warning/10 to-transparent py-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning ring-1 ring-warning/20">
              <RotateCcw className="size-[1.15rem]" />
            </span>
            <CardTitle className="text-base font-semibold">
              Return &amp; exchange policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            {product.is_returnable ? (
              <p className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-success" />
                <span>
                  Easy returns within{" "}
                  <span className="font-semibold text-foreground">
                    {product.return_window_days ?? 7} days
                  </span>{" "}
                  of delivery.
                </span>
              </p>
            ) : (
              <p>This item is not eligible for return.</p>
            )}
            {product.is_exchangeable && (
              <p className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-teal" />
                <span>Exchange available within the return window.</span>
              </p>
            )}
            {product.return_policy_note && (
              <p className="whitespace-pre-line border-t pt-2">
                {product.return_policy_note}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Ratings &amp; reviews{reviews.length ? ` (${reviews.length})` : ""}
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
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                      <Rating value={r.rating} />
                      <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
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
            {!canReview ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {isAuthenticated
                    ? "Only buyers can review products."
                    : "Sign in to share your experience with this product."}
                </p>
                {!isAuthenticated && (
                  <Button
                    variant="brand"
                    className="w-full"
                    onClick={() => openAuth("login", `/products/${id}`)}
                  >
                    Sign in to review
                  </Button>
                )}
              </div>
            ) : (
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
                      form.setValue("rating", Number(v), { shouldValidate: true })
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Similar products */}
      <SimilarProducts category={category} excludeId={id} />
        </div>
      </div>
    </>
  );
}
