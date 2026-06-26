import { DashboardShell } from "@/layouts/dashboard-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
