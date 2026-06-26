"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Search, Heart, ShoppingCart, Package, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useProductSearch,
  useCategories,
} from "@/features/products/use-products";
import { useAddToCart } from "@/features/cart/use-cart";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "@/features/wishlist/use-wishlist";
import { cn, formatCurrency, titleCase, mediaUrl } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { Product } from "@/types";

const ALL_CATEGORIES = "__all__";
const PRODUCTS_PER_PAGE = 10;

function ProductCard({
  product,
  wishlistItemId,
}: {
  product: Product;
  wishlistItemId?: string;
}) {
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const outOfStock = product.inventory_count <= 0;
  const wishlisted = !!wishlistItemId;

  const toggleWishlist = () => {
    if (wishlistItemId) removeFromWishlist.mutate(wishlistItemId);
    else addToWishlist.mutate(product.id);
  };

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-elevated">
      <Link
        href={`/buyer/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {mediaUrl(product.primary_image_url) ? (
          <Image
            src={mediaUrl(product.primary_image_url)!}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="size-10" />
          </div>
        )}
        {outOfStock && (
          <span className="absolute left-2 top-2">
            <Badge variant="danger">Out of stock</Badge>
          </span>
        )}
      </Link>

      <CardContent className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex-1">
          <Link href={`/buyer/products/${product.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors hover:text-brand">
              {product.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            SKU: {product.sku}
          </p>
        </div>
        <p className="text-base font-semibold tracking-tight text-foreground">
          {formatCurrency(product.price)}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <Button
            variant="brand"
            size="sm"
            className="flex-1"
            disabled={outOfStock}
            loading={addToCart.isPending}
            onClick={() =>
              addToCart.mutate({
                productId: product.id,
                quantity: product.min_order_qty || 1,
              })
            }
          >
            <ShoppingCart className="size-4" />
            Add
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            onClick={toggleWishlist}
          >
            <Heart
              className={cn(
                "size-4 transition-colors",
                wishlisted && "fill-red-500 text-red-500",
              )}
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BuyerProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [inStock, setInStock] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 350);
  const debouncedMin = useDebounce(priceMin, 350);
  const debouncedMax = useDebounce(priceMax, 350);

  const { data: categories } = useCategories();
  const { data: wishlist } = useWishlist();

  // productId -> wishlist item id, so cards know which products are saved.
  const wishlistMap = useMemo(() => {
    const m = new Map<string, string>();
    (wishlist ?? []).forEach((w) => {
      const pid = typeof w.product === "string" ? w.product : w.product.id;
      m.set(pid, w.id);
    });
    return m;
  }, [wishlist]);

  const params = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      category: category === ALL_CATEGORIES ? undefined : category,
      price_min: debouncedMin ? Number(debouncedMin) : undefined,
      price_max: debouncedMax ? Number(debouncedMax) : undefined,
      in_stock: inStock || undefined,
      page,
      page_size: PRODUCTS_PER_PAGE,
    }),
    [debouncedSearch, category, debouncedMin, debouncedMax, inStock, page],
  );

  const { data, isLoading, isError, refetch } = useProductSearch(params);

  const resetFilters = () => {
    setSearch("");
    setCategory(ALL_CATEGORIES);
    setPriceMin("");
    setPriceMax("");
    setInStock(false);
    setPage(1);
  };

  const hasFilters =
    !!search ||
    category !== ALL_CATEGORIES ||
    !!priceMin ||
    !!priceMax ||
    inStock;

  const results = data?.results ?? [];

  // Reset to page 1 whenever a filter (not the page itself) changes.
  const onFilterChange = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Browse Marketplace"
        description="Discover verified B2B products from sellers across NEPA."
      />

      {/* Compact filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-[28rem]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onFilterChange(() => setSearch(e.target.value))}
            placeholder="Search products…"
            className="h-9 pl-9"
          />
        </div>

        <Select
          value={category}
          onValueChange={(v) => onFilterChange(() => setCategory(v))}
        >
          <SelectTrigger className="h-9 w-full sm:w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.category} value={c.category}>
                {titleCase(c.category)}
                {c.count !== undefined ? ` (${c.count})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          inputMode="decimal"
          min={0}
          value={priceMin}
          onChange={(e) => onFilterChange(() => setPriceMin(e.target.value))}
          placeholder="Min $"
          className="h-9 w-32"
        />
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          value={priceMax}
          onChange={(e) => onFilterChange(() => setPriceMax(e.target.value))}
          placeholder="Max $"
          className="h-9 w-32"
        />

        <Button
          type="button"
          variant={inStock ? "brand" : "outline"}
          className="h-9"
          onClick={() => onFilterChange(() => setInStock(!inStock))}
        >
          In stock
        </Button>

        {/* Always rendered so the bar never reflows; hidden until a filter is active. */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 text-muted-foreground",
            !hasFilters && "invisible",
          )}
          onClick={resetFilters}
          aria-hidden={!hasFilters}
          tabIndex={hasFilters ? 0 : -1}
        >
          <X className="size-4" /> Clear
        </Button>
      </div>

      {/* Results */}
      <section className="space-y-4">
          {isLoading ? (
            <CardGridSkeleton count={PRODUCTS_PER_PAGE} />
          ) : isError ? (
            <EmptyState
              icon={Package}
              title="Couldn't load products"
              description="Please try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No products found"
              description="Try adjusting your search or filters."
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {data?.count ?? results.length} product
                {(data?.count ?? results.length) === 1 ? "" : "s"} found
              </p>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {results.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    wishlistItemId={wishlistMap.get(p.id)}
                  />
                ))}
              </div>
              {data && data.count > data.page_size && (
                <Pagination
                  page={data.page}
                  pageSize={data.page_size}
                  total={data.count}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </section>
    </div>
  );
}
