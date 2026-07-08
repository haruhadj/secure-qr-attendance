import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const dynamic = "force-dynamic";

// Public health probe for uptime monitors. Returns 200 only when the app can
// reach the database, 503 otherwise, so an external monitor (e.g. UptimeRobot)
// can alert the owner when the system is down.
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "connected",
      latencyMs: Date.now() - startedAt,
      version: process.env.npm_package_version ?? "unknown",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", database: "unreachable", time: new Date().toISOString() },
      { status: 503 }
    );
  }
}
