import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export default async function AdminBlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return notFound();
  }

  // Fetch blog WITHOUT incrementing views (Analytics Exclusion)
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: {
      author: true,
      category: true,
      tags: true,
    }
  });

  if (!blog) {
    return notFound();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm max-w-4xl mx-auto w-full">
      {/* Preview Header Banner */}
      <div className="bg-amber-500 text-amber-50 py-2 px-4 flex justify-between items-center text-sm font-medium">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Admin Preview Mode
        </div>
        <div className="flex gap-4">
          <span>Status: {blog.status}</span>
          <span>Views Tracking: Disabled</span>
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
              {blog.featuredImage || blog.coverImage ? (
                <img 
                  src={blog.featuredImage || blog.coverImage || ""} 
                  alt="Thumbnail" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  No Featured Image
                </div>
              )}
              {blog.category && (
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-amber-600 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {blog.category.name}
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-900 text-lg line-clamp-2 mb-2 leading-tight">
                {blog.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {blog.excerpt || "No excerpt provided for this blog post."}
              </p>
              <div className="flex items-center text-xs text-slate-400 font-medium">
                <span>{new Date().toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>{blog.readTime || 0} min read</span>
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
              {blog.category && (
                <span className="text-amber-600 font-bold tracking-wider uppercase text-xs mb-4 inline-block">
                  {blog.category.name}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6 break-words">
                {blog.title}
              </h1>
              {blog.excerpt && (
                <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed break-words">
                  {blog.excerpt}
                </p>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  {blog.author.avatar ? (
                    <img src={blog.author.avatar} alt={blog.author.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                      {blog.author.name[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">{blog.author.name}</p>
                    <p>{format(blog.publishedAt || blog.updatedAt, "MMMM d, yyyy")} · {blog.readTime || 0} min read</p>
                  </div>
                </div>
              </div>
            </header>

            {/* Cover Image (Banner style) */}
            {blog.coverImage && (
              <figure className="mb-12 w-full rounded-2xl overflow-hidden shadow-md border border-slate-100">
                <img 
                  src={blog.coverImage} 
                  alt={blog.title} 
                  className="w-full aspect-[16/9] md:aspect-[21/9] object-cover" 
                />
              </figure>
            )}

            {/* Content Body */}
            <div 
              className="prose prose-lg prose-slate mx-auto prose-img:rounded-xl prose-a:text-amber-600 max-w-3xl"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Footer & Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map(tag => (
                    <span key={tag.id} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
