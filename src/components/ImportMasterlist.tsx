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
  Users,
  FolderOpen,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

type ImportStage = "idle" | "preview" | "importing" | "done";

export function ImportMasterlist() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<ImportStage>("idle");
  const [parsed, setParsed] = useState<ParsedMasterlist | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStage("idle");
    setParsed(null);
    setResult(null);
    setFileName("");
    setExpandedSections(new Set());
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
      const importResult = await importMasterlist(parsed.sections);
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

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
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
                  <GraduationCap className="w-3.5 h-3.5" />
                  {parsed.totalStudents} Student{parsed.totalStudents !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1.5 py-1">
                  <Users className="w-3.5 h-3.5" />
                  {new Set(parsed.sections.map((s) => s.teacherEmail)).size} Teacher{parsed.sections.length !== 1 ? "s" : ""}
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

              {/* Section Preview */}
              {parsed.sections.map((section) => (
                <div key={section.sectionName} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.sectionName)}
                    className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{section.sectionName}</p>
                      <p className="text-xs text-muted-foreground">
                        Teacher: {section.teacherName} · {section.students.length} student{section.students.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {expandedSections.has(section.sectionName) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.has(section.sectionName) && (
                    <div className="p-3 space-y-1">
                      <div className="grid grid-cols-[1fr_2fr_2fr] gap-1 text-xs font-medium text-muted-foreground pb-1 border-b border-border">
                        <span>ID</span>
                        <span>Name</span>
                        <span>Email</span>
                      </div>
                      {section.students.map((student) => (
                        <div
                          key={student.studentId}
                          className="grid grid-cols-[1fr_2fr_2fr] gap-1 text-xs text-foreground py-1"
                        >
                          <span className="font-mono">{student.studentId}</span>
                          <span>{student.studentName}</span>
                          <span className="text-muted-foreground truncate">{student.studentEmail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

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
