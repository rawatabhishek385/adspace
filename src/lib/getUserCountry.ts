import { prisma } from "@/lib/prisma";
import { cache } from "react";

/**
 * Server-side helper to fetch the user's country from the database.
 * Wrapped with React `cache()` so multiple calls within the same
 * server request only hit the DB once.
 */
export const getUserCountry = cache(async (userId: string): Promise<string | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });
    return user?.country || null;
  } catch {
    return null;
  }
});
