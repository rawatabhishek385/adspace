import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resendSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Invalid email" }, { status: 400 });
    }

    const { email } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return NextResponse.json({ success: true, message: "Verification email sent if account exists." }, { status: 200 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: false, message: "Email is already verified." }, { status: 400 });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpires,
      },
    });

    // Send new email
    await sendVerificationEmail(user.email, verificationToken);

    return NextResponse.json({ success: true, message: "Verification email sent." }, { status: 200 });
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
