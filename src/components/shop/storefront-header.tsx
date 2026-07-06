"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  User,
  UserCog,
  Package,
  Heart,
  ChevronDown,
  Store,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandLogo, BrandWordmark } from "@/components/shared/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/features/cart/use-cart";
import { useGuestCart, guestCartCount } from "@/stores/guest-cart-store";
import { useUiStore } from "@/stores/ui-store";
import { useProfileStore, fullNameFrom } from "@/stores/profile-store";
import { SIGNUP_URL } from "@/lib/constants";
import { cn, initials as toInitials } from "@/lib/utils";

/** Primary storefront navigation — the tab bar under the header search row. */
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "Collections", href: "/collections" },
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
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const openAuth = useUiStore((s) => s.openAuth);
  const profile = useProfileStore((s) => s.profile);
  const hydrateProfile = useProfileStore((s) => s.hydrate);
  const userId = user?.id;

  // Pull the saved name/avatar for this user so the menu shows their name.
  useEffect(() => {
    if (userId) hydrateProfile(userId);
  }, [userId, hydrateProfile]);

  // While the session is still resolving (a second or two on reload) show a
  // neutral placeholder — NOT the "Sign in" button, which would be wrong if the
  // user is actually signed in and causes a flash + a stray login popup.
  if (isLoading) {
    return (
      <div
        aria-hidden
        className="flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-card py-1 pl-1 pr-2"
      >
        <span className="size-7 animate-pulse rounded-full bg-muted" />
        <span className="hidden h-3 w-10 animate-pulse rounded bg-muted sm:block" />
      </div>
    );
  }

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

  const savedName = fullNameFrom(profile);
  const displayName = savedName || (user?.email?.split("@")[0] ?? "Account");
  const initials = toInitials(savedName || user?.email || "U");
  const avatarUrl = profile.avatar;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="group flex items-center gap-1.5 rounded-full border border-transparent bg-card py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:bg-muted"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="size-7 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal text-xs font-semibold text-white">
              {initials}
            </span>
          )}
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      {/* border-transparent + a faint dark hairline ring so the popup edge reads
          the same on any backdrop — the default warm border glowed gold over the
          landing hero's dark plum panel but vanished on ivory pages. */}
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 overflow-hidden border-transparent p-0 ring-1 ring-black/[0.06]"
      >
        {/* Profile header */}
        <div className="flex items-center gap-3 border-b bg-gradient-to-br from-brand/[0.08] to-teal/[0.08] px-3.5 py-2.5">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="size-9 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-background"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal text-sm font-semibold text-white shadow-sm ring-2 ring-background">
              {initials}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold capitalize leading-tight text-foreground">
              {displayName}
            </p>
            {savedName && (
              <p className="truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            )}
          </div>
        </div>

        {/* Account links */}
        <div className="p-1">
          <DropdownMenuItem asChild className="gap-2.5 py-1.5 [&_svg]:text-brand">
            <Link href="/account/profile">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <UserCog className="size-4" />
              </span>
              <span className="text-sm font-medium">Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2.5 py-1.5 [&_svg]:text-brand">
            <Link href="/account/orders">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <Package className="size-4" />
              </span>
              <span className="text-sm font-medium">My orders</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2.5 py-1.5 [&_svg]:text-brand">
            <Link href="/account/wishlist">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <Heart className="size-4" />
              </span>
              <span className="text-sm font-medium">Favourites</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* Sign out */}
        <div className="p-1">
          <DropdownMenuItem
            onClick={() => signOut()}
            className="gap-2.5 py-1.5 text-danger focus:bg-danger/10 focus:text-danger [&_svg]:text-danger"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-danger/10">
              <LogOut className="size-4" />
            </span>
            <span className="text-sm font-medium">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StorefrontHeader() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const onCart = pathname === "/cart";
  // Only treat the user as a guest once the session has actually resolved, so
  // guest-only CTAs (e.g. "Sell") don't flash during the reload auth window.
  const isGuest = !isLoading && !isAuthenticated;

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
          <Link
            href="/cart"
            aria-label="Cart"
            aria-current={onCart ? "page" : undefined}
            className={cn(
              "relative grid size-10 place-items-center rounded-full border transition-colors focus-visible:ring-brand/60",
              onCart
                ? "border-brand bg-brand/10 text-brand"
                : "border-black/[0.06] bg-card text-foreground hover:border-brand/40 hover:text-brand",
            )}
          >
            <ShoppingCart className="size-[1.15rem]" />
            <CartCount />
          </Link>

          {/* Divider between utilities and the CTA buttons */}
          <span className="mx-0.5 hidden h-6 w-px bg-border sm:block" />

          {/* CTA buttons — "Sell" is hidden once signed in */}
          {isGuest && (
            <a
              href={SIGNUP_URL}
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-teal px-4 py-2 text-sm font-semibold text-teal transition-colors hover:bg-teal hover:text-white lg:inline-flex"
            >
              <Store className="size-4" />
              Sell
            </a>
          )}
          <AccountMenu />
        </div>
      </div>

      {/* Nav strip (mobile / tablet, below the lg desktop bar) */}
      <div className="border-t px-3 py-2 sm:px-4 lg:hidden">
        <nav className="flex items-center gap-5 overflow-x-auto">
          <NavLinks />
          {isGuest && (
            <a
              href={SIGNUP_URL}
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-teal px-3.5 py-1.5 text-sm font-semibold text-white"
            >
              <Store className="size-4" />
              Sell
            </a>
          )}
        </nav>
      </div>

    </header>
  );
}
