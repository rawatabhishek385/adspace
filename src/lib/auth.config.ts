import { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";
import crypto from "crypto";



export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate that credentials were provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No account found with this email");
        }

        // Check if the account is active (admin can disable accounts)
        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Contact support.");
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in.");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Bump sessionVersion on successful login to invalidate other browsers/devices
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { sessionVersion: { increment: 1 } },
        });

        // Return user object — NextAuth stores this in the JWT
        return {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          emailVerified: updatedUser.emailVerified,
          avatar: updatedUser.avatar,
          sessionVersion: updatedUser.sessionVersion,
        };
      },
    }),
  ],

  callbacks: {
    // Redirect callback: ensures signOut/signIn never redirects to localhost
    // in production. NextAuth resolves callbackUrl against NEXTAUTH_URL by
    // default — this override makes it origin-aware instead.
    async redirect({ url, baseUrl }) {
      // Relative URLs are always safe — just prepend the base
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // Absolute URL on the same origin → allow
      try {
        const urlOrigin = new URL(url).origin;
        const base = new URL(baseUrl).origin;
        if (urlOrigin === base) {
          return url;
        }
      } catch {
        // Invalid URL — fall through to default
      }

      // Anything else (cross-origin, localhost, etc.) → go home
      return baseUrl;
    },

    // JWT callback: runs when JWT is created or updated.
    // On initial sign-in, `user` is available. On subsequent requests, only `token`.
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = (user as NextAuthUser & { emailVerified: boolean }).emailVerified;
        token.avatar = user.avatar;
        token.sessionVersion = (user as NextAuthUser & { sessionVersion: number }).sessionVersion;
      } else if (token?.id) {
        // Validate active session against database (handles password resets and deactivations)
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { sessionVersion: true, isActive: true, emailVerified: true },
          });

          if (!dbUser || !dbUser.isActive || !dbUser.emailVerified || dbUser.sessionVersion !== token.sessionVersion) {
            // Invalidate the session by returning a token without an ID
            return { ...token, id: "" } as unknown as import("next-auth/jwt").JWT;
          }
        } catch (error) {
          console.error("JWT validation error:", error);
        }
      }
      
      if (trigger === "update" && session) {
        if (session.avatar !== undefined) {
          token.avatar = session.avatar;
        }
      }
      
      // If token has no id (because it was invalidated), return it to log the user out
      if (!token.id) return token;

      return token;
    },

    // Session callback: maps JWT token fields into session.user
    // so they are available via getServerSession() and useSession().
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
        session.user.avatar = token.avatar as string | null | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes of inactivity logs out
    updateAge: 5 * 60, // Regenerate token if active for 5 minutes
  },

  secret: process.env.NEXTAUTH_SECRET,
};
