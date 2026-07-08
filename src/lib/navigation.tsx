import {
  LayoutDashboard,
  Package,
  Heart,
  ShoppingCart,
  Receipt,
  MapPin,
  User,
  Bell,
  Boxes,
  PlusCircle,
  Warehouse,
  TruckIcon,
  TrendingUp,
  CreditCard,
  Store,
  BarChart3,
  Settings,
  Users,
  UserCheck,
  ShoppingBag,
  Percent,
  ScrollText,
  Activity,
  ShieldCheck,
  FileSearch,
  ClipboardList,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "cart" | "notifications" | "approvals";
  exact?: boolean;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export const NAV_BY_ROLE: Record<Role, NavSection[]> = {
  buyer: [
    {
      items: [
        { label: "Dashboard", href: "/buyer", icon: LayoutDashboard, exact: true },
        { label: "Browse Products", href: "/buyer/products", icon: Package },
        { label: "Wishlist", href: "/buyer/wishlist", icon: Heart },
        { label: "Cart", href: "/buyer/cart", icon: ShoppingCart, badgeKey: "cart" },
        { label: "Orders", href: "/buyer/orders", icon: Receipt },
      ],
    },
    {
      heading: "Account",
      items: [
        { label: "Address Book", href: "/buyer/addresses", icon: MapPin },
        { label: "Notifications", href: "/buyer/notifications", icon: Bell, badgeKey: "notifications" },
        { label: "Profile", href: "/buyer/profile", icon: User },
      ],
    },
  ],
  seller: [
    {
      items: [
        { label: "Dashboard", href: "/seller", icon: LayoutDashboard, exact: true },
        { label: "Products", href: "/seller/products", icon: Boxes },
        { label: "Add Product", href: "/seller/products/new", icon: PlusCircle },
        { label: "Inventory", href: "/seller/inventory", icon: Warehouse },
      ],
    },
    {
      heading: "Sales",
      items: [
        { label: "Orders", href: "/seller/orders", icon: TruckIcon },
        { label: "Returns", href: "/seller/returns", icon: RotateCcw },
        { label: "Revenue", href: "/seller/revenue", icon: TrendingUp },
        { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
      ],
    },
    {
      heading: "Store",
      items: [
        { label: "Storefront", href: "/seller/storefront", icon: Store },
        { label: "Stripe Connect", href: "/seller/payouts", icon: CreditCard },
        { label: "Settings", href: "/seller/settings", icon: Settings },
      ],
    },
  ],
  admin: [
    {
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Seller Approvals", href: "/admin/approvals", icon: UserCheck, badgeKey: "approvals" },
      ],
    },
    {
      heading: "Marketplace",
      items: [
        { label: "Products", href: "/admin/products", icon: ShoppingBag },
        { label: "Orders", href: "/admin/orders", icon: Receipt },
        { label: "Returns", href: "/admin/returns", icon: RotateCcw },
        { label: "Commissions", href: "/admin/commissions", icon: Percent },
      ],
    },
    {
      heading: "Operations",
      items: [
        { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
        { label: "System Health", href: "/admin/system", icon: Activity },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ],
  auditor: [
    {
      items: [
        { label: "Dashboard", href: "/auditor", icon: LayoutDashboard, exact: true },
        { label: "Audit Trail", href: "/auditor/audit-trail", icon: FileSearch },
        { label: "Order Tracking", href: "/auditor/orders", icon: ClipboardList },
      ],
    },
    {
      heading: "Compliance",
      items: [
        { label: "Compliance Reports", href: "/auditor/reports", icon: ShieldCheck },
        { label: "Commission Ledger", href: "/auditor/commissions", icon: Percent },
      ],
    },
  ],
};
