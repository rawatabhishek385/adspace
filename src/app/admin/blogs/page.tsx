"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AdminBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [sort, setSort] = useState("newest");
  
  // Delete Modal
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ search, status, categoryId, sort });
      const res = await fetch(`/api/admin/blogs?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBlogs(json.data);
        setStats(json.stats);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/blogs/categories");
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [search, status, categoryId, sort]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Blog deleted successfully");
        setIsDeleting(null);
        fetchBlogs();
      } else {
        toast.error(json.message || "Failed to delete blog");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleAction = async (id: string, action: "publish" | "archive") => {
    try {
      const res = await fetch(`/api/admin/blogs/${id}/${action}`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        toast.success(`Blog ${action}ed successfully`);
        fetchBlogs();
      } else {
        toast.error(json.message || `Failed to ${action} blog`);
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Blog Management</h1>
          <p className="text-sm text-slate-500">Create, edit, and organize your blog content.</p>
        </div>
        <Link 
          href="/admin/blogs/create" 
          className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors text-sm shadow-sm shadow-amber-500/20 text-center"
        >
          + Create Blog
        </Link>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Blogs", value: stats.total || 0, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Published", value: stats.published || 0, color: "text-green-600", bg: "bg-green-50" },
          { label: "Drafts", value: stats.draft || 0, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Archived", value: stats.archived || 0, color: "text-red-600", bg: "bg-red-50" },
          { label: "Featured", value: stats.featured || 0, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">{stat.label}</span>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto md:min-w-[250px]">
          <input 
            type="text"
            placeholder="Search titles or slugs..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select 
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select 
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_viewed">Most Viewed</option>
            <option value="last_updated">Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Blog</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading blogs...</td></tr>
              ) : blogs.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No blogs found.</td></tr>
              ) : blogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {blog.coverImage ? (
                        <img src={blog.coverImage} alt={blog.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <span className="truncate max-w-[200px]">{blog.title}</span>
                          {blog.isFeatured && <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Featured</span>}
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{blog.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {blog.category?.name ? (
                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium">{blog.category.name}</span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      blog.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                      blog.status === "DRAFT" ? "bg-slate-100 text-slate-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      {blog.author.avatar ? (
                         <img src={blog.author.avatar} alt={blog.author.name} className="w-6 h-6 rounded-full" />
                      ) : (
                         <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{blog.author.name[0]}</div>
                      )}
                      {blog.author.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-600">Views: <span className="font-semibold">{blog.views}</span></span>
                      <span className="text-xs text-slate-500">{blog.readTime || 0} min read</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-slate-500">Upd: {format(new Date(blog.updatedAt), "MMM d, yyyy")}</span>
                      {blog.publishedAt && <span className="text-[11px] text-slate-400">Pub: {format(new Date(blog.publishedAt), "MMM d, yyyy")}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/blogs/${blog.id}/edit`} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </Link>
                      <Link href={`/admin/blogs/${blog.id}/preview`} target="_blank" className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Preview">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </Link>
                      {blog.status !== "PUBLISHED" && (
                        <button onClick={() => handleAction(blog.id, "publish")} className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors" title="Publish">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                      {blog.status !== "ARCHIVED" && (
                        <button onClick={() => handleAction(blog.id, "archive")} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Archive">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        </button>
                      )}
                      <button onClick={() => setIsDeleting(blog.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 flex flex-col gap-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">Delete Blog</h3>
            <p className="text-sm text-slate-600">Are you sure you want to delete this blog? This action cannot be undone.</p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setIsDeleting(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(isDeleting)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-sm shadow-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
