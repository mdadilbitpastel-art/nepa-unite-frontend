import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";
import { BrandLogo, BrandWordmark } from "@/components/shared/brand-logo";
import { APP_NAME } from "@/lib/constants";

/* Brand glyphs as inline SVG (official paths) — unaffected by fonts. */
type IconProps = { className?: string };
const LinkedInIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);
const XIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 5.964-6.933zm-1.29 19.5h2.039L6.486 3.24H4.298l13.313 17.413z" />
  </svg>
);
const FacebookIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const InstagramIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const TRUST = [
  { icon: ShieldCheck, t: "Verified sellers", d: "Every supplier vetted & approved" },
  { icon: Truck, t: "Reliable fulfilment", d: "Tracked B2B delivery across NEPA" },
  { icon: RotateCcw, t: "Secure payments", d: "Stripe-protected checkout" },
  { icon: Headphones, t: "Business support", d: "Help from real humans" },
];

const COLUMNS = [
  { title: "Shop", links: ["All products", "Categories", "Deals", "New arrivals"] },
  { title: "Company", links: ["About", "Sellers", "Careers", "Contact"] },
  { title: "Help", links: ["Track order", "Returns", "Shipping", "FAQ"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
];

const SOCIALS = [
  { icon: LinkedInIcon, label: "LinkedIn" },
  { icon: XIcon, label: "X" },
  { icon: FacebookIcon, label: "Facebook" },
  { icon: InstagramIcon, label: "Instagram" },
];

export function StorefrontFooter() {
  return (
    <footer className="mt-20 bg-background">
      {/* Brand accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-brand via-teal to-brand" />

      {/* Trust strip */}
      <div className="border-b bg-secondary/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-9 sm:px-6 lg:grid-cols-4 lg:px-8">
          {TRUST.map((t) => (
            <div key={t.t} className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <t.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.t}</p>
                <p className="text-xs text-muted-foreground">{t.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-6 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo colored className="size-12" />
            <BrandWordmark className="text-2xl" />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            The B2B marketplace for Northeastern Pennsylvania — source from
            verified regional suppliers, all in one place.
          </p>
          <div className="flex gap-2.5 pt-1">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-brand hover:bg-brand hover:text-primary-foreground"
              >
                <s.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="mb-4 text-sm font-semibold text-foreground">
              {col.title}
            </p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <Link
                    href="/products"
                    className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-brand"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/products" className="transition-colors hover:text-brand">
              Privacy
            </Link>
            <Link href="/products" className="transition-colors hover:text-brand">
              Terms
            </Link>
            <Link href="/products" className="transition-colors hover:text-brand">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
