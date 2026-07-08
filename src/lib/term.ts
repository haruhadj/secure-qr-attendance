import { prisma } from "@/src/lib/prisma";

// ---------------------------------------------------------------------------
// School-year / term helpers. Exactly one Term is active at a time; attendance
// and enrollments are written against it. If none exists yet (fresh install or
// legacy data), we self-heal by creating a default active term so writes never
// fail — the client can rename it later.
// ---------------------------------------------------------------------------

export async function getActiveTerm() {
  let term = await prisma.term.findFirst({ where: { isActive: true } });
  if (!term) {
    // Adopt any existing term, else create a sensible default.
    term = await prisma.term.findFirst({ orderBy: { createdAt: "desc" } });
    if (term) {
      term = await prisma.term.update({ where: { id: term.id }, data: { isActive: true } });
    } else {
      const year = new Date().getFullYear();
      term = await prisma.term.create({
        data: { name: `AY ${year}-${year + 1}`, isActive: true },
      });
    }
  }
  return term;
}

export async function getActiveTermId(): Promise<string> {
  return (await getActiveTerm()).id;
}
