"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Package,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useProductsBySeller } from "@/features/products/use-products";
import { useMember } from "@/features/members/use-members";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, titleCase } from "@/lib/utils";

export default function SellerStorefrontPage() {
  const { user } = useAuth();
  const sellerId = user?.id ?? "";
  const { data: products, isLoading } = useProductsBySeller(sellerId);
  const { data: member } = useMember(sellerId);
  const [copied, setCopied] = useState(false);

  const active = (products ?? []).filter((p) => p.status === "active");
  const businessName = member?.tenant?.name ?? "Your Store";
  const vertical = member?.tenant?.vertical_type;

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/buyer/products?seller=${sellerId}`
      : `/buyer/products?seller=${sellerId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Storefront link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Storefront"
        description="Preview how buyers see your public storefront."
        actions={
          <Button asChild variant="outline">
            <a href={shareLink} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> Open public view
            </a>
          </Button>
        }
      />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="overflow-hidden border-brand/20 bg-brand-gradient text-white">
          <CardContent className="flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
                <Store className="size-7" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{businessName}</h2>
                <p className="text-sm text-white/80">
                  {vertical ? `${titleCase(vertical)} · ` : ""}
                  {active.length} active product
                  {active.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Badge className="bg-white/15 text-white">Storefront preview</Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Shareable link */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">Shareable storefront link</p>
            <p className="truncate text-xs text-muted-foreground">
              {shareLink}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? (
              <Check className="size-4 text-success" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </CardContent>
      </Card>

      {/* Product grid */}
      {isLoading ? (
        <CardGridSkeleton />
      ) : active.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {active.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
            >
              <Card className="group h-full overflow-hidden transition-shadow hover:shadow-elevated">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
                  {p.primary_image_url ? (
                    <img
                      src={p.primary_image_url}
                      alt={p.name}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <Package className="size-10 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="space-y-1 p-4">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">SKU {p.sku}</p>
                  <p className="pt-1 text-base font-semibold text-brand">
                    {formatCurrency(p.price)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="No active products"
          description="Activate or add products to populate your storefront."
        />
      )}
    </div>
  );
}
