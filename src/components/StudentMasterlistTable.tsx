"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import {
  EditStudentModal,
  RemoveStudentButton,
  ViewQrModal,
  ManageStudentSubjectsModal,
} from "@/src/components/MasterlistForms";
import { toast } from "sonner";
import {
  bulkRemoveStudents,
  bulkMoveStudentsToSection,
  bulkSetStudentsSubject,
  bulkResetStudentPasswords,
} from "@/src/app/actions/masterlist";
import { Trash2, FolderInput, BookOpen, KeyRound, Loader2, X } from "lucide-react";

interface StudentRow {
  id: string;
  studentId: string;
  qrToken: string;
  sectionId: string | null;
  yearLevel?: string | null;
  user: { name: string | null; email: string | null; username?: string | null };
  enrolledSubjects: { subjectId: string }[];
}

interface Props {
  students: StudentRow[];
  sections: { id: string; name: string }[];
  subjects: { id: string; code: string; name: string }[];
}

type BulkAction = "delete" | "move" | "subject" | "reset";

export default function StudentMasterlistTable({ students, sections, subjects }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<BulkAction | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal inputs
  const [targetSectionId, setTargetSectionId] = useState("");
  const [targetSubjectId, setTargetSubjectId] = useState("");
  const [subjectMode, setSubjectMode] = useState<"enroll" | "unenroll">("enroll");

  const ids = useMemo(() => Array.from(selected), [selected]);
  const allSelected = students.length > 0 && selected.size === students.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const closeModal = () => {
    setAction(null);
    setTargetSectionId("");
    setTargetSubjectId("");
    setSubjectMode("enroll");
  };

  const finish = (result: { success: boolean; message: string; failed?: { name: string; message: string }[] }) => {
    if (result.success) toast.success(result.message);
    else {
      toast.error(result.message);
      result.failed?.slice(0, 3).forEach((f) => toast.error(`${f.name}: ${f.message}`));
    }
    clearSelection();
    closeModal();
    router.refresh();
  };

  const run = async () => {
    setLoading(true);
    try {
      if (action === "delete") {
        finish(await bulkRemoveStudents(ids));
      } else if (action === "move") {
        if (!targetSectionId) { toast.error("Pick a section."); setLoading(false); return; }
        finish(await bulkMoveStudentsToSection(ids, targetSectionId));
      } else if (action === "subject") {
        if (!targetSubjectId) { toast.error("Pick a subject."); setLoading(false); return; }
        finish(await bulkSetStudentsSubject(ids, targetSubjectId, subjectMode === "enroll"));
      } else if (action === "reset") {
        finish(await bulkResetStudentPasswords(ids));
      }
    } catch {
      toast.error("Bulk action failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <input
                type="checkbox"
                aria-label="Select all students"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 accent-primary cursor-pointer"
              />
            </TableHead>
            <TableHead className="w-[110px]">Student ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell w-[110px]">Year Level</TableHead>
            <TableHead className="w-[130px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const isSelected = selected.has(student.id);
            return (
              <TableRow key={student.id} data-state={isSelected ? "selected" : undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Select ${student.user.name ?? student.studentId}`}
                    checked={isSelected}
                    onChange={() => toggleOne(student.id)}
                    className="h-4 w-4 accent-primary cursor-pointer"
                  />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {student.studentId}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <div>{student.user.name}</div>
                  {student.user.username && (
                    <div className="text-xs text-muted-foreground font-mono">@{student.user.username}</div>
                  )}
                  <div className="md:hidden text-xs text-muted-foreground truncate max-w-[140px]">{student.user.email}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {student.user.email}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {student.yearLevel || <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <ManageStudentSubjectsModal
                      studentDbId={student.id}
                      studentName={student.user.name || "Unknown"}
                      allSubjects={subjects.map((s) => ({ id: s.id, code: s.code, name: s.name }))}
                      enrolledSubjectIds={student.enrolledSubjects.map((e) => e.subjectId)}
                    />
                    <ViewQrModal
                      studentName={student.user.name || "Unknown"}
                      qrToken={student.qrToken}
                    />
                    <EditStudentModal
                      student={student}
                      sections={sections}
                    />
                    <RemoveStudentButton
                      studentDbId={student.id}
                      studentName={student.user.name || "Unknown"}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                No students in this section yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card/95 backdrop-blur px-4 py-3 shadow-2xl">
            <span className="text-sm font-medium text-foreground mr-1">
              {selected.size} selected
            </span>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAction("move")}>
              <FolderInput className="w-4 h-4" /> Move section
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAction("subject")}>
              <BookOpen className="w-4 h-4" /> Subject
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAction("reset")}>
              <KeyRound className="w-4 h-4" /> Reset password
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setAction("delete")}>
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 ml-auto text-muted-foreground" onClick={clearSelection}>
              <X className="w-4 h-4" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Action modal */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            {action === "delete" && (
              <>
                <h2 className="text-lg font-bold text-foreground">Delete {selected.size} student(s)?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This permanently removes the selected students along with their appeals,
                  attendance, enrollments, and login accounts. This cannot be undone.
                </p>
              </>
            )}
            {action === "move" && (
              <>
                <h2 className="text-lg font-bold text-foreground">Move {selected.size} student(s) to a section</h2>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a section…</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </>
            )}
            {action === "subject" && (
              <>
                <h2 className="text-lg font-bold text-foreground">Enroll / unenroll {selected.size} student(s)</h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={subjectMode === "enroll" ? "default" : "outline"}
                    onClick={() => setSubjectMode("enroll")}
                    className="flex-1"
                  >
                    Enroll
                  </Button>
                  <Button
                    size="sm"
                    variant={subjectMode === "unenroll" ? "default" : "outline"}
                    onClick={() => setSubjectMode("unenroll")}
                    className="flex-1"
                  >
                    Unenroll
                  </Button>
                </div>
                <select
                  value={targetSubjectId}
                  onChange={(e) => setTargetSubjectId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a subject…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
              </>
            )}
            {action === "reset" && (
              <>
                <h2 className="text-lg font-bold text-foreground">Reset {selected.size} password(s)?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each selected student&apos;s password will be reset to their default (their Student ID).
                  Tell them to sign in with their Student ID and change it afterward.
                </p>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={closeModal} disabled={loading}>Cancel</Button>
              <Button
                size="sm"
                className={action === "delete" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                onClick={run}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {action === "delete" ? "Delete" : action === "move" ? "Move" : action === "subject" ? (subjectMode === "enroll" ? "Enroll" : "Unenroll") : "Reset"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
