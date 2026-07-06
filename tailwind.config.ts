import type { Config } from "tailwindcss";

/**
 * NEPA Unite design tokens.
 * Brand: Flipkart blue #2874F0 · Deals: amber #FF9F00 · Ratings: green #388E3C
 * Semantic colors are driven by CSS variables (see globals.css).
 * Light theme only. Fluid typography via `clamp()` utilities below.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/layouts/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand semantic tokens
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
        },
        teal: {
          DEFAULT: "hsl(var(--teal))",
          foreground: "hsl(var(--teal-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
        },
        blush: "hsl(var(--blush))",
        "copper-soft": "hsl(var(--copper-soft))",
        cream: "hsl(var(--cream))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          muted: "hsl(var(--sidebar-muted))",
          accent: "hsl(var(--sidebar-accent))",
          border: "hsl(var(--sidebar-border))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
      },
      fontSize: {
        // Fluid type scale
        "fluid-xs": "clamp(0.72rem, 0.7rem + 0.1vw, 0.78rem)",
        "fluid-sm": "clamp(0.82rem, 0.8rem + 0.15vw, 0.9rem)",
        "fluid-base": "clamp(0.92rem, 0.88rem + 0.2vw, 1rem)",
        "fluid-lg": "clamp(1.05rem, 1rem + 0.4vw, 1.25rem)",
        "fluid-xl": "clamp(1.3rem, 1.1rem + 0.9vw, 1.7rem)",
        "fluid-2xl": "clamp(1.7rem, 1.3rem + 1.8vw, 2.5rem)",
        "fluid-3xl": "clamp(2.2rem, 1.6rem + 3vw, 3.75rem)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        soft: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.04)",
        card: "0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px -4px rgb(15 23 42 / 0.06)",
        elevated:
          "0 4px 6px -1px rgb(15 23 42 / 0.06), 0 12px 28px -8px rgb(15 23 42 / 0.12)",
        glow: "0 0 0 1px hsl(var(--brand) / 0.12), 0 8px 24px -6px hsl(var(--brand) / 0.25)",
        "glow-gold": "0 6px 18px -6px hsl(32 74% 50% / 0.5)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 hsl(var(--success) / 0.5)" },
          "70%": { boxShadow: "0 0 0 6px hsl(var(--success) / 0)" },
          "100%": { boxShadow: "0 0 0 0 hsl(var(--success) / 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 2s infinite",
      },
      backgroundImage: {
        "grid-slate":
          "linear-gradient(to right, hsl(var(--border) / 0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.4) 1px, transparent 1px)",
        "brand-gradient":
          "linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(288 32% 36%) 100%)",
        "teal-gradient":
          "linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(var(--teal)) 100%)",
        // Logo copper-ring gradient (#C1764A) for CTAs — anchored on the logo
        // copper and deepening slightly so white label text stays crisp.
        "gold-gradient":
          "linear-gradient(135deg, hsl(23 61% 54%) 0%, hsl(22 61% 49%) 50%, hsl(20 62% 44%) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
