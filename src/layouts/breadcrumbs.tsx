"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { titleCase } from "@/lib/utils";

/** Auto breadcrumbs derived from the pathname. */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: titleCase(decodeURIComponent(seg)),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
    // UUIDs look ugly in breadcrumbs — show a short label.
    isId: /^[0-9a-f]{8}-/.test(seg),
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex"
    >
      <Link href={`/${segments[0]}`} className="hover:text-foreground">
        <Home className="size-3.5" />
      </Link>
      {crumbs.slice(1).map((c) => (
        <span key={c.href} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5 opacity-50" />
          {c.isLast ? (
            <span className="font-medium text-foreground">
              {c.isId ? "Details" : c.label}
            </span>
          ) : (
            <Link href={c.href} className="hover:text-foreground">
              {c.isId ? "Details" : c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
