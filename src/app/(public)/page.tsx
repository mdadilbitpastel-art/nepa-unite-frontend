import { VeluraLanding } from "@/components/marketing/velura-landing";

/**
 * Public storefront landing page — the editorial "Velura" marketing surface.
 * Anyone can browse it without logging in; CTAs route into the catalogue and
 * seller registration. The data-driven shopping rails live on /products.
 */
export default function StorefrontHome() {
  return (
    <div className="bg-background">
      <VeluraLanding />
    </div>
  );
}
