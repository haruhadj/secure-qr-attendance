/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getTeacherAppeals } from "@/src/app/actions/appeals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import AppealReviewActions from "@/src/components/AppealReviewActions";
import { FileWarning, Clock, CheckCircle, XCircle, Inbox } from "lucide-react";

export default async function TeacherAppeals() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.TEACHER) {
    redirect("/");
  }

  const appeals = await getTeacherAppeals();

  const pending = appeals.filter((a) => a.status === "PENDING");
  const reviewed = appeals.filter((a) => a.status !== "PENDING");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FileWarning className="w-8 h-8 text-primary" />
            Student Appeals
          </h1>
          <p className="text-muted-foreground">
            Review attendance correction requests from your students
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-none shadow-xl shadow-border/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pending.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl shadow-border/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/10 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {reviewed.filter((a) => a.status === "APPROVED").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl shadow-border/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {reviewed.filter((a) => a.status === "REJECTED").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Appeals */}
        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Review
            </CardTitle>
            <CardDescription>
              {pending.length} appeal{pending.length !== 1 ? "s" : ""} awaiting your decision
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground italic">
                  No pending appeals. All caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((appeal) => (
                  <div
                    key={appeal.id}
                    className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {appeal.student.user.name}
                        </p>
                        <Badge variant="outline" className="text-[10px] font-mono border-border">
                          {appeal.student.studentId}
                        </Badge>
                        {appeal.student.section && (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                            {appeal.student.section.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {appeal.description}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground/50">
                        Submitted: {new Date(appeal.createdAt).toLocaleDateString()}{" "}
                        {new Date(appeal.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <AppealReviewActions appealId={appeal.id} imageUrl={appeal.imageUrl} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviewed Appeals */}
        {reviewed.length > 0 && (
          <Card className="border-none shadow-xl shadow-border/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-5 h-5" />
                Previously Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reviewed.map((appeal) => (
                  <div
                    key={appeal.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      appeal.status === "APPROVED"
                        ? "bg-green-500/5 border-green-500/10"
                        : "bg-red-500/5 border-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-full ${
                          appeal.status === "APPROVED" ? "bg-green-500/10" : "bg-red-500/10"
                        }`}
                      >
                        {appeal.status === "APPROVED" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {appeal.student.user.name} — {appeal.description}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground/50">
                          Reviewed:{" "}
                          {appeal.reviewedAt
                            ? new Date(appeal.reviewedAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        appeal.status === "APPROVED"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }
                    >
                      {appeal.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
