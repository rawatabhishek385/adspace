import { prisma } from "@/lib/prisma";
import { UserTable } from "./UserTable";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="mt-1 text-slate-400 text-sm">
            {users.length} registered {users.length === 1 ? "user" : "users"} on the platform
          </p>
        </div>
      </div>

      <UserTable initialUsers={users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))} />
    </div>
  );
}
