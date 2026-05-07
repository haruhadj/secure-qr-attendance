/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import QrScanner from "@/src/components/QrScanner";
import { ScanLine, Users } from "lucide-react";

export default async function TeacherScanner() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.TEACHER) {
    redirect("/");
  }

  // Get section info for display
  const teacher = await prisma.teacher.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      sections: {
        include: {
          _count: { select: { students: true } },
        },
      },
    },
  });

  const sections = teacher?.sections || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans flex items-center gap-3">
              <ScanLine className="w-8 h-8 text-primary" />
              QR Scanner
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              {sections.length > 0
                ? "Scan student QR codes for attendance"
                : "No sections assigned"}
            </p>
          </div>
        </div>

        <QrScanner sections={sections} />
      </div>
    </div>
  );
}
