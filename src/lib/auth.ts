import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";

// ---------------------------------------------------------------------------
// In-memory rate limiter — max 10 failed attempts per IP per 15 minutes
// ---------------------------------------------------------------------------
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(email: string): string {
  return email.toLowerCase().trim();
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — one school day
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const key = getRateLimitKey(credentials.email);
        if (isRateLimited(key)) {
          throw new Error("Too many failed login attempts. Please wait 15 minutes.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          recordFailedAttempt(key);
          return null;
        }

        const bcrypt = require("bcryptjs");
        const isValid = bcrypt.compareSync(credentials.password, user.password);

        if (isValid) {
          clearAttempts(key);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        recordFailedAttempt(key);
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      // Re-validate role from DB on session refresh to catch removed/role-changed users
      if (!user && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true },
        });
        if (!dbUser) {
          // User was deleted — invalidate token
          return { ...token, invalidated: true };
        }
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if ((token as any).invalidated) return { ...session, user: undefined as any };
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign-in, always go to baseUrl (/) and let the middleware
      // redirect to the correct role-based dashboard. This prevents
      // callbackUrl loops when NextAuth appends ?callbackUrl=... to the
      // sign-in page URL.
      return baseUrl;
    },
  },
};
