/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getStaff } from "@/src/app/actions/admin";
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
import { AddStaffForm, RemoveStaffButton, ResetStaffPasswordButton } from "@/src/components/StaffForms";
import { ShieldCheck, Users, Briefcase } from "lucide-react";

export default async function AdminStaffManagement() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const currentUserId = (session.user as any).id;
  const staff = await getStaff();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-primary" />
              Staff Management
            </h1>
            <p className="text-muted-foreground">
              Manage administrators and teachers
            </p>
          </div>
        </header>

        {/* Add Staff Form */}
        <AddStaffForm />

        {/* Staff Table */}
        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              System Staff
            </CardTitle>
            <CardDescription>
              All active administrative and teaching personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Subjects / Adviser</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">
                      {user.name}
                      {user.id === currentUserId && (
                        <Badge variant="outline" className="ml-2 text-[10px] text-primary border-primary/50">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.role === UserRole.ADMIN ? (
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1">
                          <Users className="w-3 h-3" /> Teacher
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.role === UserRole.TEACHER && user.teacher ? (
                        <div className="flex flex-wrap gap-1">
                          {user.teacher.subjects.map((s) => (
                            <Badge key={s.id} variant="outline" className="text-[10px] font-mono">
                              {s.code}
                            </Badge>
                          ))}
                          {user.teacher.sections.map((s) => (
                            <Badge key={s.id} className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {s.name}
                            </Badge>
                          ))}
                          {user.teacher.subjects.length === 0 && user.teacher.sections.length === 0 && (
                            <span className="text-xs text-muted-foreground/50">None</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <ResetStaffPasswordButton
                          userId={user.id}
                          userName={user.name || "Unknown"}
                          currentUserId={currentUserId}
                        />
                        <RemoveStaffButton
                          userId={user.id}
                          userName={user.name || "Unknown"}
                          currentUserId={currentUserId}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
