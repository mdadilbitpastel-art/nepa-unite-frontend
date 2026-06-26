"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SIGNUP_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  PackageCheck,
  Truck,
  Lock,
  Scale,
  Headphones,
  Search,
  FileText,
  CreditCard,
  Boxes,
  Award,
  Building2,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

/**
 * Velura editorial landing page — a faithful React port of the inspired
 * landing concept (hero → trust → what-is → how-it-works → benefits →
 * by-the-numbers → journey → featured → quality → reviews → knowledge →
 * FAQ → story → trusted-by → CTA). Adapted to NEPA Unite's B2B-marketplace
 * content, styled with the Velura plum / copper / ivory theme tokens.
 */

const SOFT_COPPER = "hsl(24 72% 74%)";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-teal">
      {children}
    </span>
  );
}

/**
 * Scroll-reveal wrapper — fades + lifts its children into view once, the first
 * time they enter the viewport. Transform is dropped after reveal so it never
 * interferes with sticky descendants. Honors prefers-reduced-motion.
 */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100",
        shown ? "opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Animated number — counts up from 0 to the target the first time it scrolls
 * into view, preserving any prefix/suffix (e.g. "+", "k+", "%", "★", commas
 * and decimals). Falls back to the static string for non-numeric values and
 * honors prefers-reduced-motion.
 */
function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const m = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  const prefix = m?.[1] ?? "";
  const numStr = m?.[2] ?? "";
  const suffix = m?.[3] ?? "";
  const hasComma = numStr.includes(",");
  const dot = numStr.indexOf(".");
  const decimals = dot >= 0 ? numStr.length - dot - 1 : 0;
  const target = parseFloat(numStr.replace(/,/g, "")) || 0;

  const fmt = (n: number) => {
    const fixed = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
    if (!hasComma) return fixed;
    const [intPart, decPart] = fixed.split(".");
    const grouped = Number(intPart).toLocaleString("en-US");
    return decPart ? `${grouped}.${decPart}` : grouped;
  };

  const [display, setDisplay] = useState(() =>
    m ? prefix + fmt(0) + suffix : value,
  );

  useEffect(() => {
    if (!m) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(prefix + fmt(target) + suffix);
      return;
    }
    let raf = 0;
    let started = false;
    const duration = 1500;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(prefix + fmt(target * eased) + suffix);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!m) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/* ---------------------------------- Hero ---------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blush/60 to-background">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-14 lg:px-8 lg:pb-16 lg:pt-8">
        <div className="max-w-xl">
          <Eyebrow>B2B Marketplace · Northeastern Pennsylvania</Eyebrow>
          <h1 className="mt-4 text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Real sourcing starts with
            <span className="italic text-teal"> understanding the region.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            NEPA Unite pairs verified regional suppliers with the tools buyers
            need — so you know exactly who you&apos;re trading with, how to order
            with confidence, and what to expect at every step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View products
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={SIGNUP_URL}
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-primary px-7 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Become a seller
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-8">
            {[
              { b: "85,000+", l: "Products listed" },
              { b: "1,200+", l: "Verified sellers" },
              { b: "30+", l: "Industry verticals" },
            ].map((m) => (
              <div key={m.l}>
                <b className="block text-2xl font-medium text-foreground">
                  <CountUp value={m.b} />
                </b>
                <span className="text-sm text-muted-foreground">{m.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual panel */}
        <div className="relative flex aspect-square items-end overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[hsl(288_30%_40%)] p-7 shadow-elevated lg:aspect-[4/4.1]">
          <Image
            src="/landing/hero-product.jpg"
            alt="A featured product showcased on the NEPA Unite marketplace"
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/35 to-primary/10" />
          <Link
            href="/products"
            aria-label="View all products"
            className="absolute inset-0 z-0"
          />
          {/* Brand / product label */}
          <div className="pointer-events-none absolute left-6 top-6 z-10">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/80">
              <BrandLogo colored className="size-4" />
              NEPA Unite
            </span>
            <p className="mt-1.5 text-lg font-medium leading-tight text-black">
              Aviator Chronograph
            </p>
            <p className="mt-0.5 text-[11px] text-black/60">
              Model NU-2400 · Leather strap
            </p>
          </div>
          <span className="animate-floaty absolute right-6 top-6 z-10 rounded-full bg-teal px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-foreground">
            Verified network
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Trust strip ------------------------------- */
function TrustStrip() {
  const stats = [
    { b: "27+", l: "YEARS SERVING NEPA" },
    { b: "770k+", l: "ORDERS FULFILLED" },
    { b: "54k+", l: "BUSINESS BUYERS" },
    { b: "100%", l: "VETTED SUPPLIERS" },
    { b: "4.8★", l: "AVERAGE RATING" },
  ];
  return (
    <section className="bg-primary py-9 text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        {stats.map((s) => (
          <div key={s.l} className="flex-1 text-center">
            <b className="block text-3xl font-medium text-white">
              <CountUp value={s.b} />
            </b>
            <span className="text-xs tracking-wide text-primary-foreground/75">
              {s.l}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ What it does ------------------------------ */
function WhatItDoes() {
  const points = [
    {
      t: "Connects verified buyers & suppliers",
      d: "Every seller is vetted and approved before they ever list.",
    },
    {
      t: "Bulk & volume pricing built in",
      d: "Transparent tiered rates — no back-and-forth quoting games.",
    },
    {
      t: "Refines how the region sources",
      d: "Compare openly across suppliers, categories and lead times.",
    },
    {
      t: "Works the way businesses buy",
      d: "Purchase orders, approvals and reorders — not a consumer cart.",
    },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-7xl items-stretch gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Link
          href="/products"
          aria-label="View all products"
          className="group relative block aspect-square overflow-hidden rounded-3xl shadow-card lg:aspect-auto lg:h-full lg:min-h-[24rem]"
        >
          <Image
            src="/landing/showcase-product.jpg"
            alt="A featured product showcased on the NEPA Unite marketplace"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/25 to-transparent" />
          {/* Brand / product label */}
          <div className="pointer-events-none absolute left-6 top-6 z-10">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/80">
              <BrandLogo colored className="size-4" />
              NEPA Unite
            </span>
            <p className="mt-1.5 text-lg font-medium leading-tight text-black">
              Air Runner Pro
            </p>
            <p className="mt-0.5 text-[11px] text-black/60">
              Model NU-1200 · Mesh upper
            </p>
          </div>
        </Link>
        <div>
          <Eyebrow>The fundamentals</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium leading-tight text-foreground sm:text-4xl">
            What NEPA Unite actually does
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            We bring Northeastern Pennsylvania&apos;s buyers and suppliers onto
            one transparent marketplace — controlled, verified, and built around
            how real businesses trade.
          </p>
          <ul className="mt-7 grid gap-4">
            {points.map((p) => (
              <li key={p.t} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-teal text-xs text-teal-foreground">
                  ✓
                </span>
                <span className="text-[0.98rem] text-foreground">
                  <b className="font-semibold">{p.t}</b> — {p.d}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ How it works ------------------------------ */
function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Search,
      t: "Browse & compare",
      d: "Search 85,000+ products across verticals. Compare suppliers, pricing and lead times openly — no login required.",
    },
    {
      n: "02",
      icon: FileText,
      t: "Request & order",
      d: "Add to a purchase order, request bulk pricing, and submit for approval. Built for how procurement actually works.",
    },
    {
      n: "03",
      icon: CreditCard,
      t: "Pay securely",
      d: "Stripe-protected checkout with business-grade payment terms. Every transaction tracked and reconciled.",
    },
    {
      n: "04",
      icon: Truck,
      t: "Track & receive",
      d: "Regional dispatch with tracked fulfilment across NEPA. Faster local delivery, reorder in one click.",
    },
  ];
  return (
    <section className="bg-card py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Eyebrow>The method</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
            Four steps, done right
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From discovery to delivery — a sourcing flow designed for businesses,
            not a consumer checkout.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group relative overflow-hidden rounded-3xl border bg-background p-7 transition-all card-tilt hover:shadow-elevated"
            >
              {/* Oversized watermark step number */}
              <span className="pointer-events-none absolute -right-3 -top-5 select-none text-[7rem] font-bold leading-none text-primary/[0.06] transition-colors group-hover:text-teal/10">
                {s.n}
              </span>
              <span className="relative grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-teal text-white shadow-card">
                <s.icon className="size-7" />
              </span>
              <span className="relative mt-6 block text-[11px] font-bold uppercase tracking-[0.12em] text-teal">
                Step {s.n}
              </span>
              <h3 className="relative mt-1.5 text-lg font-medium text-foreground">
                {s.t}
              </h3>
              <p className="relative mt-2 text-sm text-muted-foreground">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Benefits -------------------------------- */
function Benefits() {
  const items = [
    {
      icon: BadgeCheck,
      t: "Vetted suppliers",
      d: "Every seller verified and approved before listing — trade with confidence.",
    },
    {
      icon: PackageCheck,
      t: "Bulk pricing",
      d: "Volume rates built into every listing. No opaque quoting cycles.",
    },
    {
      icon: Truck,
      t: "Regional dispatch",
      d: "Faster local fulfilment across Northeastern Pennsylvania.",
    },
    {
      icon: Lock,
      t: "Secure checkout",
      d: "Stripe-protected payments with a full audit trail on every order.",
    },
    {
      icon: Scale,
      t: "Open comparison",
      d: "Compare suppliers, specs and lead times side by side — transparently.",
    },
    {
      icon: Headphones,
      t: "Business support",
      d: "Help from real people who understand regional B2B sourcing.",
    },
  ];
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
        {/* Intro panel */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Why buyers choose us</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium leading-[1.1] text-foreground sm:text-4xl lg:text-[2.75rem]">
            One marketplace, every concern covered
          </h2>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Because the whole region trades on one transparent platform, a single
            account solves sourcing end to end.
          </p>
          <Link
            href="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Start sourcing
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Benefit rows */}
        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {items.map((b) => (
            <div
              key={b.t}
              className="flex gap-4 rounded-2xl p-4 transition-colors hover:bg-card"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-card text-primary shadow-card ring-1 ring-primary/5">
                <b.icon className="size-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {b.t}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- By the numbers ----------------------------- */
function ByTheNumbers() {
  const items = [
    {
      b: "+38%",
      d: "Average sourcing-cost saving buyers report after consolidating onto the marketplace.",
    },
    {
      b: "6×",
      d: "Faster supplier discovery versus phone-and-email quoting across the region.",
    },
    {
      b: "48h",
      d: "Typical time from sign-up to a fully verified, order-ready account.",
    },
  ];
  return (
    <section className="bg-primary py-24 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <Eyebrow>Evidence over hype</Eyebrow>
        <h2 className="mt-3 text-3xl font-medium text-white sm:text-4xl">
          The marketplace, in numbers
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
          Real outcomes from real regional trade — not marketing claims.
        </p>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {items.map((s) => (
            <div key={s.b}>
              <b
                className="block text-5xl font-medium"
                style={{ color: SOFT_COPPER }}
              >
                <CountUp value={s.b} />
              </b>
              <p className="mt-3 text-sm text-primary-foreground/80">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Journey --------------------------------- */
function Journey() {
  const stages = [
    {
      icon: Building2,
      tag: "Day 1",
      t: "Sign up",
      d: "Create your business account in minutes. Browse the full catalogue immediately.",
    },
    {
      icon: BadgeCheck,
      tag: "Day 1–2",
      t: "Get verified",
      d: "We confirm your business details so you can transact with full trust on both sides.",
    },
    {
      icon: CreditCard,
      tag: "Week 1",
      t: "First order",
      d: "Build a purchase order, lock in bulk pricing, and check out securely.",
    },
    {
      icon: Boxes,
      tag: "Ongoing",
      t: "Scale up",
      d: "Reorder in a click, add team approvals, and consolidate suppliers over time.",
    },
  ];
  return (
    <section className="bg-card py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <Eyebrow>What to expect</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
            From sign-up to first order
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Onboarding is quick by design — here&apos;s the realistic path so you
            know what&apos;s normal.
          </p>
        </Reveal>
        <div className="relative grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting rail behind the numbered nodes (desktop) */}
          <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-6 hidden h-0.5 bg-border lg:block" />
          {stages.map((s, i) => (
            <Reveal
              key={s.t}
              delay={i * 220}
              className="relative flex flex-col items-center text-center"
            >
              {/* Numbered node sitting on the rail */}
              <span className="relative z-10 grid size-12 place-items-center rounded-full bg-teal text-base font-bold text-teal-foreground shadow-card ring-8 ring-card">
                {i + 1}
              </span>
              {/* Step card */}
              <div className="mt-6 w-full rounded-2xl border bg-background p-6 transition-all card-tilt hover:shadow-elevated">
                <span className="mx-auto grid size-12 place-items-center rounded-xl bg-blush text-primary">
                  <s.icon className="size-6" />
                </span>
                <span className="mt-4 block text-xs font-semibold uppercase tracking-[0.1em] text-teal">
                  {s.tag}
                </span>
                <h4 className="mt-1 text-lg font-medium text-foreground">
                  {s.t}
                </h4>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Products slider --------------------------- */
const FEATURED_PRODUCTS = [
  {
    img: "/landing/products/drill-dewalt.jpg",
    name: "DeWalt 18V Cordless Drill",
    category: "Power Tools",
    price: "$129.00",
  },
  {
    img: "/landing/products/hand-tools.jpg",
    name: "Pro Plier & Wrench Set",
    category: "Hand Tools",
    price: "$89.00",
  },
  {
    img: "/landing/products/safety-ppe.jpg",
    name: "Site Safety & PPE Kit",
    category: "Safety Gear",
    price: "$74.00",
  },
  {
    img: "/landing/products/drill-milwaukee.jpg",
    name: "Milwaukee M18 Hammer Drill",
    category: "Power Tools",
    price: "$159.00",
  },
  {
    img: "/landing/products/hammer.jpg",
    name: "Steel Claw Hammer 16oz",
    category: "Hand Tools",
    price: "$24.00",
  },
  {
    img: "/landing/products/sealant.jpg",
    name: "Acoustic Sealant · 12-pack",
    category: "Building Supply",
    price: "$42.00",
  },
];

function ProductsSlider() {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollByCards = (dir: number) => {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <section className="bg-gradient-to-br from-blush/60 to-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div className="max-w-xl">
            <Eyebrow>Popular right now</Eyebrow>
            <h2 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
              Trending across the marketplace
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              A snapshot of what regional businesses are sourcing this week.
            </p>
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              aria-label="Previous products"
              className="grid size-12 place-items-center rounded-full border-[1.5px] border-primary/20 bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              aria-label="Next products"
              className="grid size-12 place-items-center rounded-full border-[1.5px] border-primary/20 bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
        >
          {FEATURED_PRODUCTS.map((p) => (
            <article
              key={p.name}
              className="group w-[15rem] shrink-0 snap-start overflow-hidden rounded-[1.75rem] bg-card shadow-card ring-1 ring-primary/5 transition-all duration-300 card-tilt hover:shadow-elevated"
            >
              <Link
                href="/products"
                aria-label={`View ${p.name}`}
                className="relative m-3 block aspect-square overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-secondary to-blush"
              >
                <Image
                  src={p.img}
                  alt={p.name}
                  fill
                  sizes="240px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand shadow-sm backdrop-blur">
                  {p.category}
                </span>
              </Link>
              <div className="flex items-end justify-between gap-2 px-5 pb-5 pt-1">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-lg font-medium text-teal">
                    {p.price}
                  </p>
                </div>
                <Link
                  href="/products"
                  aria-label={`View ${p.name}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-teal"
                >
                  <Plus className="size-5" />
                </Link>
              </div>
            </article>
          ))}

          {/* Trailing CTA card */}
          <Link
            href="/products"
            className="group flex w-[15rem] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-[1.75rem] border-2 border-dashed border-primary/30 p-6 text-center transition-colors hover:border-primary hover:bg-card"
          >
            <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
              <ArrowRight className="size-6" />
            </span>
            <span className="font-medium text-foreground">
              View all 85,000+ products
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Quality --------------------------------- */
function Quality() {
  const items = [
    {
      icon: ShieldCheck,
      t: "Vetted & approved",
      d: "Every supplier passes verification before listing.",
    },
    {
      icon: Lock,
      t: "Stripe-secured",
      d: "Protected payments with a full transaction audit trail.",
    },
    {
      icon: Truck,
      t: "Regional fulfilment",
      d: "Tracked B2B delivery across Northeastern PA.",
    },
    {
      icon: Award,
      t: "Compliance-ready",
      d: "Audit logs and records built for business procurement.",
    },
  ];
  return (
    <section className="bg-card py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Eyebrow>Built to a standard</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
            Trust you can verify
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every order rides on the same guarantees — no fine print, no
            surprises.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((q) => (
            <div
              key={q.t}
              className="group relative overflow-hidden rounded-3xl border bg-background p-7 text-center transition-all card-tilt hover:border-teal/40 hover:shadow-elevated"
            >
              {/* Accent bar that reveals on hover */}
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-teal text-white shadow-card transition-transform duration-300 group-hover:scale-105">
                <q.icon className="size-8" />
              </span>
              <h4 className="mt-5 text-base font-semibold text-foreground">
                {q.t}
              </h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{q.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Testimonials ----------------------------- */
function Testimonials() {
  const reviews = [
    {
      av: "M",
      n: "Maria D.",
      meta: "Operations · 6 months in",
      q: "We consolidated five suppliers onto NEPA Unite and cut our sourcing admin in half. Knowing every vendor is verified changed how fast we can buy.",
    },
    {
      av: "T",
      n: "Tom R.",
      meta: "Procurement lead · 1 year in",
      q: "The open comparison is the difference. I can see pricing and lead times side by side instead of chasing quotes by phone for a week.",
    },
    {
      av: "L",
      n: "Lena K.",
      meta: "Regional supplier · 9 months in",
      q: "As a seller, the verified network means buyers trust my listings from day one. Reorders now run themselves.",
    },
    {
      av: "J",
      n: "James P.",
      meta: "Facilities manager · 4 months in",
      q: "Bulk pricing is right there on the listing. No quoting games — I budget the whole quarter in an afternoon now.",
    },
    {
      av: "S",
      n: "Sofia R.",
      meta: "Owner · 8 months in",
      q: "As a small business I was nervous about bulk orders. The audit trail and Stripe checkout made my finance team comfortable on day one.",
    },
    {
      av: "D",
      n: "Derek H.",
      meta: "Plant supervisor · 1 year in",
      q: "Regional dispatch means parts arrive next day instead of waiting on a national carrier. Our downtime dropped noticeably.",
    },
    {
      av: "A",
      n: "Aisha N.",
      meta: "Buyer · 5 months in",
      q: "Every supplier being vetted up front removed the guesswork. I onboard a new vendor without a single phone call now.",
    },
    {
      av: "C",
      n: "Carlos M.",
      meta: "Distributor · 10 months in",
      q: "Listing to the whole region on one platform doubled my repeat orders. The reorder flow basically sells for me.",
    },
  ];
  return (
    <section className="overflow-hidden py-24">
      <div className="mx-auto mb-14 max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <Eyebrow>Real businesses</Eyebrow>
        <h2 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
          What trading on trust looks like
        </h2>
      </div>

      {/* Constant-speed auto-scrolling marquee (pauses on hover) */}
      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-32" />
        <div className="flex">
          {[0, 1].map((dup) => (
            <ul
              key={dup}
              aria-hidden={dup === 1}
              className="flex shrink-0 animate-marquee gap-6 pr-6 [animation-play-state:running] group-hover:[animation-play-state:paused]"
            >
              {reviews.map((r) => (
                <li
                  key={r.n}
                  className="flex w-[340px] shrink-0 flex-col rounded-2xl border bg-card p-8"
                >
                  <div className="flex gap-0.5 text-teal">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-3 text-[0.95rem] text-foreground">
                    &ldquo;{r.q}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal to-primary font-semibold text-white">
                      {r.av}
                    </span>
                    <div>
                      <b className="block text-sm font-medium text-primary">
                        {r.n}
                      </b>
                      <span className="text-xs text-muted-foreground">
                        {r.meta}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Knowledge base ----------------------------- */
function Knowledge() {
  const posts = [
    {
      icon: Search,
      tag: "Sourcing",
      read: "4 min read",
      t: "How to vet a regional supplier",
      d: "The checks that matter before you place a first purchase order — credentials, capacity and track record.",
    },
    {
      icon: FileText,
      tag: "Procurement",
      read: "5 min read",
      t: "Purchase orders without the friction",
      d: "Setting up approvals and reorders that scale cleanly with your team and your volumes.",
    },
    {
      icon: Truck,
      tag: "Logistics",
      read: "3 min read",
      t: "Why regional dispatch wins on lead time",
      d: "How local fulfilment beats national distribution for B2B — and what it means for your downtime.",
    },
  ];
  return (
    <section id="guides" className="scroll-mt-24 bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <Eyebrow>Knowledge base</Eyebrow>
            <h2 className="mt-3 text-3xl font-medium text-foreground sm:text-4xl">
              Learn before you source
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Practical guides for buyers and suppliers trading across the region.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden shrink-0 items-center gap-2 rounded-full border-[1.5px] border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground sm:inline-flex"
          >
            All guides
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.t}
              href="/products"
              className="group flex flex-col rounded-3xl border bg-card p-8 transition-all card-tilt hover:shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-teal text-white shadow-card transition-transform group-hover:scale-105">
                  <p.icon className="size-7" />
                </span>
                <span className="rounded-full bg-blush px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
                  {p.tag}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-medium leading-snug text-foreground">
                {p.t}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {p.d}
              </p>
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Read guide
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="text-xs text-muted-foreground">{p.read}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- FAQ ----------------------------------- */
function Faq() {
  const faqs = [
    {
      q: "Who can buy on NEPA Unite?",
      a: "Any registered business in or sourcing from Northeastern Pennsylvania. Browsing is open to everyone; an account is only needed to place an order.",
    },
    {
      q: "How are suppliers verified?",
      a: "Every seller goes through a vetting and approval process before listing — business details are confirmed so both sides trade with confidence.",
    },
    {
      q: "Is there bulk or volume pricing?",
      a: "Yes. Tiered volume pricing is built directly into listings, so you see your rate up front instead of waiting on a quote.",
    },
    {
      q: "How does payment work?",
      a: "Checkout is Stripe-protected with a full audit trail on every transaction, designed to fit business payment and reconciliation needs.",
    },
    {
      q: "How fast is delivery?",
      a: "Most suppliers dispatch regionally, so local fulfilment is typically faster than national distribution. Every order is tracked end to end.",
    },
    {
      q: "How do I become a seller?",
      a: "Register for a seller account, complete verification (usually within 48 hours), and start listing to a network of verified regional buyers.",
    },
  ];
  return (
    <section id="faq" className="scroll-mt-24 bg-card py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8">
        {/* Intro panel */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Honest answers</Eyebrow>
          <h2 className="mt-3 text-4xl font-medium leading-[1.05] text-foreground sm:text-5xl">
            Your questions,
            <span className="italic text-teal"> answered.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Everything worth knowing before you start sourcing across the region.
            Still unsure? Our guides go a level deeper.
          </p>
          <Link
            href="/#guides"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Read the guides
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Accordion */}
        <div className="divide-y border-y">
          {faqs.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-5 py-6 text-lg font-medium text-foreground [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{f.q}</span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full border-[1.5px] border-border text-teal transition-all duration-300 group-open:rotate-45 group-open:border-teal group-open:bg-teal group-open:text-teal-foreground">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="pb-6 pr-14 text-base leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Story --------------------------------- */
function Story() {
  return (
    <section id="story" className="scroll-mt-24 bg-primary py-24 text-primary-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <Eyebrow>Our story</Eyebrow>
          <h2 className="mt-3 text-3xl font-medium text-white sm:text-4xl">
            Built for the way the region actually trades
          </h2>
          <p className="mt-5 text-primary-foreground/85">
            NEPA Unite exists for one reason: to make sourcing across
            Northeastern Pennsylvania transparent, fair, and fast.
          </p>
          <p className="mt-4 text-primary-foreground/85">
            We believe trust is the most important ingredient. A great catalogue
            only works when you know who&apos;s on the other side — so everything
            we build starts with verification, not volume.
          </p>
          <p className="mt-4 text-primary-foreground/85">
            That philosophy now connects more than 1,200 suppliers and 54,000
            business buyers trading on one platform.
          </p>
          <Link
            href="/register"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-teal px-7 py-3.5 text-sm font-semibold text-teal-foreground transition-transform hover:-translate-y-0.5"
          >
            Join the marketplace
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <Link
          href="/products"
          aria-label="View all products"
          className="group relative block aspect-[4/3] overflow-hidden rounded-3xl shadow-elevated"
        >
          <Image
            src="/landing/story-team.jpg"
            alt="Business team planning a regional sourcing strategy together"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
        </Link>
      </div>
    </section>
  );
}

/* ----------------------------- Newsletter CTA ---------------------------- */
function NewsletterCta() {
  const [done, setDone] = useState(false);
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] border bg-card p-8 shadow-card sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-14">
          {/* Pitch */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal">
              <Sparkles className="size-3.5" />
              Start informed
            </span>
            <h2 className="mt-4 text-3xl font-medium text-foreground sm:text-4xl">
              Get the regional sourcing guide
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              A practical, no-nonsense starter guide to sourcing across NEPA —
              straight to your inbox.
            </p>
            <ul className="mt-6 grid gap-2.5">
              {[
                "Supplier vetting checklist",
                "Bulk-pricing playbook",
                "Faster lead-time tactics",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-sm text-foreground"
                >
                  <BadgeCheck className="size-4 shrink-0 text-teal" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Standard signup form card */}
          <div className="rounded-2xl bg-secondary/50 p-6 ring-1 ring-border sm:p-8">
            {done ? (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-teal/10 text-teal">
                  <BadgeCheck className="size-7" />
                </span>
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  You&apos;re on the list
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Check your inbox — the guide is on its way.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDone(true);
                }}
              >
                <label
                  htmlFor="newsletter-email"
                  className="block text-sm font-medium text-foreground"
                >
                  Work email
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="mt-2 h-12 w-full rounded-xl border bg-background px-4 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
                />
                <button
                  type="submit"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand/90"
                >
                  Send me the guide
                  <ArrowRight className="size-4" />
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  No spam. Just sourcing insight. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Export --------------------------------- */
export function VeluraLanding() {
  return (
    <>
      <Hero />
      <Reveal><TrustStrip /></Reveal>
      <Reveal><WhatItDoes /></Reveal>
      <Reveal><HowItWorks /></Reveal>
      <Reveal><Benefits /></Reveal>
      <Reveal><ByTheNumbers /></Reveal>
      <Journey />
      <Reveal><ProductsSlider /></Reveal>
      <Reveal><Quality /></Reveal>
      <Reveal><Testimonials /></Reveal>
      <Reveal><Knowledge /></Reveal>
      <Reveal><Faq /></Reveal>
      <Reveal><Story /></Reveal>
      <Reveal><NewsletterCta /></Reveal>
    </>
  );
}
