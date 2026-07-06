"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, Sparkles, Star } from "lucide-react";
import {
  useCategories,
  useProductSearch,
} from "@/features/products/use-products";
import { ErrorState } from "@/components/shared/states";
import { cn, mediaUrl, titleCase } from "@/lib/utils";
import type { Category } from "@/types";

/** Name-relevant covers downloaded into /public/collections (lowercase key). */
const CATEGORY_IMAGES: Record<string, string> = {
  accessories: "/collections/accessories.jpg",
  beverages: "/collections/beverages.jpg",
  "baked goods": "/collections/baked-goods.jpg",
  "cleaning supplies": "/collections/cleaning-supplies.jpg",
  "cutting tools": "/collections/cutting-tools.jpg",
  "art supplies": "/collections/art-supplies.jpg",
  "books & textbooks": "/collections/books-textbooks.jpg",
  dairy: "/collections/dairy.jpg",
  "bulk food": "/collections/bulk-food.jpg",
  detergents: "/collections/detergents.jpg",
  amenities: "/collections/amenities.jpg",
  consumables: "/collections/consumables.jpg",
  conveyors: "/collections/conveyors.jpg",
  "concrete & masonry": "/collections/concrete-masonry.jpg",
  components: "/collections/components.jpg",
  "circuit boards": "/collections/circuit-boards.jpg",
  "cables & adapters": "/collections/cables-adapters.jpg",
  "batteries & power": "/collections/batteries-power.jpg",
  displays: "/collections/displays.jpg",
  diagnostics: "/collections/diagnostics.jpg",
  brakes: "/collections/brakes.jpg",
  // Covers for the "More collections" list (name-matched downloads).
  "industrial supplies": "/collections/industrial-supplies.jpg",
  "personal care": "/collections/personal-care.jpg",
  electrical: "/collections/electrical.jpg",
  "body & exterior": "/collections/body-exterior.jpg",
  "boilers & steam": "/collections/boilers-steam.jpg",
  "books & references": "/collections/books-references.jpg",
  "building materials": "/collections/building-materials.jpg",
  "cables & connectors": "/collections/cables-connectors.jpg",
  "buttons & zippers": "/collections/buttons-zippers.jpg",
  "electrical supplies": "/collections/electrical-supplies.jpg",
  enclosures: "/collections/enclosures.jpg",
  "cleaning products": "/collections/cleaning-products.jpg",
  "cloud services": "/collections/cloud-services.jpg",
  "display & fixtures": "/collections/display-fixtures.jpg",
  electronics: "/collections/electronics.jpg",
  "engine parts": "/collections/engine-parts.jpg",
  equipment: "/collections/equipment.jpg",
  fabrics: "/collections/fabrics.jpg",
  fasteners: "/collections/fasteners.jpg",
  furniture: "/collections/furniture.jpg",
};

/** Short, friendly descriptor shown under a collection name in the list. */
function tagline(category: string, count?: number) {
  if (count && count > 0) return `${count} ${count === 1 ? "item" : "items"} in stock`;
  return `Explore the ${titleCase(category).toLowerCase()} range`;
}

/** Three different 2-row bento patterns (each tiles a 6-col × 2-row block). */
const SECTIONS: { title: string; pattern: string[]; cats: string[] }[] = [
  {
    title: "Most shopped",
    pattern: [
      "lg:col-span-2 lg:row-span-2",
      "lg:row-span-2",
      "lg:col-span-2",
      "",
      "",
      "",
      "",
    ],
    cats: [
      "Accessories",
      "Beverages",
      "Baked Goods",
      "Cleaning Supplies",
      "Cutting Tools",
      "Art Supplies",
      "Books & Textbooks",
    ],
  },
  {
    title: "Food & facilities",
    pattern: [
      "lg:col-span-2",
      "lg:col-span-2 lg:row-span-2",
      "",
      "lg:row-span-2",
      "",
      "",
      "",
    ],
    cats: [
      "Dairy",
      "Bulk Food",
      "Detergents",
      "Amenities",
      "Consumables",
      "Conveyors",
      "Concrete & Masonry",
    ],
  },
  {
    title: "Electronics & auto",
    pattern: [
      "",
      "lg:col-span-2",
      "lg:row-span-2",
      "lg:col-span-2 lg:row-span-2",
      "",
      "",
      "",
    ],
    cats: [
      "Components",
      "Circuit Boards",
      "Cables & Adapters",
      "Batteries & Power",
      "Displays",
      "Diagnostics",
      "Brakes",
    ],
  },
];

/** Name-matched static cover, if we downloaded one for this category. */
function staticCover(category: string) {
  return CATEGORY_IMAGES[category.toLowerCase()] ?? null;
}

/** One real product image for a category (only used as a fallback). */
function useCover(category: string) {
  const { data } = useProductSearch({ category, page: 1, page_size: 1 });
  const product = data?.results?.[0];
  return product ? mediaUrl(product.primary_image_url) : null;
}

/**
 * Vertical, seamless auto-scroll list. Children are rendered twice so the loop
 * is invisible. It pauses on hover/touch, still scrolls manually, hides its
 * scrollbar, and respects reduced-motion.
 */
/**
 * Rows report which category the pointer is over through this context, so the
 * list can decide *when* that hover should actually commit to a selection
 * (immediately on a plain hover, but only 1s after a manual scroll settles).
 */
const RowHoverContext = createContext<((category: string) => void) | null>(null);

/** Delay after a manual scroll stops before the hovered row is selected. */
const SELECT_AFTER_SCROLL_MS = 1000;
/** Delay on a plain hover before the row's image reflects on the left. */
const HOVER_SELECT_MS = 500;

function AutoScrollList({
  children,
  onSelect,
}: {
  children: ReactNode;
  onSelect: (category: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  // True while the user is actively dragging the scrollbar / wheeling. Selection
  // is frozen during this window so the image on the left doesn't flicker as
  // rows stream past the pointer.
  const manualScrolling = useRef(false);
  const hovered = useRef<string | null>(null);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = (t: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (t.current) {
      clearTimeout(t.current);
      t.current = null;
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const SPEED = 0.35; // px per 16ms frame — slow, ambient drift

    // Which row sits nearest the list's vertical centre right now.
    const centreCategory = (): string | null => {
      const box = el.getBoundingClientRect();
      const centreY = box.top + box.height / 2;
      let best: string | null = null;
      let bestDist = Infinity;
      el.querySelectorAll<HTMLElement>("[data-cat]").forEach((r) => {
        const rb = r.getBoundingClientRect();
        const d = Math.abs(rb.top + rb.height / 2 - centreY);
        if (d < bestDist) {
          bestDist = d;
          best = r.dataset.cat ?? null;
        }
      });
      return best;
    };

    let raf = 0;
    let last = 0;
    let lastAutoSel = 0;
    let lastAutoCat: string | null = null;
    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      if (paused.current) {
        last = t;
        return;
      }
      const dt = last ? t - last : 16;
      last = t;
      const half = el.scrollHeight / 2;
      if (half > 0) {
        let next = el.scrollTop + SPEED * (dt / 16);
        if (next >= half) next -= half;
        el.scrollTop = next;
      }
      // As rows drift past, auto-select whichever now sits at the centre so the
      // left image follows along (throttled; only fires when it changes).
      if (t - lastAutoSel > 250) {
        lastAutoSel = t;
        const cat = centreCategory();
        if (cat && cat !== lastAutoCat) {
          lastAutoCat = cat;
          onSelect(cat);
        }
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      clearTimer(scrollEndTimer);
      clearTimer(selectTimer);
      clearTimer(hoverTimer);
    };
  }, []);

  // A row reports the pointer is over it. On a plain hover we commit 500ms later
  // (so a quick glide-through doesn't swap the image); mid manual-scroll we only
  // remember it and commit once the scroll settles.
  const reportHover = (category: string) => {
    hovered.current = category;
    if (manualScrolling.current) return;
    clearTimer(hoverTimer);
    hoverTimer.current = setTimeout(() => onSelect(category), HOVER_SELECT_MS);
  };

  const onScroll = () => {
    const el = ref.current;
    // Auto-scroll also fires scroll events, but only while NOT paused; a scroll
    // event while paused (pointer over the list) is a genuine manual scroll.
    if (!el || !paused.current) return;

    // Keep the infinite loop seamless at both ends.
    const half = el.scrollHeight / 2;
    if (half > 0) {
      if (el.scrollTop >= half) el.scrollTop -= half;
      else if (el.scrollTop <= 0) el.scrollTop += half;
    }

    // Freeze selection while scrolling; debounce the "scroll stopped" moment.
    manualScrolling.current = true;
    clearTimer(hoverTimer);
    clearTimer(selectTimer);
    clearTimer(scrollEndTimer);
    scrollEndTimer.current = setTimeout(() => {
      manualScrolling.current = false;
      // 1s after the scroll settles, select whatever the pointer now rests on.
      selectTimer.current = setTimeout(() => {
        if (hovered.current) onSelect(hovered.current);
      }, SELECT_AFTER_SCROLL_MS);
    }, 150);
  };

  const pause = () => {
    paused.current = true;
  };
  const resume = () => {
    paused.current = false;
    manualScrolling.current = false;
    clearTimer(scrollEndTimer);
    clearTimer(selectTimer);
    clearTimer(hoverTimer);
  };

  return (
    <RowHoverContext.Provider value={reportHover}>
      <div
        ref={ref}
        onScroll={onScroll}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        className="no-scrollbar h-full overflow-y-auto overscroll-contain"
      >
        <div className="flex flex-col">
          <div className="flex flex-col gap-2.5 pb-2.5">{children}</div>
          <div aria-hidden className="flex flex-col gap-2.5 pb-2.5">
            {children}
          </div>
        </div>
      </div>
    </RowHoverContext.Provider>
  );
}

/** Presentational bento tile. */
function Tile({
  category,
  count,
  span,
  img,
}: {
  category: string;
  count?: number;
  span: string;
  img?: string | null;
}) {
  return (
    <Link
      href={`/products?category=${encodeURIComponent(category)}`}
      className={cn(
        "group relative z-0 min-h-[120px] overflow-hidden transition-all duration-200",
        "hover:z-10 hover:ring-[3px] hover:ring-inset hover:ring-teal",
        span,
      )}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={titleCase(category)}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-blush">
          <span className="text-4xl font-semibold text-teal/40">
            {titleCase(category).charAt(0)}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-colors duration-300 group-hover:from-black/80" />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <h3 className="truncate text-sm font-semibold text-white drop-shadow-sm sm:text-base">
          {titleCase(category)}
        </h3>
        {count != null && (
          <p className="text-[11px] text-white/80">
            {count} {count === 1 ? "item" : "items"}
          </p>
        )}
      </div>
    </Link>
  );
}

/** Tile that needs a product-image fallback (no static cover). */
function ProductTile(props: { category: string; count?: number; span: string }) {
  const img = useCover(props.category);
  return <Tile {...props} img={img} />;
}

/** Picks a static cover when available (no API call), else falls back. */
function MiniCard({
  category,
  count,
  span,
}: {
  category: string;
  count?: number;
  span: string;
}) {
  const staticImg = CATEGORY_IMAGES[category.toLowerCase()];
  if (staticImg)
    return <Tile category={category} count={count} span={span} img={staticImg} />;
  return <ProductTile category={category} count={count} span={span} />;
}

/** Large featured panel for the bottom layout — reflects the hovered row. */
function Showcase({ category, count }: { category: string; count?: number }) {
  const productImg = useCover(category);
  const img = staticCover(category) ?? productImg;
  return (
    <Link
      href={`/products?category=${encodeURIComponent(category)}`}
      className="group relative block min-h-[320px] overflow-hidden rounded-3xl bg-blush ring-1 ring-border shadow-card lg:min-h-full"
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={category}
          src={img}
          alt={titleCase(category)}
          className="absolute inset-0 size-full animate-fade-in object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-blush">
          <span className="text-7xl font-semibold text-teal/30">
            {titleCase(category).charAt(0)}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[hsl(24_85%_82%)]">
          Featured collection
        </span>
        <h2 className="mt-2 text-3xl font-medium leading-tight text-white drop-shadow-sm sm:text-4xl">
          {titleCase(category)}
        </h2>
        <p className="mt-1 text-sm text-white/80">
          {count != null
            ? `${count} ${count === 1 ? "item" : "items"}`
            : "Explore the range"}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand transition-transform group-hover:-translate-y-0.5">
          Shop now <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function ListRow({
  category,
  count,
  active,
}: {
  category: string;
  count?: number;
  active: boolean;
}) {
  const img = staticCover(category);
  const reportHover = useContext(RowHoverContext);
  return (
    <Link
      href={`/products?category=${encodeURIComponent(category)}`}
      data-cat={category}
      onMouseEnter={() => reportHover?.(category)}
      onFocus={() => reportHover?.(category)}
      className={cn(
        "group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border p-2.5 pr-3.5 transition-all duration-200",
        active
          ? "border-teal/50 bg-teal/[0.06] shadow-[0_1px_0_rgba(0,0,0,0.02)] ring-1 ring-teal/20"
          : "border-border hover:-translate-y-px hover:border-teal/30 hover:bg-muted/40 hover:shadow-card",
      )}
    >
      {/* Active accent bar */}
      <span
        className={cn(
          "absolute inset-y-2 left-0 w-1 rounded-full bg-teal transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-blush ring-1 ring-border">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="grid size-full place-items-center bg-gradient-to-br from-blush to-teal/10 text-xl font-semibold text-teal/40">
            {titleCase(category).charAt(0)}
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {titleCase(category)}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {tagline(category, count)}
        </p>
        <span
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
            active
              ? "bg-teal/10 text-teal"
              : "bg-muted text-muted-foreground group-hover:bg-teal/10 group-hover:text-teal",
          )}
        >
          <Sparkles className="size-2.5" />
          {count && count > 0 ? "In stock" : "Browse"}
        </span>
      </div>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full transition-all",
          active
            ? "bg-teal text-white"
            : "bg-muted text-muted-foreground group-hover:bg-teal group-hover:text-white",
        )}
      >
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export default function CollectionsPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const countOf = useMemo(() => {
    const m = new Map<string, number | undefined>();
    (categories ?? []).forEach((c) => m.set(c.category.toLowerCase(), c.count));
    return m;
  }, [categories]);

  // Bottom layout uses categories NOT shown in the bento rows. Prefer the ones
  // that have a name-matched cover so the list reads as a fully-imaged rail.
  const bottomCats = useMemo<Category[]>(() => {
    const bento = new Set(
      SECTIONS.flatMap((s) => s.cats.map((x) => x.toLowerCase())),
    );
    return (categories ?? [])
      .filter((c) => !bento.has(c.category.toLowerCase()))
      .sort(
        (a, b) =>
          (b.count ?? 0) - (a.count ?? 0) ||
          (staticCover(b.category) ? 1 : 0) - (staticCover(a.category) ? 1 : 0),
      )
      .slice(0, 12);
  }, [categories]);

  // Once the big showcase image is ≥70% on screen, gently pull it fully into
  // view — but only after 2s of no further scrolling, so it never fights an
  // active scroll and only snaps when the user has settled on it.
  const bigImgRef = useRef<HTMLDivElement>(null);
  const sectionReady = !isLoading && bottomCats.length > 0;
  useEffect(() => {
    const el = bigImgRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const VISIBLE = 0.7; // recenter once ~70% of the big image is on screen
    const REST_OFFSET = 50; // rest below dead-centre so the heading isn't clipped
    let ratio = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let animating = false;
    let raf = 0;
    const clear = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    // Slow, eased (slow → fast → slow) glide that centres the big image on
    // screen, resting a little below dead-centre so the heading isn't clipped.
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const recenter = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const currentTop = window.scrollY + rect.top; // element's absolute Y
      const target = Math.max(
        0,
        currentTop - (vh - rect.height) / 2 - REST_OFFSET,
      );
      const startY = window.scrollY;
      const dist = target - startY;
      if (Math.abs(dist) < 2) return; // already centred

      animating = true; // ignore the scroll events our own glide emits
      cancelAnimationFrame(raf);
      const duration = 1300; // slow, unhurried glide
      let startT = 0;
      const tick = (now: number) => {
        if (!startT) startT = now;
        const p = Math.min(1, (now - startT) / duration);
        window.scrollTo(0, startY + dist * easeInOut(p));
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          animating = false;
        }
      };
      raf = requestAnimationFrame(tick);
    };

    // 2s after scrolling stops, if the big image is ≥70% on screen, glide it
    // back to centre — every time, in whichever direction it takes.
    const arm = () => {
      if (animating) return;
      clear();
      if (ratio < VISIBLE) return;
      timer = setTimeout(() => {
        if (ratio >= VISIBLE) recenter();
      }, 2000);
    };

    const io = new IntersectionObserver(
      (entries) => {
        ratio = entries[0].intersectionRatio;
        arm();
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 1] },
    );
    io.observe(el);

    // Any real page scroll is "movement" and resets the 2s idle countdown.
    const onMove = () => arm();
    window.addEventListener("scroll", onMove, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onMove);
      clear();
      cancelAnimationFrame(raf);
    };
  }, [sectionReady]);

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorState title="Couldn't load collections" onRetry={() => refetch()} />
      </div>
    );
  }

  const activeCat =
    bottomCats.find((c) => c.category === activeKey) ?? bottomCats[0];

  return (
    <div className="relative">
      {/* Header — blush surface, copper accents (logo-matched) */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-blush via-blush to-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-teal/10 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-[21px] sm:px-6 lg:px-8">
          <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Shop by <span className="italic text-teal">collection</span>
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Our most-shopped categories — tap any to jump into its products.
          </p>
          {categories && categories.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                <Sparkles className="size-3.5 text-teal" />
                {categories.length} collections
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Star className="size-3.5 text-teal" />
                Hand-picked covers
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Three bento sections — labelled, rounded, 2px between tiles */}
      <section className="mx-auto max-w-7xl space-y-4 px-4 pb-8 pt-3 sm:px-6 lg:px-8">
        {SECTIONS.map((s, si) => (
          <div key={si}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/80">
                {s.title}
              </h2>
              <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="overflow-hidden rounded-2xl ring-1 ring-border shadow-card">
              <div className="grid auto-rows-[150px] grid-cols-2 gap-[2px] [grid-auto-flow:dense] sm:grid-cols-3 lg:auto-rows-[190px] lg:grid-cols-6">
                {s.cats.map((cat, i) => (
                  <MiniCard
                    key={cat}
                    category={cat}
                    count={countOf.get(cat.toLowerCase())}
                    span={s.pattern[i] ?? ""}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Bottom split showcase — auto-scrolling rail of extra collections */}
      {!isLoading && bottomCats.length > 0 && activeCat && (
        <section className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Star className="size-4 text-teal" /> More collections
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Hover to pause
            </span>
          </div>
          <div className="grid gap-5 lg:h-[560px] lg:grid-cols-[1.25fr_1fr]">
            <div ref={bigImgRef} className="lg:h-full">
              <Showcase category={activeCat.category} count={activeCat.count} />
            </div>
            <div className="relative h-[440px] overflow-hidden rounded-3xl border bg-card p-2.5 shadow-card lg:h-full">
              <AutoScrollList onSelect={setActiveKey}>
                {bottomCats.map((c) => (
                  <ListRow
                    key={c.category}
                    category={c.category}
                    count={c.count}
                    active={c.category === activeCat.category}
                  />
                ))}
              </AutoScrollList>
              {/* Edge fades — top & bottom */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-3xl bg-gradient-to-b from-card to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-3xl bg-gradient-to-t from-card to-transparent" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
