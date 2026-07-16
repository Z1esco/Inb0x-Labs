import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { requireCurrentUser } from "@/server/auth/current-user";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
