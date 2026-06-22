import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const [
    totalUsers,
    totalListings,
    activeListings,
    featuredListings,
    totalCategories,
    adminCount,
    disabledUsers,
    pendingReports,
    recentUsers,
    recentListings,
    activityLogs,
    aggregateViews,
    topViewedListings,
    topCities,
    topCategoriesGroup,
    allCategories
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { isActive: true } }),
    prisma.listing.count({ where: { isFeatured: true } }),
    prisma.category.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        owner: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.listing.aggregate({
      _sum: { viewCount: true }
    }),
    prisma.listing.findMany({
      orderBy: { viewCount: "desc" },
      take: 5,
      include: { category: true }
    }),
    prisma.listing.groupBy({
      by: ['city'],
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 5,
    }),
    prisma.listing.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: "desc" } },
      take: 5,
    }),
    prisma.category.findMany(), // Needed to map category IDs to names for the grouping
  ]);

  const totalViews = aggregateViews._sum.viewCount || 0;

  const topCategoryData = topCategoriesGroup.map(g => ({
    name: allCategories.find(c => c.id === g.categoryId)?.name || "Unknown",
    count: g._count.categoryId
  }));

  const actionLabel: Record<string, { label: string; color: string }> = {
    USER_DISABLED:    { label: "User Disabled",     color: "text-red-500" },
    USER_ENABLED:     { label: "User Enabled",       color: "text-blue-500" },
    USER_PROMOTED:    { label: "Promoted to Admin",  color: "text-amber-500" },
    USER_DEMOTED:     { label: "Demoted to User",    color: "text-slate-500" },
    USER_DELETED:     { label: "User Deleted",       color: "text-red-500" },
    LISTING_FEATURED: { label: "Listing Featured",   color: "text-amber-500" },
    LISTING_UNFEATURED:{ label: "Listing Unfeatured", color: "text-slate-500" },
    LISTING_DISABLED: { label: "Listing Disabled",   color: "text-red-500" },
    LISTING_ENABLED:  { label: "Listing Enabled",    color: "text-blue-500" },
    LISTING_DELETED:  { label: "Listing Deleted",    color: "text-red-500" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
        <p className="mt-1 text-slate-500 text-sm">Platform overview and management tools</p>
      </div>

      {/* ─── Stats Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users",      val: totalUsers,      icon: "👥", color: "from-blue-500/20 to-blue-600/10",    border: "border-blue-500/20",    text: "text-blue-500" },
          { label: "Total Listings",   val: totalListings,   icon: "📋", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20", text: "text-blue-500" },
          { label: "Active Listings",  val: activeListings,  icon: "✅", color: "from-blue-500/10 to-blue-600/5",  border: "border-blue-500/10",  text: "text-blue-500" },
          { label: "Featured",         val: featuredListings, icon: "⭐", color: "from-amber-500/20 to-amber-600/10",   border: "border-amber-500/20",   text: "text-amber-500" },
          { label: "Categories",       val: totalCategories, icon: "🏷️", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20",  text: "text-purple-500" },
          { label: "Admins",           val: adminCount,      icon: "🛡️", color: "from-amber-500/10 to-amber-600/5",    border: "border-amber-500/10",   text: "text-amber-500" },
          { label: "Disabled Users",   val: disabledUsers,   icon: "🚫", color: "from-red-500/20 to-red-600/10",       border: "border-red-200",     text: "text-red-500" },
          { label: "Pending Reports",  val: pendingReports,  icon: "🚩", color: "from-red-500/10 to-red-600/5",        border: "border-red-500/10",     text: "text-red-500" },
          { label: "Total Views",      val: totalViews,      icon: "👁️", color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/20",  text: "text-indigo-400" },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-5 backdrop-blur-xl`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className={`text-3xl font-bold ${s.text} mt-1`}>{s.val}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Quick Actions ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: "/admin/users",      label: "Manage Users",      icon: "👥", color: "bg-blue-100 hover:bg-blue-500/30 text-blue-500 border-blue-500/20" },
            { href: "/admin/listings",   label: "Moderate Listings", icon: "📋", color: "bg-blue-100 hover:bg-blue-500/30 text-blue-500 border-blue-500/20" },
            { href: "/admin/categories", label: "Categories",        icon: "🏷️", color: "bg-purple-100 hover:bg-purple-500/30 text-purple-500 border-purple-500/20" },
            { href: "/admin/reports",    label: "View Reports",      icon: "🚩", color: "bg-red-500/20 hover:bg-red-500/30 text-red-500 border-red-200" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${a.color} border rounded-2xl p-4 text-center font-medium text-sm transition-all duration-200 hover:scale-[1.02] flex flex-col items-center gap-2`}
            >
              <span className="text-2xl">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Two Column: Recent Users & Recent Listings ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Newest Users</h3>
            <Link href="/admin/users" className="text-xs text-blue-500 hover:text-blue-600 transition-colors">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentUsers.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">No users yet</div>
            ) : (
              recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                    {u.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-amber-100 text-amber-500" : "bg-slate-500/20 text-slate-500"}`}>{u.role}</span>
                    {!u.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">Disabled</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Listings */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Newest Listings</h3>
            <Link href="/admin/listings" className="text-xs text-blue-500 hover:text-blue-600 transition-colors">View all →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentListings.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500 text-sm">No listings yet</div>
            ) : (
              recentListings.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{l.title}</p>
                    <p className="text-xs text-slate-500">{l.owner.name} · {l.category.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.isActive ? "bg-blue-100 text-blue-500" : "bg-red-500/20 text-red-500"}`}>
                      {l.isActive ? "Active" : "Disabled"}
                    </span>
                    {l.isFeatured && <span className="text-xs bg-amber-100 text-amber-500 px-2 py-0.5 rounded-full">⭐</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Activity Log ─────────────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Latest admin actions on the platform</p>
        </div>
        {activityLogs.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">No activity yet. Actions on users and listings will appear here.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activityLogs.map((log) => {
              const meta = actionLabel[log.action] ?? { label: log.action, color: "text-slate-600" };
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                    {log.details && <span className="text-slate-500 text-xs ml-2">{log.details}</span>}
                    <p className="text-xs text-slate-500 mt-0.5">by {log.actor.name}</p>
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">
                    {new Date(log.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
