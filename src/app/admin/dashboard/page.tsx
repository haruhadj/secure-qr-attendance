/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getAdminDashboardStats, getSystemSettings } from "@/src/app/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import SystemSettingsForm from "@/src/components/SystemSettingsForm";
import { Activity, Users, Settings, GraduationCap, FolderOpen, AlertTriangle, UserPlus, UserMinus, BookOpen, Edit, CheckCircle, XCircle, Search, QrCode, Upload, Trash2, RefreshCw, Key, BookMarked, ScanLine } from "lucide-react";
import DemoAccountsCard from "./DemoAccountsCard";
import { AutoRefresh } from "@/src/components/AutoRefresh";
import ChangePasswordForm from "@/src/components/ChangePasswordForm";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const stats = await getAdminDashboardStats();
  const settings = await getSystemSettings();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <AutoRefresh interval={30000} />
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            System overview and global configurations
          </p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg shadow-border/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalStudents}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Students</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg shadow-border/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalTeachers}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total Teachers</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg shadow-border/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                  <FolderOpen className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.totalSections}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Active Sections</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg shadow-border/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{stats.attendanceRate}%</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Today's Attendance</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Logs */}
          <Card className="lg:col-span-2 border-none shadow-xl shadow-border/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Comprehensive system audit trail</CardDescription>
              </div>
              <Badge variant="outline" className="text-muted-foreground font-normal">
                Last 10 actions
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentAudits.map((activity: any) => {
                  const detail = getActivityDetail(activity.type, activity.metadata);
                  return (
                  <div key={activity.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all duration-200">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {activity.description}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded-full shrink-0">
                          {formatRelativeTime(new Date(activity.createdAt))}
                        </span>
                      </div>
                      {detail && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{detail}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                            {activity.user?.name?.[0]?.toUpperCase() || "S"}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {activity.user?.name || "System"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/30">•</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">
                          {formatActivityType(activity.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                )})}
                {stats.recentAudits.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground/30 mb-4">
                      <Activity className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">No recent activity found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Settings & Alerts */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl shadow-border/5 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  System Configurations
                </CardTitle>
                <CardDescription>
                  Manage global application rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-1">
                  <SystemSettingsForm settings={settings} />
                </div>

                {stats.pendingAppeals > 0 && (
                  <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-500">Pending Review</p>
                      <p className="text-xs text-amber-500/70 mt-0.5">
                        There are {stats.pendingAppeals} appeals waiting for your response.
                      </p>
                      <Link href="/teacher/appeals" className="mt-3 inline-block text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors">
                        View Appeals →
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DemoAccountsCard />
        <ChangePasswordForm />
      </div>
    </div>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case "STAFF_ADD":             return <UserPlus className="w-4 h-4" />;
    case "STAFF_REMOVE":          return <UserMinus className="w-4 h-4" />;
    case "STUDENT_ADD":           return <GraduationCap className="w-4 h-4" />;
    case "STUDENT_REMOVE":        return <UserMinus className="w-4 h-4" />;
    case "STUDENT_UPDATE":        return <Edit className="w-4 h-4" />;
    case "STUDENT_PASSWORD_RESET":return <Key className="w-4 h-4" />;
    case "STUDENT_QR_REGEN":      return <RefreshCw className="w-4 h-4" />;
    case "SECTION_ADD":           return <FolderOpen className="w-4 h-4" />;
    case "SECTION_UPDATE":        return <FolderOpen className="w-4 h-4" />;
    case "SECTION_REMOVE":        return <Trash2 className="w-4 h-4" />;
    case "SUBJECT_ADD":           return <BookOpen className="w-4 h-4" />;
    case "SUBJECT_UPDATE":        return <BookOpen className="w-4 h-4" />;
    case "SUBJECT_REMOVE":        return <Trash2 className="w-4 h-4" />;
    case "ATTENDANCE_SCAN":       return <ScanLine className="w-4 h-4" />;
    case "ATTENDANCE_EDIT":       return <Edit className="w-4 h-4" />;
    case "ATTENDANCE_ADMIN_EDIT": return <Edit className="w-4 h-4" />;
    case "ATTENDANCE_DELETE":     return <Trash2 className="w-4 h-4" />;
    case "MASTERLIST_IMPORT":     return <Upload className="w-4 h-4" />;
    case "SETTING_UPDATE":        return <Settings className="w-4 h-4" />;
    case "APPEAL_REVIEW":         return <CheckCircle className="w-4 h-4" />;
    default:                      return <Activity className="w-4 h-4" />;
  }
}

function getActivityColor(type: string) {
  if (["STAFF_ADD","STUDENT_ADD","SECTION_ADD","SUBJECT_ADD","ATTENDANCE_SCAN","APPEAL_REVIEW","MASTERLIST_IMPORT"].includes(type))
    return "bg-green-500/10 text-green-500";
  if (["STAFF_REMOVE","STUDENT_REMOVE","SECTION_REMOVE","SUBJECT_REMOVE","ATTENDANCE_DELETE"].includes(type))
    return "bg-red-500/10 text-red-500";
  if (["ATTENDANCE_EDIT","ATTENDANCE_ADMIN_EDIT","SECTION_UPDATE","SUBJECT_UPDATE","STUDENT_UPDATE","SETTING_UPDATE"].includes(type))
    return "bg-blue-500/10 text-blue-500";
  if (["STUDENT_PASSWORD_RESET","STUDENT_QR_REGEN"].includes(type))
    return "bg-amber-500/10 text-amber-500";
  return "bg-muted text-muted-foreground";
}

function formatActivityType(type: string) {
  return type.replace(/_/g, " ");
}

function getActivityDetail(type: string, meta: any): string | null {
  if (!meta) return null;
  switch (type) {
    case "ATTENDANCE_SCAN":
      return [
        meta.studentName && `Student: ${meta.studentName}`,
        meta.subjectName && `Subject: ${meta.subjectName}`,
      ].filter(Boolean).join("  ·  ") || null;
    case "ATTENDANCE_EDIT":
    case "ATTENDANCE_ADMIN_EDIT":
      return [
        meta.studentId && `ID: ${meta.studentId}`,
        meta.subjectId && `Subject ID: ${meta.subjectId}`,
        meta.oldStatus && meta.newStatus && `${meta.oldStatus} → ${meta.newStatus}`,
        !meta.oldStatus && meta.status && `Status: ${meta.status}`,
      ].filter(Boolean).join("  ·  ") || null;
    case "ATTENDANCE_DELETE":
      return [
        meta.studentId && `Student ID: ${meta.studentId}`,
        meta.date && `Date: ${new Date(meta.date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" })}`,
      ].filter(Boolean).join("  ·  ") || null;
    case "STUDENT_ADD":
      return [
        meta.name && `Name: ${meta.name}`,
        meta.studentId && `ID: ${meta.studentId}`,
      ].filter(Boolean).join("  ·  ") || null;
    case "STUDENT_UPDATE":
      return meta.name ? `Name: ${meta.name}` : null;
    case "STUDENT_REMOVE":
      return meta.name ? `${meta.name}${meta.studentId ? ` (${meta.studentId})` : ""}` : null;
    case "STUDENT_PASSWORD_RESET":
      return meta.studentId ? `Student ID: ${meta.studentId}` : null;
    case "STUDENT_QR_REGEN":
      return meta.studentId ? `Student ID: ${meta.studentId}` : null;
    case "SECTION_ADD":
    case "SECTION_UPDATE":
      return meta.name ? `Section: ${meta.name}` : null;
    case "SECTION_REMOVE":
      return meta.name ? `Removed: ${meta.name}` : null;
    case "SUBJECT_ADD":
      return [
        meta.code && `Code: ${meta.code}`,
        meta.name && `Name: ${meta.name}`,
        meta.scheduleDay && `Days: ${meta.scheduleDay}`,
        meta.scheduleTime && `Time: ${meta.scheduleTime}`,
      ].filter(Boolean).join("  ·  ") || null;
    case "SUBJECT_UPDATE":
      return [
        meta.code && `Code: ${meta.code}`,
        meta.scheduleDay && `Days: ${meta.scheduleDay}`,
        meta.scheduleTime && `Time: ${meta.scheduleTime}`,
      ].filter(Boolean).join("  ·  ") || null;
    case "SUBJECT_REMOVE":
      return meta.code ? `Removed: ${meta.code}` : null;
    case "MASTERLIST_IMPORT":{
      const parts = [
        meta.sectionsCreated > 0 && `${meta.sectionsCreated} sections`,
        meta.subjectsCreated > 0 && `${meta.subjectsCreated} subjects`,
        meta.teachersCreated > 0 && `${meta.teachersCreated} teachers`,
        meta.studentsCreated > 0 && `${meta.studentsCreated} students`,
        meta.enrollmentsCreated > 0 && `${meta.enrollmentsCreated} enrollments`,
        meta.errors?.length > 0 && `${meta.errors.length} errors`,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join("  ·  ") : null;
    }
    case "STAFF_ADD":
      return [
        meta.name && `Name: ${meta.name}`,
        meta.role && `Role: ${meta.role}`,
      ].filter(Boolean).join("  ·  ") || null;
    case "STAFF_REMOVE":
      return meta.name ? `${meta.name}${meta.role ? ` (${meta.role})` : ""}` : null;
    case "SETTING_UPDATE":
      return meta.key ? `${meta.key}: ${meta.value ?? "—"}` : null;
    case "APPEAL_REVIEW":
      return [
        meta.status && `Decision: ${meta.status}`,
        meta.studentId && `Student DB ID: ${meta.studentId}`,
      ].filter(Boolean).join("  ·  ") || null;
    default:
      return null;
  }
}

function formatRelativeTime(date: Date) {
  const d = new Date(date);
  const time = d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Manila" });
  const dateStr = d.toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "Asia/Manila" });
  return `${time}  ${dateStr}`;
}
