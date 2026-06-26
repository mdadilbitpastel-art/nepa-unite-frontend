import Link from "next/link";
import { TrendingUp, Lock, Boxes } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-grid-slate [background-size:32px_32px] opacity-[0.15]" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <BrandLogo className="size-7" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        <div className="relative space-y-8">
          <h1 className="max-w-md text-fluid-2xl font-bold leading-tight text-balance">
            The enterprise B2B marketplace for Northeastern Pennsylvania.
          </h1>
          <div className="space-y-5">
            {[
              { icon: Boxes, t: "Unified catalog", d: "Source from verified regional suppliers." },
              { icon: TrendingUp, t: "Real-time analytics", d: "Track spend, revenue and commissions." },
              { icon: Lock, t: "Enterprise security", d: "Role-based access with full audit trails." },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <f.icon className="size-4" />
                </div>
                <div>
                  <p className="font-medium">{f.t}</p>
                  <p className="text-sm text-white/75">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-white/60">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
