"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { getAttendanceRange } from "@/src/app/actions/masterlist";
import { toast } from "sonner";

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatColDate(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const y = date.getUTCFullYear();
  return `${m}/${d}/${y}`;
}

export default function ExportCsvButton({ subjectId, subjectName }: { subjectId: string; subjectName: string }) {
  const now = new Date();
  const firstOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const [from, setFrom] = useState(toLocalDateString(firstOfMonth));
  const [to, setTo] = useState(toLocalDateString(today));
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!from || !to) {
      toast.error("Please select both a start and end date.");
      return;
    }
    const fromDate = parseLocalDate(from);
    const toDate = parseLocalDate(to);
    if (fromDate > toDate) {
      toast.error("Start date must be before end date.");
      return;
    }

    setLoading(true);
    try {
      const { students } = await getAttendanceRange(subjectId, fromDate, toDate);

      // Build the list of unique dates in range
      const dates: Date[] = [];
      const cur = new Date(fromDate);
      while (cur <= toDate) {
        dates.push(new Date(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }

      // CSV header
      const headers = ["Student ID", "Name", ...dates.map(formatColDate)];

      // CSV rows
      const rows = students.map((student) => {
        const attendanceMap = new Map(
          student.attendances.map((a) => [
            new Date(a.date).toISOString().slice(0, 10),
            a.status,
          ])
        );
        const cells = dates.map((d) => {
          const key = d.toISOString().slice(0, 10);
          return attendanceMap.get(key) ?? "—";
        });
        return [student.studentId, student.user.name ?? "", ...cells];
      });

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${subjectName}_attendance_${from}_to_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully.");
    } catch (err) {
      toast.error("Failed to export. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-9 w-[150px] text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-9 w-[150px] text-sm"
        />
      </div>
      <Button
        onClick={handleExport}
        disabled={loading}
        variant="outline"
        className="h-9 gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {loading ? "Exporting..." : "Export CSV"}
      </Button>
    </div>
  );
}
