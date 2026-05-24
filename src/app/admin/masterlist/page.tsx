/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getMasterlist } from "@/src/app/actions/masterlist";
import { Badge } from "@/src/components/ui/badge";
import { Users, FolderOpen, GraduationCap, BookOpen } from "lucide-react";
import { ImportMasterlist } from "@/src/components/ImportMasterlist";
import MasterlistTabs from "@/src/components/MasterlistTabs";

export default async function AdminMasterlist() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect("/");
  }

  const { students, sections, subjects, teachers } = await getMasterlist();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 md:gap-3">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-primary shrink-0" />
              Masterlist
            </h1>
            <p className="text-muted-foreground">
              Manage students, sections, and subjects
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
            <Badge variant="outline" className="bg-card py-1.5 px-3 gap-2">
              <BookOpen className="w-4 h-4" />
              {subjects.length} Subjects
            </Badge>
            <ImportMasterlist />
          </div>
        </header>

        <MasterlistTabs sections={sections} subjects={subjects} teachers={teachers} />
      </div>
    </div>
  );
}
