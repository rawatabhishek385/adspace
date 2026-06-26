"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CldUploadWidget } from "next-cloudinary";
import RichTextEditor from "./RichTextEditor";

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface BlogFormProps {
  initialData?: any;
}

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Form State
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags?.map((t: any) => t.id) || []);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  
  // Images
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || "");
  const [seoImage, setSeoImage] = useState(initialData?.seoImage || "");
  
  // SEO
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || "");
  const [seoKeywords, setSeoKeywords] = useState(initialData?.seoKeywords || "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || "");

  // Auto-save State
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "">("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/blogs/categories");
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/admin/blogs/tags");
      const json = await res.json();
      if (json.success) setTags(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Slug from Title
  useEffect(() => {
    if (!initialData && title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [title, initialData]);

  // Read Time Calculation
  const calculateReadTime = (text: string) => {
    const wordCount = text.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    return Math.ceil(wordCount / 200); // 200 words per minute
  };

  // Auto-Save Draft (Debounced)
  const autoSave = useCallback(async () => {
    if (initialData?.status === "PUBLISHED" || initialData?.status === "ARCHIVED") return; // Only auto-save drafts
    if (!title) return; // Need at least a title

    setSaveStatus("Saving...");
    try {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        categoryId: categoryId || undefined,
        tags: selectedTags,
        isFeatured,
        coverImage,
        featuredImage,
        seoImage,
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        readTime: calculateReadTime(content),
      };

      let res;
      if (initialData?.id) {
        res = await fetch(`/api/admin/blogs/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new draft
        res = await fetch("/api/admin/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, status: "DRAFT" }),
        });
      }
      
      const json = await res.json();
      if (json.success) {
        setSaveStatus("Saved");
        setLastSaved(new Date());
        if (!initialData?.id) {
          router.replace(`/admin/blogs/${json.data.id}/edit`);
        }
      } else {
        setSaveStatus("");
      }
    } catch (e) {
      setSaveStatus("");
    }
  }, [title, slug, excerpt, content, categoryId, selectedTags, isFeatured, coverImage, featuredImage, seoImage, seoTitle, seoDescription, seoKeywords, canonicalUrl, initialData, router]);

  useEffect(() => {
    if (!title) return;
    const timeout = setTimeout(() => {
      autoSave();
    }, 2000); // Debounce 2 seconds
    return () => clearTimeout(timeout);
  }, [title, slug, excerpt, content, categoryId, selectedTags, isFeatured, coverImage, featuredImage, seoImage, seoTitle, seoDescription, seoKeywords, canonicalUrl]);

  const handleSubmit = async (status: string) => {
    if (!title || !slug) {
      toast.error("Title and slug are required");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`${status === "PUBLISHED" ? "Publishing" : "Saving"} blog...`);

    const payload = {
      title,
      slug,
      excerpt,
      content,
      categoryId: categoryId || undefined,
      tags: selectedTags,
      isFeatured,
      coverImage,
      featuredImage,
      seoImage,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      status,
      readTime: calculateReadTime(content),
    };

    try {
      const url = initialData?.id ? `/api/admin/blogs/${initialData.id}` : "/api/admin/blogs";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        if (json.slugGenerated) {
          toast.success("Slug was taken, a unique one was generated.");
        }
        toast.success(status === "PUBLISHED" ? "Blog published!" : "Blog saved!", { id: toastId });
        router.push("/admin/blogs");
        router.refresh();
      } else {
        toast.error(json.message || "Failed to save blog", { id: toastId });
      }
    } catch (e) {
      toast.error("An error occurred", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTag = async () => {
    const tagName = window.prompt("New Tag Name:");
    if (!tagName) return;

    try {
      const res = await fetch("/api/admin/blogs/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName }),
      });
      const json = await res.json();
      if (json.success) {
        setTags([...tags, json.data]);
        setSelectedTags([...selectedTags, json.data.id]);
        toast.success("Tag created");
      }
    } catch (e) {
      toast.error("Failed to create tag");
    }
  };

  const renderUploadWidget = (label: string, url: string, setUrl: (u: string) => void) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {url ? (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200">
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <button 
            type="button"
            onClick={() => setUrl("")}
            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <CldUploadWidget 
          uploadPreset="ad_space" 
          onSuccess={(result: any) => setUrl(result.info.secure_url)}
          options={{ maxFiles: 1 }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-amber-500 hover:text-amber-500 transition-colors bg-slate-50"
            >
              <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span>Upload Image</span>
            </button>
          )}
        </CldUploadWidget>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column - Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Title & Slug */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Title *</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg font-semibold"
              placeholder="Enter blog title"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Slug *</label>
            <input 
              type="text" 
              value={slug} 
              onChange={e => setSlug(e.target.value)} 
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm text-slate-600 bg-slate-50"
              placeholder="url-friendly-slug"
            />
            <p className="text-xs text-slate-500 mt-1">Unique identifier for the URL. Auto-generated from title.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Excerpt</label>
            <textarea 
              value={excerpt} 
              onChange={e => setExcerpt(e.target.value)} 
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm"
              placeholder="Brief summary of the blog post"
            />
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Content *</h3>
          </div>
          <RichTextEditor content={content} onChange={setContent} />
        </div>

        {/* SEO Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col gap-4">
          <h3 className="font-semibold text-slate-800 mb-2">SEO Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">SEO Title</label>
              <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Canonical URL</label>
              <input type="text" value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">SEO Description</label>
            <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm" />
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Keywords</label>
            <input type="text" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="Comma separated keywords" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>

          <div className="mt-2">
            {renderUploadWidget("SEO Image (Open Graph)", seoImage, setSeoImage)}
          </div>
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
        
        {/* Publish Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Publishing</h3>
            {saveStatus && (
              <span className={`text-xs px-2 py-1 rounded-full ${saveStatus === "Saved" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                {saveStatus}
              </span>
            )}
          </div>
          
          {lastSaved && <p className="text-xs text-slate-500">Last saved: {lastSaved.toLocaleTimeString()}</p>}
          
          <div className="pt-2 flex flex-col gap-2">
            <button 
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button 
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20 disabled:opacity-50"
            >
              Publish Blog
            </button>
            <button 
              type="button"
              onClick={() => setShowPreview(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors text-center shadow-sm"
            >
              Preview
            </button>
          </div>
        </div>

        {/* Featured Toggle */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Featured Post</h3>
            <p className="text-xs text-slate-500">Highlight on homepage</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsFeatured(!isFeatured)}
            className={`w-12 h-6 rounded-full transition-colors relative ${isFeatured ? 'bg-amber-500' : 'bg-slate-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isFeatured ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Images */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col gap-6">
          {renderUploadWidget("Cover Image", coverImage, setCoverImage)}
          {renderUploadWidget("Featured Image (Optional)", featuredImage, setFeaturedImage)}
        </div>

        {/* Organization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Category</label>
            <select 
              value={categoryId} 
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
            >
              <option value="">Select a category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Tags</label>
              <button type="button" onClick={handleCreateTag} className="text-xs text-amber-600 font-medium hover:underline">
                + Create Tag
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto flex flex-col gap-2">
              {tags.map(t => (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    className="rounded text-amber-500 focus:ring-amber-500"
                    checked={selectedTags.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTags([...selectedTags, t.id]);
                      else setSelectedTags(selectedTags.filter(id => id !== t.id));
                    }}
                  />
                  {t.name}
                </label>
              ))}
              {tags.length === 0 && <p className="text-xs text-slate-500 italic">No tags found.</p>}
            </div>
          </div>
        </div>

      </div>

      {/* Live Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-4xl relative h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Close Button */}
            <button 
              onClick={() => setShowPreview(false)} 
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="overflow-y-auto w-full h-full">
              {/* Preview Header Banner */}
              <div className="bg-amber-500 text-amber-50 py-2 px-4 flex justify-between items-center text-sm font-medium sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Live Preview Mode
                </div>
                <div className="pr-12">
                  <span>Status: {initialData?.status || "DRAFT"}</span>
                </div>
              </div>

              {/* Preview Layout */}
              <div className="p-6 md:p-8 lg:p-12 space-y-16">
                
                {/* 1. Blog Card Preview (How it looks on the listing/homepage) */}
                <section>
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Preview</span>
                    <h2 className="text-lg font-semibold text-slate-800">Blog Card (Homepage/List View)</h2>
                  </div>
                  
                  <div className="max-w-sm mx-auto sm:mx-0 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden relative">
                      {featuredImage || coverImage ? (
                        <img 
                          src={featuredImage || coverImage} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                          No Featured Image
                        </div>
                      )}
                      {categoryId && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-amber-600 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {categories.find(c => c.id === categoryId)?.name}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 text-lg line-clamp-2 mb-2 leading-tight">
                        {title || "Untitled Blog Post"}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {excerpt || "No excerpt provided for this blog post."}
                      </p>
                      <div className="flex items-center text-xs text-slate-400 font-medium">
                        <span>{new Date().toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <span>{calculateReadTime(content)} min read</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Full Article Preview */}
                <section>
                  <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Preview</span>
                    <h2 className="text-lg font-semibold text-slate-800">Full Article View</h2>
                  </div>

                  <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10">
                    <header className="mb-10 text-center max-w-3xl mx-auto">
                      {categoryId && (
                        <span className="text-amber-600 font-bold tracking-wider uppercase text-xs mb-4 inline-block">
                          {categories.find(c => c.id === categoryId)?.name}
                        </span>
                      )}
                      <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6 break-words">
                        {title || "Untitled Blog Post"}
                      </h1>
                      {excerpt && (
                        <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed break-words">
                          {excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                            A
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-slate-800">Admin</p>
                            <p>{new Date().toLocaleDateString()} · {calculateReadTime(content)} min read</p>
                          </div>
                        </div>
                      </div>
                    </header>

                    {/* Cover Image (Banner style) */}
                    {coverImage && (
                      <figure className="mb-12 w-full rounded-2xl overflow-hidden shadow-md border border-slate-100">
                        <img 
                          src={coverImage} 
                          alt={title} 
                          className="w-full aspect-[16/9] md:aspect-[21/9] object-cover" 
                        />
                      </figure>
                    )}

                    {/* Content Body */}
                    <div 
                      className="prose prose-lg prose-slate mx-auto prose-img:rounded-xl prose-a:text-amber-600 max-w-3xl"
                      dangerouslySetInnerHTML={{ __html: content || "<p class='text-slate-400 italic text-center'>Start writing to see content...</p>" }}
                    />

                    {/* Footer & Tags */}
                    {selectedTags && selectedTags.length > 0 && (
                      <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTags.map(tagId => {
                            const t = tags.find(tag => tag.id === tagId);
                            return t ? (
                              <span key={t.id} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                                #{t.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
