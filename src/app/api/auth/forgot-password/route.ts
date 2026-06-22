import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Simple in-memory rate limiting (Note: In production with multiple instances/serverless, use Redis)
const rateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 3;

  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return false;
  }

  if (now - record.firstRequestTime > windowMs) {
    rateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Invalid email" }, { status: 400 });
    }

    const { email } = result.data;

    // 2. Look up user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // 3. Constant-time-like uniform response to prevent enumeration
    // Even if user is not found, we proceed with a fake delay and return success.
    if (!user) {
      // Add a slight artificial delay to mimic the hashing/email time
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      return NextResponse.json(
        { success: true, message: "If an account exists for this email address, a password reset link has been sent." },
        { status: 200 }
      );
    }

    // 4. Generate a secure random raw token
    const rawToken = crypto.randomBytes(32).toString("hex");
    
    // 5. Hash the token (SHA-256) for DB storage
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // 6. Save hashed token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: tokenExpires,
      },
    });

    // 7. Send email with RAW token
    const baseUrl = request.headers.get("origin") || request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
    await sendPasswordResetEmail(user.email, rawToken, baseUrl);

    return NextResponse.json(
      { success: true, message: "If an account exists for this email address, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
