"use client";

import { useState } from "react";
import { CategoryManager } from "./CategoryManager";
import { BlogCategoryManager } from "./BlogCategoryManager";

interface CategoriesTabsProps {
  listingCategories: any[];
  blogCategories: any[];
}

export function CategoriesTabs({ listingCategories, blogCategories }: CategoriesTabsProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "blogs">("listings");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("listings")}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "listings"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          Listing Categories
        </button>
        <button
          onClick={() => setActiveTab("blogs")}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "blogs"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          Blog Categories
        </button>
      </div>

      <div>
        {activeTab === "listings" && <CategoryManager initialCategories={listingCategories} />}
        {activeTab === "blogs" && <BlogCategoryManager initialCategories={blogCategories} />}
      </div>
    </div>
  );
}
