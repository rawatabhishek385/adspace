import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth.config";
import type { UserRole } from "@prisma/client";

/**
 * Get the currently authenticated user from the server session.
 * Returns the session user object or null if not authenticated.
 *
 * Use this for optional auth checks (e.g., showing different UI for logged-in users).
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Get the current user's role.
 * Returns the UserRole or null if not authenticated.
 *
 * Use this for role-based UI rendering.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.role ?? null;
}

/**
 * Require authentication. Returns the session user or redirects to /login.
 *
 * Use this in Server Components and Server Actions that must be protected.
 * The redirect() call throws internally, so code after this call
 * is guaranteed to have an authenticated user.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

/**
 * Require ADMIN role. Returns the session user or redirects.
 *
 * - Not authenticated → redirect to /login
 * - Authenticated but not ADMIN → redirect to /dashboard
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session.user;
}
