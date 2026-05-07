/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/src/components/ui/badge";
import { QrCode, IdCard, Image as ImageIcon, History, CheckCircle2, XCircle, Clock, ArrowRight, Calendar, User, Mail, BookOpen, Hash } from "lucide-react";
import { AutoRefresh } from "@/src/components/AutoRefresh";
import { format, isToday, isYesterday } from "date-fns";
import AttendanceCalendar from "@/src/components/AttendanceCalendar";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.STUDENT) {
    redirect("/");
  }

  const student = await prisma.student.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      user: true,
      section: {
        include: {
          teacher: {
            include: { user: true }
          }
        }
      },
      attendances: {
        orderBy: { date: 'desc' },
        include: {
          section: true
        }
      }
    }
  });

  if (!student) {
    return <div>Student record not found.</div>;
  }

  const stats = {
    present: student.attendances.filter(a => a.status === 'PRESENT').length,
    late: student.attendances.filter(a => a.status === 'LATE').length,
    absent: student.attendances.filter(a => a.status === 'ABSENT').length,
    total: student.attendances.length
  };

  const attendanceRate = stats.total > 0
    ? Math.round(((stats.present + stats.late) / stats.total) * 100)
    : 0;

  const recentHistory = student.attendances.slice(0, 5);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <AutoRefresh />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Student Profile Header */}
        <Card className="border-none shadow-xl shadow-border/5 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/70 p-6 pb-8">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-foreground font-sans">
                  {student.user.name || "Student"}
                </h1>
                <p className="text-primary-foreground/70 text-sm">Student Dashboard</p>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                {attendanceRate}% Attendance
              </Badge>
            </div>
          </div>
          <CardContent className="-mt-4 pb-4">
            <div className="bg-card rounded-2xl border shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Student ID</p>
                  <p className="text-sm font-bold text-foreground truncate">{student.studentId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{student.user.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Section</p>
                  <p className="text-sm font-bold text-foreground truncate">{student.section?.name || "Unassigned"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Adviser</p>
                  <p className="text-sm font-medium text-foreground truncate">{student.section?.teacher?.user?.name || "No adviser"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="border-none shadow-xl shadow-border/5 bg-green-500/5">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-green-600">{stats.present}</span>
              <span className="text-[10px] uppercase tracking-wider text-green-600/70 font-semibold">Present</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl shadow-border/5 bg-amber-500/5">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">{stats.late}</span>
              <span className="text-[10px] uppercase tracking-wider text-amber-600/70 font-semibold">Late</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl shadow-border/5 bg-red-500/5">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
              <span className="text-[10px] uppercase tracking-wider text-red-600/70 font-semibold">Absent</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-none shadow-xl shadow-border/5 overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground pb-8">
              <CardTitle className="text-lg">Identity QR</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                Flash this for attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="-mt-6 flex flex-col items-center">
              <div className="p-6 bg-card rounded-3xl shadow-lg border-4 border-primary/10">
                <div className="p-2 bg-white rounded-xl">
                  <QRCodeSVG
                    value={student.qrToken}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
              <div className="mt-4 text-center space-y-2">
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                  {student.qrToken.slice(0, 8)}...
                </code>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50">
                  REFRESHES DAILY
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-xl shadow-border/5">
              <Tabs defaultValue="history">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <TabsList className="grid grid-cols-2 w-[240px]">
                      <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="w-3.5 h-3.5" />
                        History
                      </TabsTrigger>
                      <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Calendar
                      </TabsTrigger>
                    </TabsList>
                    <Link href="/student/appeals" className="text-xs text-primary hover:underline font-medium">
                      View All Appeals
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <TabsContent value="history" className="mt-0">
                    {recentHistory.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {recentHistory.map((att) => (
                      <div key={att.id} className="relative">
                        <div className={`absolute -left-[22px] top-1 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center ${
                          att.status === 'PRESENT' ? 'bg-green-500' :
                          att.status === 'LATE' ? 'bg-amber-500' : 'bg-red-500'
                        }`}>
                          {att.status === 'PRESENT' ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> :
                           att.status === 'LATE' ? <Clock className="w-2.5 h-2.5 text-white" /> :
                           <XCircle className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-bold text-foreground flex items-center gap-2">
                              {format(new Date(att.date), "MMMM d, yyyy")}
                              {isToday(new Date(att.date)) && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/5 text-primary border-primary/20">TODAY</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(att.updatedAt), "hh:mm a")}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {att.section.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                             <Badge
                              className={
                                att.status === 'PRESENT' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                att.status === 'LATE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20'
                              }
                            >
                              {att.status}
                            </Badge>
                            {(att.status === 'ABSENT' || att.status === 'LATE') && (
                              <Link 
                                href="/student/appeals" 
                                className="text-[10px] text-primary hover:underline font-medium flex items-center gap-0.5"
                              >
                                Appeal <ArrowRight className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                      <History className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">No recent history</p>
                      <p className="text-xs text-muted-foreground">Your attendance records will appear here.</p>
                    </div>
                  </div>
                )}
                  </TabsContent>
                  <TabsContent value="calendar" className="mt-0">
                    <AttendanceCalendar attendances={student.attendances} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            <Card className="border border-border shadow-xl shadow-border/5 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <IdCard className="w-5 h-5 text-primary" />
                  Physical ID Fallback
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  If your phone is unavailable, use your physical card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-5 bg-muted rounded-2xl border border-border/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5">
                    Permanent ID String
                  </p>
                  <p className="font-mono text-2xl tracking-widest text-foreground">
                    {student.studentId.replace('-', ' ')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
