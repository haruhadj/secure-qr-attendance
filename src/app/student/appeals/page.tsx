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
import AppealForm from "@/src/components/AppealForm";
import { Badge } from "@/src/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function StudentAppeals() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== UserRole.STUDENT) {
    redirect("/");
  }

  const student = await prisma.student.findUnique({
    where: { userId: (session.user as any).id },
    include: {
      appeals: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!student) redirect("/");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
              Attendance Appeals
            </h1>
            <p className="text-muted-foreground">
              Submit proof for missed attendance or status corrections
            </p>
          </div>
          <Badge variant="outline" className="bg-background">
            {student.studentId}
          </Badge>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-xl shadow-border/5 h-fit">
            <CardHeader>
              <CardTitle>Submit Appeal</CardTitle>
              <CardDescription>
                Upload a photo of your medical certificate or reason for absence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppealForm studentId={student.id} />
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-border/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Previous Appeals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {student.appeals.map((appeal) => (
                  <div key={appeal.id} className="p-4 bg-card rounded-xl border border-border flex items-start justify-between shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {appeal.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        SUBMITTED: {new Date(appeal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {appeal.status === 'PENDING' ? (
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 flex gap-1 items-center">
                          <Clock className="w-3 h-3" /> Pending
                        </Badge>
                      ) : appeal.status === 'APPROVED' ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 flex gap-1 items-center">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 flex gap-1 items-center">
                          <XCircle className="w-3 h-3" /> Rejected
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {student.appeals.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground italic">
                    You haven't submitted any appeals yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
