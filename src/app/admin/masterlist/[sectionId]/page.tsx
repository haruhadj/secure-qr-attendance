import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSectionMasterlist } from "@/src/app/actions/masterlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  AddStudentForm,
  RemoveStudentButton,
  EditStudentModal,
  ViewQrModal,
  EditAttendanceModal,
  DeleteAttendanceButton,
} from "@/src/components/MasterlistForms";
import { Users, GraduationCap, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import DatePicker from "@/src/components/DatePicker";
import WeeklyStrip from "@/src/components/WeeklyStrip";
import { getUTCMidnight, parseUTCDate } from "@/src/lib/date";
import { AutoRefresh } from "@/src/components/AutoRefresh";

export default async function SectionMasterlist({ 
  params,
  searchParams,
}: { 
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedParams = await params;
  const sectionId = resolvedParams.sectionId;
  const { date: dateStr } = await searchParams;
  
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const selectedDate = dateStr ? parseUTCDate(dateStr) : getUTCMidnight();

  let data;
  try {
    data = await getSectionMasterlist(sectionId, selectedDate);
  } catch (error) {
    redirect("/admin/masterlist");
  }

  const { section, students, sections } = data;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <AutoRefresh interval={10000} />
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/admin/masterlist" className="hover:text-foreground transition-colors flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Back to Masterlist
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3 font-sans">
              <Users className="w-8 h-8 text-primary" />
              {section.name}
            </h1>
            <p className="text-muted-foreground">
              Teacher: {section.teacher?.user?.name || "Unassigned"}
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-3">
            <DatePicker />
            <Badge variant="outline" className="bg-card py-1.5 px-3 gap-2">
              <GraduationCap className="w-4 h-4" />
              {students.length} Students
            </Badge>
          </div>
        </header>

        <WeeklyStrip />

        {/* Add Student Form */}
        <AddStudentForm 
          sections={sections.map((s) => ({ id: s.id, name: s.name }))} 
          initialSectionId={sectionId}
        />

        {/* Student Table */}
        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Attendance for {selectedDate.toLocaleDateString()}
                </CardTitle>
                <CardDescription>
                  Roster and status for the selected date
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
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
                        {student.user.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {student.user.email}
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
                      <TableCell className="text-xs text-muted-foreground">
                        {attendance
                          ? new Date(attendance.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : <span className="text-muted-foreground/30">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <EditAttendanceModal
                            studentDbId={student.id}
                            studentName={student.user.name || "Unknown"}
                            sectionId={sectionId}
                            selectedDate={selectedDate}
                            currentStatus={attendance?.status || null}
                            currentTime={attendance?.updatedAt || null}
                          />
                          <DeleteAttendanceButton
                            studentDbId={student.id}
                            studentName={student.user.name || "Unknown"}
                            sectionId={sectionId}
                            selectedDate={selectedDate}
                            hasAttendance={!!attendance}
                          />
                          <ViewQrModal
                            studentName={student.user.name || "Unknown"}
                            qrToken={student.qrToken}
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
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                      No students in this section yet.
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
