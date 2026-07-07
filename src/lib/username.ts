/**
 * Username helpers.
 *
 * A student's default login handle is derived from their first and last name:
 *   "Michael G. Fernandez" -> "michaelfernandez"
 * Middle names / initials are dropped, everything is lowercased, and any
 * character that isn't a letter or digit is stripped out.
 */

/**
 * Derive a base username from a full name (no uniqueness guarantees).
 * Returns "" when the name has no usable characters.
 */
export function deriveUsername(name: string | null | undefined): string {
  if (!name) return "";
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";
  const first = tokens[0];
  const last = tokens.length > 1 ? tokens[tokens.length - 1] : "";
  return `${first}${last}`.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Normalize a username the admin typed in (lowercase, strip invalid chars).
 * Returns null when nothing usable remains.
 */
export function normalizeUsername(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned || null;
}

/**
 * Normalize an email for storage/lookup: trim + lowercase so the same address
 * in different casing maps to one row. Returns null when nothing usable remains
 * (empty input) so the DB's unique constraint isn't tripped by "".
 */
export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().toLowerCase() || null;
}

/**
 * A Prisma client or transaction client — anything exposing `user.findFirst`.
 * Typed loosely so both `prisma` and a `$transaction` client are accepted
 * without fighting Prisma's generated generic signatures.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserFinder = { user: { findFirst: (args: any) => Promise<{ id: string } | null> } };

/**
 * Generate a unique username for `name`, falling back to "student" when the
 * name yields nothing. Appends a numeric suffix (name2, name3, …) on collision.
 * Pass `excludeUserId` when editing an existing user so their own row doesn't
 * count as a conflict.
 */
export async function generateUniqueUsername(
  db: UserFinder,
  name: string | null | undefined,
  excludeUserId?: string
): Promise<string> {
  const base = deriveUsername(name) || "student";
  let candidate = base;
  let suffix = 1;
  // Cap the loop defensively; collisions past this are astronomically unlikely.
  while (suffix < 10000) {
    const existing = await db.user.findFirst({
      where: {
        username: candidate,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  // Extremely unlikely fallback.
  return `${base}${Date.now()}`;
}

/**
 * Ensure the desired username (if any) is free; otherwise generate one from the
 * name. Returns the username to persist. `desired` is the admin-provided value.
 */
export async function resolveUsername(
  db: UserFinder,
  desired: string | null | undefined,
  name: string | null | undefined,
  excludeUserId?: string
): Promise<{ username: string } | { error: string }> {
  const normalized = normalizeUsername(desired);
  if (normalized) {
    const existing = await db.user.findFirst({
      where: {
        username: normalized,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (existing) return { error: `Username "${normalized}" is already taken.` };
    return { username: normalized };
  }
  return { username: await generateUniqueUsername(db, name, excludeUserId) };
}
