import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReportStatusSelect from "@/components/admin/ReportStatusSelect";

export default async function AdminReportsPage() {
  const [listingReports, userReports, influencerReports] = await Promise.all([
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, slug: true } },
        reporter: { select: { id: true, name: true, email: true, avatar: true } },
      },
    }),
    prisma.userReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, email: true, avatar: true } },
        reportedUser: { select: { id: true, name: true, email: true, avatar: true } },
      },
    }),
    prisma.influencerReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, email: true, avatar: true } },
        influencer: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      },
    }),
  ]);

  const statusColors: Record<string, string> = {
    PENDING:  "bg-amber-100 text-amber-500 border-amber-500/30",
    REVIEWED: "bg-blue-100 text-blue-500 border-blue-500/30",
    RESOLVED: "bg-blue-100 text-blue-500 border-blue-200",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports</h2>
          <p className="mt-1 text-slate-500 text-sm">
            {listingReports.length} listing report{listingReports.length !== 1 ? "s" : ""} • {userReports.length} user report{userReports.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Listing Reports", val: listingReports.length, color: "text-amber-500" },
          { label: "User Reports", val: userReports.length, color: "text-red-500" },
          { label: "Influencer Reports", val: influencerReports.length, color: "text-purple-500" },
          { label: "Pending", val: listingReports.filter(r => r.status === "PENDING").length + userReports.filter(r => r.status === "PENDING").length + influencerReports.filter(r => r.status === "PENDING").length, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Listing Reports */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Listing Reports
        </h3>

        {listingReports.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
            <p className="text-slate-500 text-sm">No listing reports yet.</p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Listing</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listingReports.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/listings/${r.listing.slug}`} className="text-slate-700 font-medium text-sm truncate max-w-[160px] block hover:text-blue-500 transition-colors">
                          {r.listing.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/profile/${r.reporter.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0 overflow-hidden">
                            {r.reporter.avatar ? (
                              <img src={r.reporter.avatar} alt={r.reporter.name} className="w-full h-full object-cover" />
                            ) : (
                              r.reporter.name[0]?.toUpperCase()
                            )}
                          </div>
                          <span className="text-slate-600 text-sm">{r.reporter.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600 text-sm">{r.reason}</p>
                        {r.description && <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{r.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <ReportStatusSelect
                          reportId={r.id}
                          reportType="listing"
                          currentStatus={r.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Reports */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          User Reports
        </h3>

        {userReports.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
            <p className="text-slate-500 text-sm">No user reports yet.</p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userReports.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/profile/${r.reportedUser.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold shrink-0 overflow-hidden">
                            {r.reportedUser.avatar ? (
                              <img src={r.reportedUser.avatar} alt={r.reportedUser.name} className="w-full h-full object-cover" />
                            ) : (
                              r.reportedUser.name[0]?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="text-slate-700 font-medium text-sm block">{r.reportedUser.name}</span>
                            <span className="text-slate-500 text-xs">{r.reportedUser.email}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/profile/${r.reporter.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0 overflow-hidden">
                            {r.reporter.avatar ? (
                              <img src={r.reporter.avatar} alt={r.reporter.name} className="w-full h-full object-cover" />
                            ) : (
                              r.reporter.name[0]?.toUpperCase()
                            )}
                          </div>
                          <span className="text-slate-600 text-sm">{r.reporter.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600 text-sm">{r.reason}</p>
                        {r.description && <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{r.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <ReportStatusSelect
                          reportId={r.id}
                          reportType="user"
                          currentStatus={r.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Influencer Reports */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Influencer Reports
        </h3>

        {influencerReports.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
            <p className="text-slate-500 text-sm">No influencer reports yet.</p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported Influencer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported By</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {influencerReports.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/profile/${r.influencer.user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 text-xs font-bold shrink-0 overflow-hidden">
                            {r.influencer.user.avatar || r.influencer.profileImage ? (
                              <img src={r.influencer.profileImage || r.influencer.user.avatar || ""} alt={r.influencer.user.name} className="w-full h-full object-cover" />
                            ) : (
                              r.influencer.user.name[0]?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="text-slate-700 font-medium text-sm block">{r.influencer.user.name}</span>
                            <span className="text-slate-500 text-xs">{r.influencer.type}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/profile/${r.reporter.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0 overflow-hidden">
                            {r.reporter.avatar ? (
                              <img src={r.reporter.avatar} alt={r.reporter.name} className="w-full h-full object-cover" />
                            ) : (
                              r.reporter.name[0]?.toUpperCase()
                            )}
                          </div>
                          <span className="text-slate-600 text-sm">{r.reporter.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-600 text-sm">{r.reason}</p>
                        {r.description && <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{r.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <ReportStatusSelect
                          reportId={r.id}
                          reportType="influencer"
                          currentStatus={r.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
