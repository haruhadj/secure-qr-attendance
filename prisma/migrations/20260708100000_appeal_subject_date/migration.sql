-- Appeal now targets a specific subject and absence date
ALTER TABLE "Appeal" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "Appeal" ADD COLUMN "date" TIMESTAMP(3);

ALTER TABLE "Appeal"
  ADD CONSTRAINT "Appeal_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
