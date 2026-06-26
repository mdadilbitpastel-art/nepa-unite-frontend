import { DashboardShell } from "@/layouts/dashboard-shell";

export default function AuditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell role="auditor">{children}</DashboardShell>;
}
