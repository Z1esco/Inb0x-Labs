import { DashboardView } from "@/components/dashboard-view";
import { getEnvironment } from "@/lib/env";
import { getDemoDashboard } from "@/mock/dashboard";

export default function DashboardPage() {
  const initialData = getEnvironment().DEMO_MODE
    ? getDemoDashboard("UTC")
    : undefined;
  return initialData ? (
    <DashboardView initialData={initialData} />
  ) : (
    <DashboardView />
  );
}
