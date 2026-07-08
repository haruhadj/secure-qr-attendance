import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSubjectMasterlist } from "@/src/app/actions/masterlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/src/components/ui/table";
import {
  RemoveStudentButton,
  EditStudentModal,
  ViewQrModal,
  EditAttendanceModal,
  DeleteAttendanceButton,
  ManageStudentSubjectsModal,
} from "@/src/components/MasterlistForms";
import { BookOpen, GraduationCap, ChevronLeft, Calendar, Clock } from "lucide-react";
import { formatSchedule } from "@/src/lib/schedule";
import Link from "next/link";
import DatePicker from "@/src/components/DatePicker";
import WeeklyStrip from "@/src/components/WeeklyStrip";
import { getUTCMidnight, parseUTCDate, formatTime, formatDate } from "@/src/lib/date";
import { AutoRefresh } from "@/src/components/AutoRefresh";
import ExportCsvButton from "@/src/components/ExportCsvButton";
import { prisma } from "@/src/lib/prisma";

export default async function SubjectMasterlist({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedParams = await params;
  const subjectId = resolvedParams.subjectId;
  const { date: dateStr } = await searchParams;

  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const selectedDate = dateStr ? parseUTCDate(dateStr) : getUTCMidnight();

  let data;
  try {
    data = await getSubjectMasterlist(subjectId, selectedDate);
  } catch {
    redirect("/admin/masterlist");
  }

  const { subject, students, subjects } = data;
  const sections = await prisma.section.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <AutoRefresh interval={10000} />
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/admin/masterlist?tab=subjects" className="hover:text-foreground transition-colors flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Back to Masterlist
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 md:gap-3 font-sans">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
              <span className="font-mono text-primary">{subject.code}</span>
              <span className="text-foreground">{subject.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Teacher: <span className="font-medium text-foreground">{subject.teacher?.user?.name || "Unassigned"}</span></span>
              {formatSchedule(subject.scheduleDay, subject.scheduleTime) && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatSchedule(subject.scheduleDay, subject.scheduleTime)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col md:items-end gap-3">
            <DatePicker />
            <Badge variant="outline" className="bg-card py-1.5 px-3 gap-2">
              <GraduationCap className="w-4 h-4" />
              {students.length} Enrolled
            </Badge>
          </div>
        </header>

        <WeeklyStrip />

        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Attendance for {formatDate(selectedDate)}
                </CardTitle>
                <CardDescription>
                  Enrolled roster and attendance status for the selected date
                </CardDescription>
              </div>
              <ExportCsvButton subjectId={subjectId} subjectName={`${subject.code}-${subject.name}`} />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell w-[110px]">Year Level</TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="hidden sm:table-cell w-[70px]">Time</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const attendance = student.attendances[0];
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {student.studentId}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div>{student.user.name}</div>
                        {student.user.username && (
                          <div className="text-xs text-muted-foreground font-mono">@{student.user.username}</div>
                        )}
                        <div className="md:hidden text-xs text-muted-foreground truncate max-w-[140px]">{student.user.email}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {student.user.email}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {student.yearLevel || <span className="text-muted-foreground/30">—</span>}
                      </TableCell>
                      <TableCell>
                        {attendance ? (
                          <Badge
                            className={
                              attendance.status === "PRESENT"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : attendance.status === "ABSENT"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }
                          >
                            {attendance.status}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {attendance
                          ? formatTime(attendance.updatedAt)
                          : <span className="text-muted-foreground/30">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <ManageStudentSubjectsModal
                            studentDbId={student.id}
                            studentName={student.user.name || "Unknown"}
                            allSubjects={subjects.map((s) => ({ id: s.id, code: s.code, name: s.name }))}
                            enrolledSubjectIds={student.enrolledSubjects.map((e) => e.subjectId)}
                          />
                          <EditAttendanceModal
                            studentDbId={student.id}
                            studentName={student.user.name || "Unknown"}
                            subjectId={subjectId}
                            selectedDate={selectedDate}
                            currentStatus={attendance?.status || null}
                            currentTime={attendance?.updatedAt || null}
                          />
                          <DeleteAttendanceButton
                            studentDbId={student.id}
                            studentName={student.user.name || "Unknown"}
                            subjectId={subjectId}
                            selectedDate={selectedDate}
                            hasAttendance={!!attendance}
                          />
                          <ViewQrModal
                            studentName={student.user.name || "Unknown"}
                            qrToken={student.qrToken}
                            studentId={student.studentId}
                            yearLevel={student.yearLevel}
                          />
                          <EditStudentModal
                            student={student}
                            sections={sections.map((s) => ({ id: s.id, name: s.name }))}
                          />
                          <RemoveStudentButton
                            studentDbId={student.id}
                            studentName={student.user.name || "Unknown"}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                      No students enrolled in this subject yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
