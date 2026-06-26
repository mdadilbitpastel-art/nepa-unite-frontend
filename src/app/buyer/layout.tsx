import { DashboardShell } from "@/layouts/dashboard-shell";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell role="buyer">{children}</DashboardShell>;
}
