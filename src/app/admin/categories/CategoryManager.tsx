"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdAt: Date;
  _count: {
    listings: number;
  };
}

interface CategoryManagerProps {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const newImageRef = useRef<HTMLInputElement>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const editImageRef = useRef<HTMLInputElement>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
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
      let imageUrl = undefined;
      if (newImage) {
        setLoadingStatus("Uploading image...");
        const formData = new FormData();
        formData.append("files", newImage);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data?.[0]?.url) imageUrl = uploadData.data[0].url;
      }

      setLoadingStatus("Creating category...");

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, imageUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message, true);
        return;
      }

      setCategories((prev) => [...prev, { ...data.data, _count: { listings: 0 } }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewImage(null);
      if (newImageRef.current) newImageRef.current.value = "";
      showMessage("Category created successfully");
      router.refresh();
    } catch {
      showMessage("Failed to create category", true);
    } finally {
      setIsCreating(false);
      setLoadingStatus(null);
    }
  };

  // ─── Update ───────────────────────────────────────────────────────

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    setUpdatingId(id);
    try {
      let imageUrl = undefined;
      if (editImage) {
        setLoadingStatus("Uploading image...");
        const formData = new FormData();
        formData.append("files", editImage);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.data?.[0]?.url) imageUrl = uploadData.data[0].url;
      }

      setLoadingStatus("Saving changes...");

      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, ...(imageUrl && { imageUrl }) }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message, true);
        return;
      }

      setCategories((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name: data.data.name, ...(data.data.imageUrl && { imageUrl: data.data.imageUrl }) } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      setEditName("");
      setEditImage(null);
      showMessage("Category updated successfully");
      router.refresh();
    } catch {
      showMessage("Failed to update category", true);
    } finally {
      setUpdatingId(null);
      setLoadingStatus(null);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message, true);
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      showMessage("Category deleted successfully");
      router.refresh();
    } catch {
      showMessage("Failed to delete category", true);
    }
  };

  // ─── Start Editing ────────────────────────────────────────────────

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditImage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditImage(null);
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
        <h3 className="text-sm font-medium text-slate-500 mb-4">Add New Category</h3>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter category name..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              ref={newImageRef}
              onChange={(e) => setNewImage(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => newImageRef.current?.click()}
              disabled={isCreating}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
            >
              {loadingStatus === "Uploading image..." ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : newImage ? (
                <>
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Image Selected
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Upload Logo
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={isCreating || !newName.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap shadow-sm"
            >
              {isCreating && loadingStatus !== "Uploading image..." ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {loadingStatus || "Adding..."}
                </>
              ) : isCreating && loadingStatus === "Uploading image..." ? (
                "Please wait..."
              ) : (
                "+ Add Category"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Category List ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium text-slate-500 whitespace-nowrap">
            All Categories ({categories.length})
          </h3>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full max-w-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        {filteredCategories.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 text-sm">No categories yet. Create your first one above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredCategories.map((category) => (
              <li key={category.id} className="px-6 py-4 flex items-center justify-between gap-4">
                {editingId === category.id ? (
                  /* ─── Edit Mode ──────────────────────────────────── */
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      ref={editImageRef}
                      onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editImageRef.current?.click()}
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                      title="Update Logo"
                    >
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </button>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(category.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      autoFocus
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-blue-500/50 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    <button
                      onClick={() => handleUpdate(category.id)}
                      disabled={updatingId === category.id}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      {updatingId === category.id ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {loadingStatus === "Uploading image..." ? "Uploading..." : "Saving"}
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  /* ─── View Mode ──────────────────────────────────── */
                  <>
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xl">
                          📁
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-slate-700 font-medium truncate">{category.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {category._count.listings} listing{category._count.listings !== 1 ? "s" : ""}
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
