"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  PackageSearch,
  Star,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/states";
import { Pagination } from "@/components/shared/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shop/product-card";
import {
  useProductSearch,
  useCategories,
  useBrands,
} from "@/features/products/use-products";
import { useWishlist } from "@/features/wishlist/use-wishlist";
import { useDebounce } from "@/hooks/use-debounce";
import { cn, titleCase } from "@/lib/utils";
import type { ProductSort } from "@/services";
import type { Product } from "@/types";

const PAGE_SIZE = 24;

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Customer Rating" },
  { value: "discount_desc", label: "Discount" },
  { value: "newest", label: "Newest first" },
];

const RATING_OPTIONS = [4, 3, 2] as const;

function FilterPanel({
  categories,
  selectedCategories,
  toggleCategory,
  clearCategories,
  brands,
  brand,
  setBrand,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  minRating,
  setMinRating,
  inStock,
  setInStock,
  onClear,
  hasFilters,
}: {
  categories: { category: string; count?: number }[];
  selectedCategories: string[];
  toggleCategory: (c: string) => void;
  clearCategories: () => void;
  brands: { brand: string; count?: number }[];
  brand: string;
  setBrand: (v: string) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  inStock: boolean;
  setInStock: (v: boolean) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Filters
        </p>
        {hasFilters && (
          <button
            onClick={onClear}
            className="group inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 py-1 pl-2 pr-2.5 text-xs font-semibold text-brand transition-colors hover:border-brand/40 hover:bg-brand/10"
          >
            <X className="size-3.5 transition-transform group-hover:rotate-90" />
            Clear all
          </button>
        )}
      </div>

      {/* Category (multi-select) */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Category</p>
        <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1 scrollbar-thin">
          <button
            onClick={clearCategories}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
              selectedCategories.length === 0 &&
                "bg-accent font-semibold text-brand",
            )}
          >
            All categories
          </button>
          {categories.map((c) => {
            const checked = selectedCategories.includes(c.category);
            return (
              <button
                key={c.category}
                onClick={() => toggleCategory(c.category)}
                aria-pressed={checked}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                  checked && "bg-accent font-semibold text-brand",
                )}
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                    checked
                      ? "border-brand bg-brand text-white"
                      : "border-border",
                  )}
                >
                  {checked && <Check className="size-3" />}
                </span>
                <span className="flex-1 truncate">{titleCase(c.category)}</span>
                {c.count !== undefined && (
                  <span className="ml-1 shrink-0 text-xs text-muted-foreground">
                    {c.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Brand</p>
          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1 scrollbar-thin">
            <button
              onClick={() => setBrand("")}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                !brand && "bg-accent font-semibold text-brand",
              )}
            >
              All brands
            </button>
            {brands.map((b) => (
              <button
                key={b.brand}
                onClick={() => setBrand(b.brand)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                  brand === b.brand && "bg-accent font-semibold text-brand",
                )}
              >
                <span className="truncate">{titleCase(b.brand)}</span>
                {b.count !== undefined && (
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    {b.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Price range</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Min"
            className="h-9"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Max"
            className="h-9"
          />
        </div>
      </div>

      {/* Customer rating */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Customer rating</p>
        <div className="space-y-0.5">
          {RATING_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                minRating === r && "bg-accent font-semibold text-brand",
              )}
            >
              <span className="inline-flex items-center gap-1 rounded-sm bg-success px-1.5 py-0.5 text-xs font-semibold text-success-foreground">
                {r}
                <Star className="size-3 fill-current" />
              </span>
              <span>&amp; above</span>
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Availability</p>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="size-4 rounded border-input text-brand accent-[hsl(var(--brand))]"
          />
          In stock only
        </label>
      </div>
    </div>
  );
}

function CatalogContent() {
  const urlParams = useSearchParams();
  const urlQ = urlParams.get("q") ?? "";
  const urlCat = urlParams.get("category") ?? "";
  const urlBrand = urlParams.get("brand") ?? "";

  const [search, setSearch] = useState(urlQ);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    urlCat ? urlCat.split(",").filter(Boolean) : [],
  );
  const [brand, setBrand] = useState(urlBrand);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<ProductSort>("relevance");
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);

  // Keep in sync with header search / category nav (which change the URL).
  useEffect(() => {
    setSearch(urlQ);
    setPage(1);
  }, [urlQ]);
  useEffect(() => {
    setSelectedCategories(urlCat ? urlCat.split(",").filter(Boolean) : []);
    setPage(1);
  }, [urlCat]);
  // Deep-link from a seller's "Visit store": pre-select their brand filter.
  useEffect(() => {
    setBrand(urlBrand);
    setPage(1);
  }, [urlBrand]);

  const catParam = selectedCategories.join(",");
  const toggleCategory = (c: string) =>
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  const clearCategories = () => setSelectedCategories([]);

  const debouncedSearch = useDebounce(search, 350);
  const debouncedMin = useDebounce(priceMin, 350);
  const debouncedMax = useDebounce(priceMax, 350);

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: wishlist } = useWishlist();

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
      category: catParam || undefined,
      brand: brand || undefined,
      price_min: debouncedMin ? Number(debouncedMin) : undefined,
      price_max: debouncedMax ? Number(debouncedMax) : undefined,
      min_rating: minRating || undefined,
      in_stock: inStock || undefined,
      sort,
      page,
      page_size: PAGE_SIZE,
    }),
    [
      debouncedSearch,
      catParam,
      brand,
      debouncedMin,
      debouncedMax,
      minRating,
      inStock,
      sort,
      page,
    ],
  );

  const { data, isLoading, isError, refetch } = useProductSearch(params);

  const hasFilters =
    !!search ||
    selectedCategories.length > 0 ||
    !!brand ||
    !!priceMin ||
    !!priceMax ||
    minRating > 0 ||
    inStock;

  const resetFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setBrand("");
    setPriceMin("");
    setPriceMax("");
    setMinRating(0);
    setInStock(false);
    setPage(1);
  };

  // Reset to page 1 when any filter (not the page) changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedMin, debouncedMax, minRating, inStock, catParam, brand, sort]);

  const results = data?.results ?? [];
  const total = data?.count ?? results.length;
  // Ensure the active brand (e.g. deep-linked from a seller store) is always
  // present in the list so it renders as selected even if it has no facet count.
  const brandList = brands ?? [];
  const mergedBrands =
    brand && !brandList.some((b) => b.brand === brand)
      ? [{ brand }, ...brandList]
      : brandList;
  const filterProps = {
    categories: categories ?? [],
    selectedCategories,
    toggleCategory,
    clearCategories,
    brands: mergedBrands,
    brand,
    setBrand,
    priceMin,
    setPriceMin,
    priceMax,
    setPriceMax,
    minRating,
    setMinRating,
    inStock,
    setInStock,
    onClear: resetFilters,
    hasFilters,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Title + search */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">
          {selectedCategories.length === 1
            ? titleCase(selectedCategories[0])
            : search
              ? `Results for “${search}”`
              : "All products"}
        </h1>
        <div className="relative mt-3 max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-10 pl-10"
          />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-36 rounded-2xl border bg-card p-5 shadow-card">
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        {/* Results */}
        <div className="space-y-4">
          {/* Result bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileFilters((v) => !v)}
              >
                <SlidersHorizontal className="size-4" /> Filters
              </Button>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading…" : `${total} product${total === 1 ? "" : "s"}`}
              </p>
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as ProductSort)}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    Sort: {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile filter panel */}
          {mobileFilters && (
            <div className="rounded-2xl border bg-card p-5 shadow-card lg:hidden">
              <FilterPanel {...filterProps} />
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-5 w-1/3" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <ErrorState title="Couldn't load products" onRetry={() => refetch()} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {results.map((p: Product) => (
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
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <CatalogContent />
    </Suspense>
  );
}
