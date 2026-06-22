import { prisma } from "@/lib/prisma";
import CampaignTable from "@/components/admin/notifications/CampaignTable";
import BannerTable from "@/components/admin/notifications/BannerTable";

export default async function AdminNotificationsPage() {
  const campaigns = await prisma.notificationCampaign.findMany({
    orderBy: { createdAt: "desc" },
  });

  const banners = await prisma.announcementBanner.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notification & Campaign Hub</h2>
          <p className="mt-1 text-slate-400 text-sm">
            Manage your announcement banners and notification campaigns
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Announcement Banners</h3>
          <BannerTable initialBanners={banners} />
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Broadcast Campaigns</h3>
          <CampaignTable initialCampaigns={campaigns} />
        </section>
      </div>
    </div>
  );
}
