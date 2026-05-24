"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AddSectionForm,
  EditSectionModal,
  RemoveSectionButton,
  AddSubjectForm,
  EditSubjectModal,
  RemoveSubjectButton,
} from "@/src/components/MasterlistForms";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { FolderOpen, BookOpen, Search, ChevronRight, Users, Clock } from "lucide-react";

interface Section {
  id: string;
  name: string;
  teacher: { user: { name: string | null } } | null;
  _count: { students: number };
}

interface Subject {
  id: string;
  code: string;
  name: string;
  units?: number | null;
  scheduleDay?: string | null;
  scheduleTime?: string | null;
  teacherId?: string | null;
  teacher: { user: { name: string | null } } | null;
  _count: { enrollments: number };
}

interface Teacher {
  id: string;
  user: { name: string | null };
}

interface Props {
  sections: Section[];
  subjects: Subject[];
  teachers: Teacher[];
}

type Tab = "sections" | "subjects";

export default function MasterlistTabs({ sections, subjects, teachers }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = (searchParams.get("tab") as Tab) ?? "sections";

  // Local state for inputs — instant typing feedback
  const [sectionSearch, setSectionSearch] = useState(searchParams.get("sq") ?? "");
  const [subjectSearch, setSubjectSearch] = useState(searchParams.get("bq") ?? "");

  // Debounce URL updates so back-nav restores state, but router.replace doesn't fire every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setTab = (t: Tab) => setParam({ tab: t });

  const handleSectionSearch = (v: string) => {
    setSectionSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam({ sq: v }), 400);
  };

  const handleSubjectSearch = (v: string) => {
    setSubjectSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam({ bq: v }), 400);
  };

  // Sync local state if URL changes externally (e.g. back button)
  useEffect(() => {
    setSectionSearch(searchParams.get("sq") ?? "");
    setSubjectSearch(searchParams.get("bq") ?? "");
  }, [searchParams]);

  const filteredSections = sections.filter((s) => {
    const q = sectionSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.teacher?.user?.name ?? "").toLowerCase().includes(q)
    );
  });

  const filteredSubjects = subjects.filter((s) => {
    const q = subjectSearch.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.teacher?.user?.name ?? "").toLowerCase().includes(q) ||
      (s.scheduleDay ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl shadow-border/5 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-border bg-muted/30">
        <button
          onClick={() => setTab("sections")}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "sections"
              ? "border-primary text-primary bg-background"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Sections
          <Badge variant="outline" className="text-xs py-0 px-1.5 h-5 font-mono">
            {sections.length}
          </Badge>
        </button>
        <button
          onClick={() => setTab("subjects")}
          className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "subjects"
              ? "border-primary text-primary bg-background"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Subjects
          <Badge variant="outline" className="text-xs py-0 px-1.5 h-5 font-mono">
            {subjects.length}
          </Badge>
        </button>
      </div>

      <div className="bg-background">
        {/* Sections Tab */}
        {tab === "sections" && (
          <div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name or adviser…"
                  value={sectionSearch}
                  onChange={(e) => handleSectionSearch(e.target.value)}
                  className="pl-9 h-9 bg-muted/40 border-border"
                />
              </div>
              <div className="ml-auto">
                <AddSectionForm teachers={teachers} />
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Section</th>
                  <th className="hidden sm:table-cell text-left px-4 py-2.5 font-medium text-muted-foreground">Adviser</th>
                  <th className="hidden sm:table-cell text-left px-4 py-2.5 font-medium text-muted-foreground w-[15%]">Students</th>
                  <th className="px-4 py-2.5 w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.map((section) => (
                  <tr
                    key={section.id}
                    onClick={() => router.push(`/admin/masterlist/section/${section.id}`)}
                    className="border-b border-border/50 hover:bg-muted/40 cursor-pointer group transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                      <span className="flex items-center gap-2">
                        {section.name}
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </span>
                      <div className="sm:hidden text-xs font-normal text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>{section.teacher?.user?.name || <span className="text-amber-500">Unassigned</span>}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{section._count.students}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-muted-foreground">
                      {section.teacher?.user?.name || (
                        <span className="text-amber-500 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {section._count.students}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EditSectionModal section={section} teachers={teachers} />
                        <RemoveSectionButton sectionId={section.id} sectionName={section.name} />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSections.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic text-sm">
                      {sectionSearch ? `No sections matching "${sectionSearch}"` : "No sections yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Subjects Tab */}
        {tab === "subjects" && (
          <div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by code, name, teacher, or schedule…"
                  value={subjectSearch}
                  onChange={(e) => handleSubjectSearch(e.target.value)}
                  className="pl-9 h-9 bg-muted/40 border-border"
                />
              </div>
              <div className="ml-auto">
                <AddSubjectForm teachers={teachers} />
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[90px]">Code</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                  <th className="hidden md:table-cell text-left px-4 py-2.5 font-medium text-muted-foreground">Teacher</th>
                  <th className="hidden md:table-cell text-left px-4 py-2.5 font-medium text-muted-foreground">Schedule</th>
                  <th className="hidden sm:table-cell text-left px-4 py-2.5 font-medium text-muted-foreground w-[90px]">Enrolled</th>
                  <th className="px-4 py-2.5 w-[80px]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    onClick={() => router.push(`/admin/masterlist/subject/${subject.id}`)}
                    className="border-b border-border/50 hover:bg-muted/40 cursor-pointer group transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-primary text-xs">
                      {subject.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground group-hover:text-primary transition-colors">
                      <span className="flex items-center gap-2">
                        {subject.name}
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </span>
                      <div className="md:hidden text-xs font-normal text-muted-foreground mt-0.5 space-y-0.5">
                        <div>{subject.teacher?.user?.name || <span className="text-amber-500">Unassigned</span>}</div>
                        {subject.scheduleDay && (
                          <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{subject.scheduleDay}{subject.scheduleTime && ` · ${subject.scheduleTime}`}</div>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                      {subject.teacher?.user?.name || (
                        <span className="text-amber-500 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-muted-foreground">
                      {subject.scheduleDay ? (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {subject.scheduleDay}
                          {subject.scheduleTime && ` · ${subject.scheduleTime}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {subject._count.enrollments}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EditSubjectModal subject={subject} teachers={teachers} />
                        <RemoveSubjectButton subjectId={subject.id} subjectCode={subject.code} />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSubjects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic text-sm">
                      {subjectSearch ? `No subjects matching "${subjectSearch}"` : "No subjects yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
