import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { role, isActive, emailVerified }: { role?: UserRole; isActive?: boolean; emailVerified?: boolean } = body;

  if (id === session.user.id) {
    return NextResponse.json({ success: false, message: "Cannot modify your own account" }, { status: 400 });
  }

  const updateData: { role?: UserRole; isActive?: boolean; emailVerified?: boolean } = {};
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  // Log the activity
  const action = emailVerified === true ? "USER_VERIFIED"
    : emailVerified === false ? "USER_UNVERIFIED"
    : isActive === false ? "USER_DISABLED"
    : isActive === true ? "USER_ENABLED"
    : role === "ADMIN" ? "USER_PROMOTED"
    : "USER_DEMOTED";

  await prisma.activityLog.create({
    data: {
      action,
      details: `User: ${user.email}`,
      actorId: session.user.id,
      targetId: id,
    },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ success: false, message: "Cannot delete your own account" }, { status: 400 });
  }

  // 1. Delete UserReports involving this user
  await prisma.userReport.deleteMany({ where: { OR: [{ reporterId: id }, { reportedUserId: id }] } });

  // 2. Delete Conversations involving this user (cascades to Messages and Reviews)
  await prisma.conversation.deleteMany({ where: { OR: [{ buyerId: id }, { ownerId: id }] } });

  // 3. Delete ListingReviews authored by this user
  await prisma.listingReview.deleteMany({ where: { reviewerId: id } });

  // 4. Delete ActivityLogs & Reports authored by this user
  await prisma.activityLog.deleteMany({ where: { actorId: id } });
  await prisma.report.deleteMany({ where: { reporterId: id } });
  
  // 5. Delete Listings owned by this user (and their dependencies)
  const listings = await prisma.listing.findMany({
    where: { ownerId: id },
  });

  for (const listing of listings) {
    await prisma.media.deleteMany({ where: { listingId: listing.id } });
    await prisma.report.deleteMany({ where: { listingId: listing.id } });
    await prisma.listingReview.deleteMany({ where: { listingId: listing.id } });
  }
  await prisma.listing.deleteMany({ where: { ownerId: id } });

  // Finally delete the user
  await prisma.user.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      action: "USER_DELETED",
      details: `User ID: ${id}`,
      actorId: session.user.id,
      targetId: id,
    },
  });

  return NextResponse.json({ success: true, message: "User deleted" });
}
