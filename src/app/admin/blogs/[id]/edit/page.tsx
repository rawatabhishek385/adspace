"use client";

import { useEffect, useState, use } from "react";
import BlogForm from "@/components/admin/blogs/BlogForm";

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/admin/blogs/${id}`);
        const json = await res.json();
        if (json.success) {
          setInitialData(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading blog data...</div>;
  if (!initialData) return <div className="p-8 text-center text-red-500">Blog not found.</div>;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Edit Blog</h1>
        <p className="text-sm text-slate-500">Make changes to your blog post.</p>
      </div>
      
      <BlogForm initialData={initialData} />
    </div>
  );
}
