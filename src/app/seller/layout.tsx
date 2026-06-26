import { DashboardShell } from "@/layouts/dashboard-shell";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell role="seller">{children}</DashboardShell>;
}
