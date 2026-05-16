/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import RosterTable from "@/src/components/RosterTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Users, User } from "lucide-react";
import DatePicker from "@/src/components/DatePicker";
import WeeklyStrip from "@/src/components/WeeklyStrip";
import { getUTCMidnight, parseUTCDate } from "@/src/lib/date";
import { AutoRefresh } from "@/src/components/AutoRefresh";
import ChangePasswordForm from "@/src/components/ChangePasswordForm";

export default async function TeacherRoster({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { date: dateStr } = await searchParams;
  
  if (!session || (session.user as any).role !== UserRole.TEACHER) {
    redirect("/");
  }

  const selectedDate = dateStr ? parseUTCDate(dateStr) : getUTCMidnight();

  // Find the teacher's section
  const teacher = await prisma.teacher.findUnique({
    where: { userId: (session.user as any).id },
    include: { sections: true }
  });

  if (!teacher || teacher.sections.length === 0) {
    return <div>No sections assigned.</div>;
  }

  const section = teacher.sections[0];
  const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);

  const students = await prisma.student.findMany({
    where: { sectionId: section.id },
    include: {
      user: true,
      attendances: {
        where: {
          date: {
            gte: selectedDate,
            lt: nextDay
          },
          sectionId: section.id
        }
      }
    }
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <AutoRefresh interval={10000} />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
              Class Roster
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {section.name}
              </p>
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Instructor: <span className="font-medium text-foreground">{session.user?.name || "Unknown"}</span>
              </p>
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <p className="flex items-center gap-2">
                {students.length} Students
              </p>
            </div>
          </div>
          <DatePicker />
        </div>

        <WeeklyStrip />

        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <CardTitle>Attendance Monitoring</CardTitle>
            <CardDescription>
              Manual override enabled. Changes sync automatically after 5 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RosterTable 
              students={students.map(s => ({
                id: s.id,
                studentId: s.studentId,
                name: s.user.name || "Unknown",
                status: s.attendances[0]?.status || null,
                sectionId: section.id,
                attendanceTime: s.attendances[0]?.updatedAt || null
              }))} 
              selectedDate={selectedDate}
            />
          </CardContent>
        </Card>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
