import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://adspace-marketplace.com';

  // Fetch all active listings
  const listings = await prisma.listing.findMany({
    where: { isActive: true },
    select: { slug: true, id: true, updatedAt: true },
  });

  // Fetch public influencer profiles
  const influencers = await prisma.influencerProfile.findMany({
    where: { status: "APPROVED", isPublic: true },
    select: { userId: true, updatedAt: true },
  });

  const listingUrls = listings.map((listing) => ({
    url: `${baseUrl}/listings/${listing.slug || listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const influencerUrls = influencers.map((influencer) => ({
    url: `${baseUrl}/profile/${influencer.userId}`,
    lastModified: influencer.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/outreach/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/outreach`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...listingUrls,
    ...influencerUrls,
  ];
}
