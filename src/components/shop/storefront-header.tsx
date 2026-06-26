"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  User,
  LayoutDashboard,
  ChevronDown,
  Store,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandLogo, BrandWordmark } from "@/components/shared/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/features/cart/use-cart";
import { useGuestCart, guestCartCount } from "@/stores/guest-cart-store";
import { useUiStore } from "@/stores/ui-store";
import { ROLE_HOME, ROLE_LABEL, SIGNUP_URL } from "@/lib/constants";

/** Primary storefront navigation — the tab bar under the header search row. */
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "Guides", href: "/#guides" },
  { label: "FAQ", href: "/#faq" },
  { label: "Our Story", href: "/#story" },
];

/** Landing-page section ids that have a matching tab, in document order. */
const SECTION_IDS = ["guides", "faq", "story"];

/**
 * Scroll-spy: returns the id of the landing section currently crossing the
 * viewport's middle band (or null near the top / when not on the home page),
 * so the matching tab can underline as you scroll — and when a #tab is clicked.
 */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setActive(null);
      return;
    }
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!els.length) return;

    const visible: Record<string, boolean> = {};
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible[e.target.id] = e.isIntersecting;
        setActive(SECTION_IDS.find((id) => visible[id]) ?? null);
      },
      // A thin band around the vertical centre of the viewport.
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [enabled]);

  return active;
}

/** The nav pill links, reused in the desktop bar and the mobile strip. */
function NavLinks() {
  const pathname = usePathname();
  const activeSection = useActiveSection(pathname === "/");
  const isActive = (href: string) => {
    if (href.includes("#")) {
      return pathname === "/" && activeSection === href.split("#")[1];
    }
    if (href === "/") return pathname === "/" && activeSection === null;
    return pathname.startsWith(href);
  };
  return (
    <>
      {NAV_LINKS.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.label}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "relative whitespace-nowrap px-1 py-1.5 text-sm font-medium transition-colors " +
              "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-gradient-to-r after:from-brand after:to-teal after:transition-transform after:duration-300 after:content-[''] " +
              (active
                ? "text-brand after:scale-x-100"
                : "text-muted-foreground hover:text-brand after:scale-x-0 hover:after:scale-x-100")
            }
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}

function CartCount() {
  const { isAuthenticated } = useAuth();
  const guestItems = useGuestCart((s) => s.items);
  // Hooks must run unconditionally; only consume the server cart when authed.
  const { data } = useCart();
  const count = isAuthenticated
    ? (data?.item_count ?? 0)
    : guestCartCount(guestItems);
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex min-w-[1.15rem] items-center justify-center rounded-full bg-warning px-1 text-[11px] font-bold leading-[1.15rem] text-warning-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function AccountMenu() {
  const { isAuthenticated, user, role, signOut } = useAuth();
  const openAuth = useUiStore((s) => s.openAuth);

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => openAuth("login")}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-[#1e3a6b] px-4 py-2 text-sm font-semibold text-[#1e3a6b] transition-colors hover:bg-[#1e3a6b] hover:text-white"
      >
        <User className="size-4" />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2 transition-colors hover:bg-muted"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal text-xs font-semibold text-white">
            {(user?.email ?? "U").slice(0, 2).toUpperCase()}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user?.email}</p>
          {role && (
            <p className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role && (
          <DropdownMenuItem asChild>
            <Link href={ROLE_HOME[role]}>
              <LayoutDashboard className="size-4" /> My portal
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/buyer/orders">My orders</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/buyer/wishlist">Wishlist</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StorefrontHeader() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandLogo colored className="size-11" />
          <BrandWordmark className="hidden text-xl sm:inline" />
        </Link>

        {/* Nav (desktop) — centred underline tabs in the freed space */}
        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          <NavLinks />
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* Icon utilities */}
          {isAuthenticated && (
            <Link
              href="/buyer/wishlist"
              aria-label="Wishlist"
              className="hidden size-10 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand/40 hover:text-brand sm:grid"
            >
              <Heart className="size-[1.15rem]" />
            </Link>
          )}
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative grid size-10 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-brand/40 hover:text-brand"
          >
            <ShoppingCart className="size-[1.15rem]" />
            <CartCount />
          </Link>

          {/* Divider between utilities and the CTA buttons */}
          <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" />

          {/* CTA buttons */}
          <a
            href={SIGNUP_URL}
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-teal px-4 py-2 text-sm font-semibold text-teal transition-colors hover:bg-teal hover:text-white lg:inline-flex"
          >
            <Store className="size-4" />
            Sell
          </a>
          <AccountMenu />
        </div>
      </div>

      {/* Nav strip (mobile / tablet, below the lg desktop bar) */}
      <div className="border-t px-3 py-2 sm:px-4 lg:hidden">
        <nav className="flex items-center gap-5 overflow-x-auto">
          <NavLinks />
          <a
            href={SIGNUP_URL}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-teal px-3.5 py-1.5 text-sm font-semibold text-white"
          >
            <Store className="size-4" />
            Sell
          </a>
        </nav>
      </div>

    </header>
  );
}
