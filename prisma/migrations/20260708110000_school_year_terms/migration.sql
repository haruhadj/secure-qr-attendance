-- ============================================================================
-- School Year / Term model. Adds a Term table, scopes enrollments + attendance
-- to a term, and backfills all existing data into one default active term so
-- nothing is lost.
-- ============================================================================

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Term_name_key" ON "Term"("name");

-- Seed one default, active term to carry over all existing records.
INSERT INTO "Term" ("id", "name", "isActive", "createdAt")
VALUES ('default_term_backfill', 'Default Term', true, CURRENT_TIMESTAMP);

-- --- StudentSubject: add termId, backfill, make required, swap unique key ---
ALTER TABLE "StudentSubject" ADD COLUMN "termId" TEXT;
UPDATE "StudentSubject" SET "termId" = 'default_term_backfill' WHERE "termId" IS NULL;
ALTER TABLE "StudentSubject" ALTER COLUMN "termId" SET NOT NULL;

DROP INDEX IF EXISTS "StudentSubject_studentId_subjectId_key";
CREATE UNIQUE INDEX "StudentSubject_studentId_subjectId_termId_key"
    ON "StudentSubject"("studentId", "subjectId", "termId");

ALTER TABLE "StudentSubject"
    ADD CONSTRAINT "StudentSubject_termId_fkey"
    FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- --- Attendance: add termId (nullable scoping column), backfill, index ---
ALTER TABLE "Attendance" ADD COLUMN "termId" TEXT;
UPDATE "Attendance" SET "termId" = 'default_term_backfill' WHERE "termId" IS NULL;

CREATE INDEX "Attendance_termId_idx" ON "Attendance"("termId");

ALTER TABLE "Attendance"
    ADD CONSTRAINT "Attendance_termId_fkey"
    FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;
