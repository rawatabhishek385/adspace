"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  _count?: {
    blogs: number;
  };
}

interface BlogCategoryManagerProps {
  initialCategories: BlogCategory[];
}

export function BlogCategoryManager({ initialCategories }: BlogCategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>(initialCategories);
  
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccessMsg(null);
    }, 3000);
  };

  // ─── Create ───────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/blogs/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDescription }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showMessage(data.message || "Failed to create", true);
        return;
      }

      setCategories((prev) => [...prev, { ...data.data, _count: { blogs: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewDescription("");
      showMessage("Blog category created successfully");
      router.refresh();
    } catch {
      showMessage("Failed to create blog category", true);
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Update ───────────────────────────────────────────────────────

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/blogs/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showMessage(data.message || "Failed to update", true);
        return;
      }

      setCategories((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name: data.data.name, slug: data.data.slug, description: data.data.description } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      setEditName("");
      setEditDescription("");
      showMessage("Blog category updated successfully");
      router.refresh();
    } catch {
      showMessage("Failed to update blog category", true);
    } finally {
      setUpdatingId(null);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete blog category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/blogs/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showMessage(data.message || "Failed to delete", true);
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      showMessage("Blog category deleted successfully");
      router.refresh();
    } catch {
      showMessage("Failed to delete blog category", true);
    }
  };

  // ─── Start Editing ────────────────────────────────────────────────

  const startEditing = (category: BlogCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  return (
    <div className="space-y-6">
      {/* ─── Messages ──────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-500 text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-500 text-sm">
          {successMsg}
        </div>
      )}

      {/* ─── Create Form ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <h3 className="text-sm font-medium text-slate-500 mb-4">Add New Blog Category</h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={isCreating || !newName.trim()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap shadow-sm"
          >
            {isCreating ? "Adding..." : "+ Add Category"}
          </button>
        </form>
      </div>

      {/* ─── Category List ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium text-slate-500 whitespace-nowrap">
            All Blog Categories ({categories.length})
          </h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full max-w-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
          />
        </div>

        {filteredCategories.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 text-sm">No blog categories yet. Create your first one above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredCategories.map((category) => (
              <li key={category.id} className="px-6 py-4 flex items-center justify-between gap-4">
                {editingId === category.id ? (
                  /* ─── Edit Mode ──────────────────────────────────── */
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 w-full px-3 py-1.5 bg-slate-50 border border-amber-500/50 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description"
                      className="flex-1 w-full px-3 py-1.5 bg-slate-50 border border-amber-500/50 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(category.id)}
                        disabled={updatingId === category.id}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        {updatingId === category.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ─── View Mode ──────────────────────────────────── */
                  <>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="text-slate-700 font-medium truncate">{category.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Slug: {category.slug} {category.description && `• ${category.description}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {category._count?.blogs || 0} blog{(category._count?.blogs !== 1) ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(category)}
                        className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-50 border border-red-200 rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
