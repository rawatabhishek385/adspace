import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CategoryManager } from "./CategoryManager";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { listings: true },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Categories</h2>
          <p className="mt-1 text-slate-500 text-sm">
            Create, edit, and delete advertising space categories
          </p>
        </div>
      </div>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
