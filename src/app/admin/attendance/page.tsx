/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getAttendanceForDate } from "@/src/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { CalendarDays, BookOpen } from "lucide-react";
import { AutoRefresh } from "@/src/components/AutoRefresh";
import DatePicker from "@/src/components/DatePicker";
import WeeklyStrip from "@/src/components/WeeklyStrip";
import SubjectSelector from "@/src/components/SubjectSelector";
import RosterTable from "@/src/components/RosterTable";
import { format } from "date-fns";

export default async function AdminAttendance({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; subjectId?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const { date: dateStr, subjectId: subjectIdParam } = await searchParams;

  const attendanceView = await getAttendanceForDate(dateStr, subjectIdParam);
  const selectedDateLabel = format(new Date(attendanceView.selectedDateISO), "EEEE, MMMM d, yyyy");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <AutoRefresh interval={30000} />
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 md:gap-3">
              <CalendarDays className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
              Attendance
            </h1>
            <p className="text-muted-foreground">
              Browse and correct any class&apos;s attendance for any date
            </p>
          </div>
          <DatePicker />
        </header>

        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {attendanceView.selectedSubject
                ? `${attendanceView.selectedSubject.code} — ${attendanceView.selectedSubject.name}`
                : "Attendance"}
            </CardTitle>
            <CardDescription>
              {attendanceView.selectedSubject?.teacherName
                ? `${attendanceView.selectedSubject.teacherName} · `
                : ""}
              <span className="text-primary font-medium">{selectedDateLabel}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {attendanceView.subjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground/30 mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  No subjects yet. Import a masterlist to browse attendance.
                </p>
              </div>
            ) : (
              <>
                <SubjectSelector
                  subjects={attendanceView.subjects}
                  selectedSubjectId={attendanceView.selectedSubject!.id}
                />

                <WeeklyStrip />

                {/* Day summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <SummaryChip label="Present" value={attendanceView.summary.present} className="bg-green-500/10 text-green-500" />
                  <SummaryChip label="Late" value={attendanceView.summary.late} className="bg-amber-500/10 text-amber-500" />
                  <SummaryChip label="Absent" value={attendanceView.summary.absent} className="bg-red-500/10 text-red-500" />
                  <SummaryChip label="Not Set" value={attendanceView.summary.unmarked} className="bg-muted text-muted-foreground" />
                  <SummaryChip label="Total" value={attendanceView.summary.total} className="bg-primary/10 text-primary" />
                </div>

                {attendanceView.students.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground font-medium">
                      No students enrolled in this subject for the active term, and no records on this date.
                    </p>
                  </div>
                ) : (
                  <RosterTable
                    students={attendanceView.students}
                    selectedDateISO={attendanceView.selectedDateISO}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryChip({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col items-center justify-center text-center">
      <span className={`text-2xl font-bold px-2 rounded-lg ${className}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}
