import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CategoriesTabs } from "./CategoriesTabs";

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

  const blogCategories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { blogs: true },
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
      <CategoriesTabs listingCategories={categories} blogCategories={blogCategories} />
    </div>
  );
}
