import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getSectionMasterlist } from "@/src/app/actions/masterlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { AddStudentForm } from "@/src/components/MasterlistForms";
import StudentMasterlistTable from "@/src/components/StudentMasterlistTable";
import { Users, GraduationCap, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import DatePicker from "@/src/components/DatePicker";
import WeeklyStrip from "@/src/components/WeeklyStrip";
import { getUTCMidnight, parseUTCDate, formatTime, formatDate } from "@/src/lib/date";
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
  } catch {
    redirect("/admin/masterlist");
  }

  const { section, students, sections, subjects } = data;

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 md:gap-3 font-sans">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
              {section.name}
            </h1>
            <p className="text-muted-foreground">
              Adviser: {section.teacher?.user?.name || "Unassigned"}
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

        <AddStudentForm
          sections={sections.map((s) => ({ id: s.id, name: s.name }))}
          initialSectionId={sectionId}
        />

        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Students in {section.name}
                </CardTitle>
                <CardDescription>
                  Manage students assigned to this section. Attendance is tracked per subject.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StudentMasterlistTable
              students={students}
              sections={sections.map((s) => ({ id: s.id, name: s.name }))}
              subjects={subjects.map((s) => ({ id: s.id, code: s.code, name: s.name }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
