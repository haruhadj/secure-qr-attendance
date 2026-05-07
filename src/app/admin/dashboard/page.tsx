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
import { Activity, Users, Settings, GraduationCap, FolderOpen, AlertTriangle, UserPlus, UserMinus, BookOpen, Edit, CheckCircle, XCircle, Search } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const stats = await getAdminDashboardStats();
  const settings = await getSystemSettings();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
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
              <div className="space-y-4">
                {stats.recentAudits.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all duration-200">
                    <div className={`p-2.5 rounded-xl shrink-0 ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {activity.description}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-full">
                          {formatRelativeTime(new Date(activity.createdAt))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {activity.user?.name?.[0] || "U"}
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {activity.user?.name || "System"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/30">•</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
                          {activity.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
                      <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors">
                        View Appeals →
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case "STAFF_ADD": return <UserPlus className="w-4 h-4" />;
    case "STAFF_REMOVE": return <UserMinus className="w-4 h-4" />;
    case "STUDENT_ADD": return <GraduationCap className="w-4 h-4" />;
    case "STUDENT_REMOVE": return <UserMinus className="w-4 h-4" />;
    case "SECTION_ADD": return <FolderOpen className="w-4 h-4" />;
    case "SECTION_UPDATE": return <BookOpen className="w-4 h-4" />;
    case "ATTENDANCE_EDIT": return <Edit className="w-4 h-4" />;
    case "ATTENDANCE_SCAN": return <Search className="w-4 h-4" />;
    case "SETTING_UPDATE": return <Settings className="w-4 h-4" />;
    case "APPEAL_REVIEW": return <CheckCircle className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
}

function getActivityColor(type: string) {
  if (type.includes("ADD") || type.includes("SCAN") || type.includes("REVIEW")) {
    return "bg-green-500/10 text-green-500 border border-green-500/20";
  }
  if (type.includes("REMOVE") || type.includes("DELETE")) {
    return "bg-red-500/10 text-red-500 border border-red-500/20";
  }
  if (type.includes("UPDATE") || type.includes("EDIT")) {
    return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
  }
  return "bg-muted text-muted-foreground border border-border";
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
