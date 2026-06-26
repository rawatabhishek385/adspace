"use client";

import BlogForm from "@/components/admin/blogs/BlogForm";

export default function CreateBlogPage() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Create New Blog</h1>
        <p className="text-sm text-slate-500">Write a new blog post and save it as a draft or publish it.</p>
      </div>
      
      <BlogForm />
    </div>
  );
}
