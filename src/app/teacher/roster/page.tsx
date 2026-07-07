import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import RosterTable from "@/src/components/RosterTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Users, User, BookOpen, Calendar } from "lucide-react";
import DatePicker from "@/src/components/DatePicker";
import WeeklyStrip from "@/src/components/WeeklyStrip";
import { getUTCMidnight, parseUTCDate } from "@/src/lib/date";
import { AutoRefresh } from "@/src/components/AutoRefresh";
import ChangePasswordForm from "@/src/components/ChangePasswordForm";
import ChangeEmailForm from "@/src/components/ChangeEmailForm";
import ExportCsvButton from "@/src/components/ExportCsvButton";
import SubjectSelector from "@/src/components/SubjectSelector";
import { format } from "date-fns";

export default async function TeacherRoster({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; subjectId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { date: dateStr, subjectId: subjectIdParam } = await searchParams;

  if (!session || (session.user as any).role !== UserRole.TEACHER) {
    redirect("/");
  }

  const selectedDate = dateStr ? parseUTCDate(dateStr) : getUTCMidnight();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: (session.user as any).id },
    include: { subjects: true, user: true },
  });

  if (!teacher || teacher.subjects.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <p className="text-muted-foreground">No subjects assigned to your account yet.</p>
      </div>
    );
  }

  const subject = subjectIdParam
    ? teacher.subjects.find((s) => s.id === subjectIdParam) ?? teacher.subjects[0]
    : teacher.subjects[0];

  const nextDay = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);

  const enrollments = await prisma.studentSubject.findMany({
    where: { subjectId: subject.id },
    include: {
      student: {
        include: {
          user: true,
          attendances: {
            where: { date: { gte: selectedDate, lt: nextDay }, subjectId: subject.id },
          },
        },
      },
    },
    orderBy: { student: { studentId: "asc" } },
  });

  const students = enrollments.map((e) => e.student);
  const todayLabel = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <AutoRefresh interval={10000} />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-sans">
              Class Roster
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
              <p className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{subject.code} — {subject.name}</span>
              </p>
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <p className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {session.user?.name || "Unknown"}
              </p>
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {students.length} Students
              </p>
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <p className="flex items-center gap-2 text-primary font-medium">
                <Calendar className="w-4 h-4" />
                {todayLabel}
              </p>
            </div>
          </div>
          <DatePicker />
        </div>

        {teacher.subjects.length > 1 && (
          <SubjectSelector subjects={teacher.subjects} selectedSubjectId={subject.id} />
        )}

        <WeeklyStrip />

        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Attendance Monitoring</CardTitle>
                <CardDescription>
                  {subject.scheduleDay && subject.scheduleTime
                    ? `${subject.scheduleDay} · ${subject.scheduleTime} · Manual override enabled.`
                    : "Manual override enabled. Changes sync automatically after 5 seconds."}
                </CardDescription>
              </div>
              <ExportCsvButton subjectId={subject.id} subjectName={`${subject.code}-${subject.name}`} />
            </div>
          </CardHeader>
          <CardContent>
            <RosterTable
              students={students.map((s) => ({
                id: s.id,
                studentId: s.studentId,
                name: s.user.name || "Unknown",
                status: s.attendances[0]?.status || null,
                subjectId: subject.id,
                attendanceTime: s.attendances[0]?.updatedAt?.toISOString() || null,
              }))}
              selectedDateISO={selectedDate.toISOString()}
            />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChangeEmailForm currentEmail={teacher.user.email ?? ""} />
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
