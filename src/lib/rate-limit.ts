import { prisma } from "@/src/lib/prisma";

// ---------------------------------------------------------------------------
// Durable rate limiter backed by the `RateLimit` table. Unlike an in-memory
// Map, this survives serverless cold starts and is shared across all instances.
// Keys are scope-prefixed, e.g. `login:jane@x.com` or `pwreset:jane@x.com`.
// ---------------------------------------------------------------------------

/** Returns true when the key is over its limit for the current window. */
export async function isRateLimited(key: string, max: number): Promise<boolean> {
  const now = new Date();
  const entry = await prisma.rateLimit.findUnique({ where: { key } });
  if (!entry || now > entry.resetAt) return false;
  return entry.count >= max;
}

/** Records one attempt, opening a fresh window if the previous one expired. */
export async function recordAttempt(key: string, windowMs: number): Promise<void> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const entry = await prisma.rateLimit.findUnique({ where: { key } });

  if (!entry || now > entry.resetAt) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
  } else {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
  }
}

/** Clears a key after a successful action (e.g. valid login). */
export async function clearAttempts(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}
