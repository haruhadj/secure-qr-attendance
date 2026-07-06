"use client";

import { useState, useRef } from "react";
import { parseMasterlistCSV, type ParsedMasterlist } from "@/src/lib/csvParser";
import { importMasterlist, type ImportResult } from "@/src/app/actions/masterlist";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  FolderOpen,
  GraduationCap,
  BookOpen,
  RefreshCw,
} from "lucide-react";

type ImportStage = "idle" | "preview" | "importing" | "done";

export function ImportMasterlist() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<ImportStage>("idle");
  const [parsed, setParsed] = useState<ParsedMasterlist | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [expandTab, setExpandTab] = useState<"sections" | "subjects" | "students">("sections");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStage("idle");
    setParsed(null);
    setResult(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    setOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a .csv file.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsedData = parseMasterlistCSV(text);
      setParsed(parsedData);
      setStage("preview");

      if (parsedData.errors.length > 0 && parsedData.sections.length === 0) {
        toast.error("CSV has critical errors. Please fix them and try again.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!parsed || parsed.sections.length === 0) return;

    setStage("importing");
    try {
      const importResult = await importMasterlist(parsed);
      setResult(importResult);
      setStage("done");

      if (importResult.success) {
        toast.success(importResult.message);
      } else {
        toast.error(importResult.message);
      }
    } catch {
      toast.error("Import failed. Please try again.");
      setStage("preview");
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
        <Upload className="w-4 h-4" />
        Import Masterlist
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <CardHeader className="pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Import Masterlist
              </CardTitle>
              <CardDescription>
                Upload a CSV file to bulk-import sections, teachers, and students
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Stage: Idle — File Upload */}
          {stage === "idle" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">Click to select a CSV file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted format: .csv — See how_to_import_masterlist.md for the template
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Stage: Preview */}
          {stage === "preview" && parsed && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-medium">{fileName}</span>
                <Button variant="ghost" size="sm" onClick={resetState} className="h-7 text-xs gap-1 ml-auto">
                  <RefreshCw className="w-3 h-3" />
                  Choose Different File
                </Button>
              </div>

              {/* Summary Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1">
                  <FolderOpen className="w-3.5 h-3.5" />
                  {parsed.sections.length} Section{parsed.sections.length !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {parsed.subjects.length} Subject{parsed.subjects.length !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {parsed.totalStudents} Student{parsed.totalStudents !== 1 ? "s" : ""}
                </Badge>
                {parsed.errors.length > 0 && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1.5 py-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {parsed.errors.length} Error{parsed.errors.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {/* Validation Errors */}
              {parsed.errors.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Validation Errors
                  </p>
                  {parsed.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400">
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}

              {/* Tab switcher */}
              <div className="flex gap-1 border-b border-border">
                {(["sections", "subjects", "students"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setExpandTab(t)}
                    className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                      expandTab === t
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t} ({t === "sections" ? parsed.sections.length : t === "subjects" ? parsed.subjects.length : parsed.totalStudents})
                  </button>
                ))}
              </div>

              {/* Sections preview */}
              {expandTab === "sections" && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[2fr_2fr_2fr] gap-1 text-xs font-medium text-muted-foreground px-3 py-2 bg-muted/50 border-b border-border">
                    <span>Section</span><span>Adviser</span><span>Email</span>
                  </div>
                  {parsed.sections.map((s) => (
                    <div key={s.sectionName} className="grid grid-cols-[2fr_2fr_2fr] gap-1 text-xs px-3 py-2 border-b border-border/50 last:border-0">
                      <span className="font-medium text-foreground">{s.sectionName}</span>
                      <span className="text-muted-foreground">{s.adviserName}</span>
                      <span className="text-muted-foreground truncate">{s.adviserEmail}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subjects preview */}
              {expandTab === "subjects" && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_2fr_2fr_1fr] gap-1 text-xs font-medium text-muted-foreground px-3 py-2 bg-muted/50 border-b border-border">
                    <span>Code</span><span>Name</span><span>Teacher</span><span>Schedule</span>
                  </div>
                  {parsed.subjects.map((s) => (
                    <div key={s.code} className="grid grid-cols-[1fr_2fr_2fr_1fr] gap-1 text-xs px-3 py-2 border-b border-border/50 last:border-0">
                      <span className="font-mono font-bold text-primary">{s.code}</span>
                      <span className="text-foreground">{s.name}</span>
                      <span className="text-muted-foreground">{s.teacherName}</span>
                      <span className="text-muted-foreground">{s.scheduleDay ?? "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Students preview */}
              {expandTab === "students" && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr] gap-1 text-xs font-medium text-muted-foreground px-3 py-2 bg-muted/50 border-b border-border">
                    <span>ID</span><span>Name</span><span>Email</span><span>Year Level</span><span>Subjects</span>
                  </div>
                  {parsed.students.map((s) => (
                    <div key={s.studentId} className="grid grid-cols-[1fr_2fr_2fr_1fr_1fr] gap-1 text-xs px-3 py-2 border-b border-border/50 last:border-0">
                      <span className="font-mono">{s.studentId}</span>
                      <span className="text-foreground">{s.studentName}</span>
                      <span className="text-muted-foreground truncate">{s.studentEmail ?? "—"}</span>
                      <span className="text-muted-foreground">{s.yearLevel ?? "—"}</span>
                      <span className="text-muted-foreground">{s.subjectCodes.length}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm Button */}
              {parsed.sections.length > 0 && (
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmImport} className="flex-1 gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Import
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Stage: Importing */}
          {stage === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Importing masterlist...</p>
                <p className="text-xs text-muted-foreground mt-1">Creating accounts and generating QR codes</p>
              </div>
            </div>
          )}

          {/* Stage: Done */}
          {stage === "done" && result && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${result.success ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${result.success ? "text-green-500" : "text-red-500"}`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Details */}
              <div className="grid grid-cols-2 gap-2">
                {result.summary.sectionsCreated > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{result.summary.sectionsCreated}</p>
                    <p className="text-xs text-muted-foreground">Sections Created</p>
                  </div>
                )}
                {result.summary.sectionsExisting > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{result.summary.sectionsExisting}</p>
                    <p className="text-xs text-muted-foreground">Existing Sections</p>
                  </div>
                )}
                {result.summary.teachersCreated > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{result.summary.teachersCreated}</p>
                    <p className="text-xs text-muted-foreground">Teachers Created</p>
                  </div>
                )}
                {result.summary.studentsCreated > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{result.summary.studentsCreated}</p>
                    <p className="text-xs text-muted-foreground">Students Created</p>
                  </div>
                )}
                {result.summary.studentsUpdated > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{result.summary.studentsUpdated}</p>
                    <p className="text-xs text-muted-foreground">Students Updated</p>
                  </div>
                )}
              </div>

              {/* Import Errors */}
              {result.summary.errors.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-red-500">Import Errors</p>
                  {result.summary.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400">
                      {err.studentId}: {err.message}
                    </p>
                  ))}
                </div>
              )}

              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
