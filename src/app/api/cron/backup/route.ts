import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { collectBackupData } from "@/src/lib/backup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduled automatic backup. Vercel Cron calls this on a schedule (see
// vercel.json) with `Authorization: Bearer <CRON_SECRET>`. Writes a JSON
// snapshot to Vercel Blob so the school always has an off-database copy.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob storage not configured." }, { status: 503 });
  }

  try {
    const payload = await collectBackupData();
    const date = new Date().toISOString().slice(0, 10);
    const blob = await put(
      `backups/qr-attendance-backup-${date}.json`,
      JSON.stringify(payload, null, 2),
      { access: "public", contentType: "application/json", addRandomSuffix: true }
    );
    return NextResponse.json({ status: "ok", url: blob.url, date });
  } catch (error) {
    console.error("Scheduled backup failed:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
