import { prisma } from "@/lib/prisma";

/**
 * Generate a URL-safe slug from a title.
 * Handles unicode, special characters, and ensures uniqueness in DB.
 *
 * Example: "Premium LED Billboard - New York" → "premium-led-billboard-new-york"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // Remove non-word chars (except spaces/hyphens)
    .replace(/[\s_]+/g, "-")    // Replace spaces/underscores with hyphens
    .replace(/-+/g, "-")        // Collapse multiple hyphens
    .replace(/^-+|-+$/g, "");   // Trim hyphens from start/end
}

/**
 * Generate a unique slug. If the base slug already exists,
 * appends a numeric suffix: "my-billboard", "my-billboard-2", etc.
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title);
  if (!baseSlug) return `listing-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.listing.findUnique({ where: { slug } });
    if (!existing) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}
