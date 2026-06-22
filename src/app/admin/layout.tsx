export const dynamic = 'force-dynamic';
import AdminSidebar from "@/components/admin/AdminSidebar";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
        {children}
      </div>
    </div>
  );
}
