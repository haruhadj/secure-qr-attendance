"use client";

import { useState } from "react";
import { resetAllData, exportAllData } from "@/src/app/actions/admin";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle, Download, DatabaseBackup } from "lucide-react";

export default function DataManagementCard() {
  const [resetOpen, setResetOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = await exportAllData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `qr-attendance-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded successfully.");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleReset = async () => {
    if (confirm !== "RESET") {
      toast.error('Type "RESET" exactly to confirm.');
      return;
    }
    setResetting(true);
    try {
      const result = await resetAllData();
      if (result.success) {
        toast.success(result.message);
        setResetOpen(false);
        setConfirm("");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Data reset failed. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-border/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DatabaseBackup className="w-4 h-4 text-muted-foreground" />
          Data Management
        </CardTitle>
        <CardDescription>
          Export a backup of all system data or perform a full data reset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Backup */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Backup Data</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Downloads a JSON file containing all students, teachers, sections, subjects, attendance records, and settings. Passwords are never exported.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={exporting}
            onClick={handleExport}
            className="gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Preparing backup..." : "Export Backup (.json)"}
          </Button>
        </div>

        <div className="border-t border-border" />

        {/* Reset */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-red-500">Reset System Data</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently deletes all students, teachers, sections, subjects, attendance records, and logs. Admin accounts are preserved.
            </p>
          </div>

          {!resetOpen ? (
            <Button
              variant="outline"
              className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 gap-2"
              onClick={() => setResetOpen(true)}
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
                    All students, teachers, sections, subjects, attendance records, appeals, and audit logs will be permanently deleted. Only admin accounts remain. Consider exporting a backup first.
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
                  disabled={resetting}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  disabled={resetting || confirm !== "RESET"}
                  onClick={handleReset}
                  className="gap-2"
                >
                  {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {resetting ? "Resetting..." : "Confirm Reset"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={resetting}
                  onClick={() => { setResetOpen(false); setConfirm(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
