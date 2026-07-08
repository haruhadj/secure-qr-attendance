"use client";

import { useState } from "react";
import { createTerm, setActiveTerm, startNewSchoolYear } from "@/src/app/actions/admin";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { toast } from "sonner";
import { CalendarRange, Loader2, CheckCircle2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface TermRow {
  id: string;
  name: string;
  isActive: boolean;
  _count: { enrollments: number; attendances: number };
}

export default function SchoolYearCard({ terms }: { terms: TermRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const activate = async (id: string) => {
    setBusy(id);
    const res = await setActiveTerm(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    setBusy(null);
    router.refresh();
  };

  const startNewYear = async () => {
    if (!newName.trim()) {
      toast.error("Enter a name, e.g. AY 2026-2027.");
      return;
    }
    setBusy("new");
    const res = await startNewSchoolYear(newName);
    if (res.success) {
      toast.success(res.message);
      setNewName("");
    } else {
      toast.error(res.message);
    }
    setBusy(null);
    router.refresh();
  };

  return (
    <Card className="border-none shadow-xl shadow-border/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="w-4 h-4 text-muted-foreground" />
          School Year / Term
        </CardTitle>
        <CardDescription>
          Attendance and enrollments belong to the active school year. Starting a new year keeps all past
          records — it does not delete anything.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          {terms.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{t.name}</p>
                  {t.isActive && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t._count.enrollments} enrollments · {t._count.attendances} attendance records
                </p>
              </div>
              {!t.isActive && (
                <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => activate(t.id)}>
                  {busy === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Make active"}
                </Button>
              )}
            </div>
          ))}
          {terms.length === 0 && (
            <p className="text-sm text-muted-foreground italic">No terms yet — start your first school year below.</p>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-sm font-medium">Start a new school year</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. AY 2026-2027"
              className="bg-muted/50"
            />
            <Button onClick={startNewYear} disabled={busy === "new"} className="gap-2 shrink-0">
              {busy === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Start & activate
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            After starting, import this year&apos;s masterlist to enroll students into the new year.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
