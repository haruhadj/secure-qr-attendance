"use client";

import { useState, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { AttendanceStatus } from "@prisma/client";
import { updateAttendance } from "@/src/app/actions/attendance";
import { toast } from "sonner";
import { Circle, CheckCircle2, XCircle, Clock } from "lucide-react";

interface RosterStudent {
  id: string;
  studentId: string;
  name: string;
  status: AttendanceStatus | null;
  sectionId: string;
}

export default function RosterTable({ 
  students: initialStudents, 
  selectedDate 
}: { 
  students: RosterStudent[], 
  selectedDate?: Date 
}) {
  const [students, setStudents] = useState(initialStudents);

  // Sync local state when server-provided props change (e.g. after revalidation)
  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);
  const pendingTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleStatusChange = (studentId: string, sectionId: string, newStatus: AttendanceStatus) => {
    const studentIndex = students.findIndex(s => s.id === studentId);
    const oldStatus = students[studentIndex].status;

    if (newStatus === oldStatus) return;

    // 1. Optimistic UI update
    const updatedStudents = [...students];
    updatedStudents[studentIndex].status = newStatus;
    setStudents(updatedStudents);

    // 2. Clear pre-existing pending update for this student
    if (pendingTimeouts.current[studentId]) {
      clearTimeout(pendingTimeouts.current[studentId]);
    }

    // 3. Setup toast with Undo
    const toastId = toast.info(`Marking ${students[studentIndex].name} as ${newStatus.toLowerCase()}...`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          // Revert optimistic UI
          clearTimeout(pendingTimeouts.current[studentId]);
          delete pendingTimeouts.current[studentId];
          
          const revertedStudents = [...students];
          revertedStudents[studentIndex].status = oldStatus;
          setStudents(revertedStudents);
          
          toast.dismiss(toastId);
          toast.info("Change reverted.");
        }
      }
    });

    // 4. Set 5s timeout to commit to DB
    pendingTimeouts.current[studentId] = setTimeout(async () => {
      try {
        await updateAttendance(studentId, sectionId, newStatus, oldStatus || undefined, selectedDate);
        delete pendingTimeouts.current[studentId];
        toast.success(`${students[studentIndex].name} updated successfully.`, { id: toastId });
      } catch (error: any) {
        toast.error(error.message || "Failed to sync change.", { id: toastId });
        // Revert UI on error
        const revertedStudents = [...students];
        revertedStudents[studentIndex].status = oldStatus;
        setStudents(revertedStudents);
      }
    }, 5000);
  };

  const getStatusBadge = (status: AttendanceStatus | null) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Present</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Late</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground/50 border-border">Not Set</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-border">
          <TableHead className="w-[120px]">Student ID</TableHead>
          <TableHead>Account Name</TableHead>
          <TableHead>Current Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id} className="border-border/50 group hover:bg-muted/50 transition-colors">
            <TableCell className="font-mono text-xs font-medium text-muted-foreground">
              {student.studentId}
            </TableCell>
            <TableCell className="font-medium text-foreground">
              {student.name}
            </TableCell>
            <TableCell>
              {getStatusBadge(student.status)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-colors ${student.status === 'PRESENT' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground/50 hover:text-green-500 hover:bg-green-500/10'}`}
                  onClick={() => handleStatusChange(student.id, student.sectionId, "PRESENT")}
                  title="Mark Present"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-colors ${student.status === 'LATE' ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/10'}`}
                  onClick={() => handleStatusChange(student.id, student.sectionId, "LATE")}
                  title="Mark Late"
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-full transition-colors ${student.status === 'ABSENT' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10'}`}
                  onClick={() => handleStatusChange(student.id, student.sectionId, "ABSENT")}
                  title="Mark Absent"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
