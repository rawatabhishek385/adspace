import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import type { RegisterInput, ApiResponse, SafeUser } from "@/types/auth.types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SafeUser>>> {
  try {
    const body = (await request.json()) as RegisterInput;

    const { 
      name, email, password, phone, country, state, city,
      applyInfluencer, influencerType, companyName, description,
      influencerCategory, influencerCity, followers, pricePerPost, profileImage,
      instagramUrl, youtubeUrl, twitterUrl, linkedinUrl, facebookUrl
    } = body;

    // ─── Validation ────────────────────────────────────────────────────

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    if (
      !password || 
      password.length < 8 || 
      !/[A-Z]/.test(password) || 
      !/[a-z]/.test(password) || 
      !/[0-9]/.test(password)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
        },
        { status: 400 }
      );
    }

    // ─── Duplicate Email Check ─────────────────────────────────────────

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ─── Hash Password ─────────────────────────────────────────────────

    const hashedPassword = await bcrypt.hash(password, 12);

    // ─── Generate Verification Token ───────────────────────────────────
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // ─── Create User ───────────────────────────────────────────────────

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone?.trim() || null,
        country: country?.trim() || null,
        state: state?.trim() || null,
        city: city?.trim() || null,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpires,
        influencerProfile: applyInfluencer && influencerType ? {
          create: {
            type: influencerType,
            companyName: companyName?.trim() || null,
            description: description?.trim() || null,
            category: influencerCategory?.trim() || null,
            city: influencerCity?.trim() || null,
            followers: followers ? Number(followers) : null,
            pricePerPost: pricePerPost ? Number(pricePerPost) : null,
            profileImage: profileImage?.trim() || null,
            instagramUrl: instagramUrl?.trim() || null,
            youtubeUrl: youtubeUrl?.trim() || null,
            twitterUrl: twitterUrl?.trim() || null,
            linkedinUrl: linkedinUrl?.trim() || null,
            facebookUrl: facebookUrl?.trim() || null,
            status: "PENDING",
          }
        } : undefined,
      },
      omit: {
        password: true,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      const notificationsData = admins.map((admin: any) => ({
        userId: admin.id,
        title: "New User Registration",
        message: `A new user ${user.name} (${user.email}) has registered.`,
        type: "ADMIN" as any,
        actionUrl: "/admin/users"
      }));
      
      await prisma.notification.createMany({
        data: notificationsData,
      });

      if (applyInfluencer) {
        const influencerNotificationsData = admins.map((admin: any) => ({
          userId: admin.id,
          title: "New Influencer Application",
          message: `User ${user.name} applied for an influencer profile as ${influencerType}.`,
          type: "ADMIN" as any,
          actionUrl: "/admin/influencers"
        }));
        
        await prisma.notification.createMany({
          data: influencerNotificationsData,
        });
      }
    }

    // ─── Send Email ────────────────────────────────────────────────────
    
    let emailSent = true;
    try {
      const baseUrl = request.headers.get("origin") || request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
      await sendVerificationEmail(user.email, verificationToken, baseUrl);
    } catch (err) {
      console.error("Failed to send verification email:", err);
      emailSent = false;
    }

    return NextResponse.json(
      {
        success: true,
        message: emailSent
          ? (applyInfluencer ? "Account created successfully. Your influencer request has been submitted and is awaiting admin approval." : "Registration successful. Please check your email to verify your account.")
          : "Registration successful, but the verification email could not be sent. Please log in to request another one.",
        data: user as SafeUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
