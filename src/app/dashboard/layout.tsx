export const dynamic = 'force-dynamic';
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { requireAuth } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
        {children}
      </div>
    </div>
  );
}
