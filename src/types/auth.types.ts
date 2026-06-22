import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

// ─── NextAuth Module Augmentation ────────────────────────────────────────────
// Extends NextAuth's built-in types so session.user includes our custom fields.
// Without this, TypeScript only knows about { name, email, image }.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      emailVerified: boolean;
      avatar?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    emailVerified: boolean;
    avatar?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    emailVerified: boolean;
    avatar?: string | null;
  }
}

// ─── API Request / Response Types ────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country: string;
  state: string;
  city: string;
  
  // Outreach fields
  applyInfluencer?: boolean;
  influencerType?: "INDIVIDUAL" | "DIGITAL_MARKETER";
  companyName?: string;
  description?: string;
  influencerCategory?: string;
  influencerCity?: string;
  followers?: number;
  pricePerPost?: number | string;
  profileImage?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
}

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

/** User object safe for client exposure (password excluded) */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

