-- Force a password change off default/temporary credentials
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- Allow AttendanceAudit.newStatus to be null (null == record cleared/deleted)
ALTER TABLE "AttendanceAudit" ALTER COLUMN "newStatus" DROP NOT NULL;
