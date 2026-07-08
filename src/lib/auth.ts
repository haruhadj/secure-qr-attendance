import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";
import { isRateLimited, recordAttempt, clearAttempts } from "@/src/lib/rate-limit";

// ---------------------------------------------------------------------------
// Login rate limiting — max 10 failed attempts per identifier per 15 minutes.
// Backed by the durable `RateLimit` table (see lib/rate-limit.ts) so it holds
// across serverless instances instead of resetting on every cold start.
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimitKey(email: string): string {
  return `login:${email.toLowerCase().trim()}`;
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
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const identifier = credentials.email.trim();
        const key = getRateLimitKey(identifier);
        if (await isRateLimited(key, MAX_ATTEMPTS)) {
          throw new Error("Too many failed login attempts. Please wait 15 minutes.");
        }

        // Students imported without an email log in with a name-derived username
        // (usernames are stored lowercase), so accept either identifier here.
        // Emails and usernames are both stored lowercase, so match case-insensitively.
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
          },
        });

        if (!user || !user.password) {
          await recordAttempt(key, WINDOW_MS);
          return null;
        }

        const bcrypt = require("bcryptjs");
        const isValid = bcrypt.compareSync(credentials.password, user.password);

        if (isValid) {
          await clearAttempts(key);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          } as any;
        }

        await recordAttempt(key, WINDOW_MS);
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        (token as any).mustChangePassword = (user as any).mustChangePassword ?? false;
      }
      // Re-validate from DB on session refresh to catch removed/role-changed users
      // and to pick up a cleared mustChangePassword flag immediately after change.
      if (!user && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true, mustChangePassword: true },
        });
        if (!dbUser) {
          // User was deleted — invalidate token
          return { ...token, invalidated: true };
        }
        token.role = dbUser.role;
        (token as any).mustChangePassword = dbUser.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if ((token as any).invalidated) return { ...session, user: undefined as any };
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).mustChangePassword = (token as any).mustChangePassword ?? false;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always land on the sign-in page root and let the middleware handle
      // role-based routing. This prevents callbackUrl redirect loops on
      // both localhost and Vercel.
      // If the incoming url is already a role dashboard, allow it through.
      const rolePaths = ["/admin/dashboard", "/teacher/roster", "/student/dashboard"];
      try {
        const parsed = new URL(url);
        if (rolePaths.some((p) => parsed.pathname.startsWith(p))) return url;
      } catch {
        if (rolePaths.some((p) => url.startsWith(p))) return `${baseUrl}${url}`;
      }
      return baseUrl;
    },
  },
};
