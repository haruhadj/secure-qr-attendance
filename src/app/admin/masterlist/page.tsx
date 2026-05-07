/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getMasterlist } from "@/src/app/actions/masterlist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";

import {
  AddStudentForm,
  AddSectionForm,
  EditSectionModal,
  RemoveSectionButton,
} from "@/src/components/MasterlistForms";
import { Users, FolderOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import { ImportMasterlist } from "@/src/components/ImportMasterlist";

export default async function AdminMasterlist() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const { students, sections, teachers } = await getMasterlist();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Masterlist
            </h1>
            <p className="text-muted-foreground">
              Manage students, sections, and enrollment
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="bg-card py-1.5 px-3 gap-2">
              <GraduationCap className="w-4 h-4" />
              {students.length} Students
            </Badge>
            <Badge variant="outline" className="bg-card py-1.5 px-3 gap-2">
              <FolderOpen className="w-4 h-4" />
              {sections.length} Sections
            </Badge>
            <ImportMasterlist />
          </div>
        </header>

        {/* Sections Overview */}
        <Card className="border-none shadow-xl shadow-border/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-muted-foreground" />
                  Sections
                </CardTitle>
                <CardDescription>Active class sections and assigned teachers</CardDescription>
              </div>
              <AddSectionForm teachers={teachers} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="relative p-4 bg-muted/50 rounded-xl border border-border hover:shadow-md transition-shadow flex flex-col gap-2 group overflow-hidden"
                >
                  <Link href={`/admin/masterlist/${section.id}`} className="absolute inset-0 z-0" />
                  <div className="flex items-start justify-between gap-2 relative z-10 pointer-events-none">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{section.name}</p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                        <EditSectionModal section={section} teachers={teachers} />
                        <RemoveSectionButton sectionId={section.id} sectionName={section.name} />
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0 pointer-events-auto">
                      {section._count.students} students
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground relative z-10 pointer-events-none">
                    Teacher:{" "}
                    {section.teacher?.user?.name || (
                      <span className="text-amber-500">Unassigned</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
