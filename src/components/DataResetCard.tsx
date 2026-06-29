"use client";

import { useState } from "react";
import { resetAllData } from "@/src/app/actions/admin";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

export default function DataResetCard() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (confirm !== "RESET") {
      toast.error('Type "RESET" exactly to confirm.');
      return;
    }
    setLoading(true);
    try {
      const result = await resetAllData();
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setConfirm("");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Data reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-border/5 border-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-red-500">
          <Trash2 className="w-4 h-4" />
          Reset System Data
        </CardTitle>
        <CardDescription>
          Permanently delete all students, teachers, sections, subjects, attendance records, and logs. Admin accounts are preserved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!open ? (
          <Button
            variant="outline"
            className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 gap-2"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="w-4 h-4" />
            Reset All Data
          </Button>
        ) : (
          <div className="space-y-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-500">This action is irreversible.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All students, teachers, sections, subjects, attendance records, appeals, and audit logs will be permanently deleted. Only admin accounts remain.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Type <span className="font-bold text-foreground">RESET</span> to confirm:
              </p>
              <Input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="RESET"
                className="max-w-xs font-mono"
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                disabled={loading || confirm !== "RESET"}
                onClick={handleReset}
                className="gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {loading ? "Resetting..." : "Confirm Reset"}
              </Button>
              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => { setOpen(false); setConfirm(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
