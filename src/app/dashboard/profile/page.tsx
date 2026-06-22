import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Profile Settings</h1>
        <p className="text-slate-500">Manage your public profile information and avatar.</p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
