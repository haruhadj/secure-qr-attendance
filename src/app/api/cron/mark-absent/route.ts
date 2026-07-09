import { NextRequest, NextResponse } from "next/server";
import { runAutoAbsentSweep } from "@/src/lib/autoAbsent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduled sweep that turns "no scan by class end" into an ABSENT record.
// Vercel Cron calls this on a schedule (see vercel.json) with
// `Authorization: Bearer <CRON_SECRET>`. Safe to call as often as the
// hosting plan allows — it only creates rows where none exist yet, so
// repeated/overlapping runs are harmless.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAutoAbsentSweep();
    return NextResponse.json({ status: "ok", ...result });
  } catch (error) {
    console.error("Auto-absent sweep failed:", error);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
