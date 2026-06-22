"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: "USER" | "ADMIN";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  _count: { listings: number };
}

interface Props {
  initialUsers: User[];
}

export function UserTable({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const apiPatch = async (id: string, body: object, optimisticUpdate: (u: User) => User) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      setUsers((prev) => prev.map((u) => (u.id === id ? optimisticUpdate(u) : u)));
      showToast("Updated successfully");
    } catch {
      showToast("Action failed", "error");
    } finally {
      setLoading(null);
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("User deleted");
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
          toast.type === "success"
            ? "bg-blue-100 border border-blue-500/40 text-blue-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", val: users.length, color: "text-slate-800" },
          { label: "Active", val: users.filter((u) => u.isActive).length, color: "text-blue-500" },
          { label: "Disabled", val: users.filter((u) => !u.isActive).length, color: "text-red-500" },
          { label: "Admins", val: users.filter((u) => u.role === "ADMIN").length, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Listings</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className={`hover:bg-white/[0.02] transition-colors ${loading === user.id ? "opacity-50 pointer-events-none" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${user.id}`} className="block w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-semibold text-sm shrink-0 hover:opacity-80 transition-opacity overflow-hidden">
                          {user.avatar ? (
                            <Image src={user.avatar} alt={user.name} width={36} height={36} className="w-full h-full object-cover" />
                          ) : (
                            user.name[0]?.toUpperCase()
                          )}
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/profile/${user.id}`} className="text-slate-700 font-medium truncate hover:text-blue-500 transition-colors block">
                            {user.name}
                          </Link>
                          <p className="text-slate-500 text-xs truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-amber-100 text-amber-500 border border-amber-500/30"
                          : "bg-slate-500/20 text-slate-500 border border-slate-500/30"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 w-fit">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-blue-100 text-blue-500 border border-blue-200"
                            : "bg-red-500/20 text-red-500 border border-red-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-blue-400" : "bg-red-400"}`} />
                          {user.isActive ? "Active" : "Disabled"}
                        </span>
                        
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.emailVerified
                            ? "bg-blue-100 text-blue-500 border border-blue-500/30"
                            : "bg-slate-500/20 text-slate-500 border border-slate-500/30"
                        }`}>
                          {user.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{user._count.listings}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Verify / Unverify */}
                        {!user.emailVerified ? (
                          <button
                            onClick={() => apiPatch(user.id, { emailVerified: true }, (u) => ({ ...u, emailVerified: true }))}
                            className="px-2.5 py-1 text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Verify Email
                          </button>
                        ) : (
                          <button
                            onClick={() => apiPatch(user.id, { emailVerified: false }, (u) => ({ ...u, emailVerified: false }))}
                            className="px-2.5 py-1 text-xs bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-lg hover:bg-slate-500/20 transition-colors"
                          >
                            Unverify
                          </button>
                        )}
                        {/* Enable / Disable */}
                        {user.isActive ? (
                          <button
                            onClick={() => apiPatch(user.id, { isActive: false }, (u) => ({ ...u, isActive: false }))}
                            className="px-2.5 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => apiPatch(user.id, { isActive: true }, (u) => ({ ...u, isActive: true }))}
                            className="px-2.5 py-1 text-xs bg-blue-50 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Enable
                          </button>
                        )}
                        {/* Promote / Demote */}
                        {user.role === "USER" ? (
                          <button
                            onClick={() => apiPatch(user.id, { role: "ADMIN" }, (u) => ({ ...u, role: "ADMIN" }))}
                            className="px-2.5 py-1 text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            → Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => apiPatch(user.id, { role: "USER" }, (u) => ({ ...u, role: "USER" }))}
                            className="px-2.5 py-1 text-xs bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-lg hover:bg-slate-500/20 transition-colors"
                          >
                            → User
                          </button>
                        )}
                        {/* Delete */}
                        <button
                          onClick={() => deleteUser(user.id, user.name)}
                          className="px-2.5 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          Showing {filtered.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}
