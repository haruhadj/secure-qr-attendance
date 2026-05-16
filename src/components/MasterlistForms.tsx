"use client";

import { useState } from "react";
import { addStudent, removeStudent, addSection, updateSection, removeSection, updateStudent, adminUpdateAttendance, deleteAttendance, resetStudentPassword, regenerateQrToken } from "@/src/app/actions/masterlist";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Trash2, Loader2, FolderPlus, X, Edit2, QrCode, Clock, RefreshCw, KeyRound, ClipboardEdit } from "lucide-react";
import { formatDate } from "@/src/lib/date";
import { QRCodeSVG } from "qrcode.react";

interface Section {
  id: string;
  name: string;
}

export function AddStudentForm({ 
  sections, 
  initialSectionId 
}: { 
  sections: Section[]; 
  initialSectionId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    studentId: "",
    sectionId: initialSectionId || sections[0]?.id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await addStudent(form);
      if (result.success) {
        toast.success(result.message);
        setForm({ 
          name: "", 
          email: "", 
          studentId: "", 
          sectionId: initialSectionId || sections[0]?.id || "" 
        });
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to add student.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="w-4 h-4" />
        Add Student
      </Button>
    );
  }

  return (
    <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Add New Student</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Juan Dela Cruz"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@student.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sid">Student ID</Label>
            <Input
              id="sid"
              placeholder="2022-0006"
              value={form.studentId}
              onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
              required
            />
          </div>
          {!initialSectionId && (
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <select
                id="section"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.sectionId}
                onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                required
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={initialSectionId ? "md:col-span-2" : "md:col-span-2"}>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function AddSectionForm({ teachers }: { teachers: { id: string; user: { name: string | null } }[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await addSection(name, teacherId);
      if (result.success) {
        toast.success(result.message);
        setName("");
        setTeacherId("");
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to create section.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <FolderPlus className="w-4 h-4" />
        Add Section
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      <div className="space-y-2 flex-1 min-w-[150px]">
        <Label htmlFor="sname">Section Name</Label>
        <Input
          id="sname"
          placeholder="STEM-B"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2 flex-1 min-w-[150px]">
        <Label htmlFor="steacher">Assign Teacher</Label>
        <select
          id="steacher"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.user.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={loading} className="gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
        Create
      </Button>
      <Button type="button" variant="ghost" onClick={() => { setOpen(false); setName(""); setTeacherId(""); }}>
        Cancel
      </Button>
    </form>
  );
}

export function EditSectionModal({
  section,
  teachers,
}: {
  section: { id: string; name: string; teacherId?: string | null };
  teachers: { id: string; user: { name: string | null } }[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(section.name);
  const [teacherId, setTeacherId] = useState(section.teacherId || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateSection(section.id, { name, teacherId });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update section.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-primary">
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle>Edit Section</CardTitle>
          <CardDescription>Update section details and assigned teacher.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`esname-${section.id}`}>Section Name</Label>
              <Input
                id={`esname-${section.id}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`esteacher-${section.id}`}>Assign Teacher</Label>
              <select
                id={`esteacher-${section.id}`}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setName(section.name); setTeacherId(section.teacherId || ""); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function RemoveSectionButton({ sectionId, sectionName }: { sectionId: string; sectionName: string }) {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Delete section "${sectionName}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const result = await removeSection(sectionId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to delete section.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
      onClick={handleRemove}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </Button>
  );
}

export function EditStudentModal({
  student,
  sections,
}: {
  student: { id: string; studentId: string; sectionId: string | null; user: { name: string | null; email: string | null } };
  sections: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [form, setForm] = useState({
    name: student.user.name || "",
    email: student.user.email || "",
    studentId: student.studentId,
    sectionId: student.sectionId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateStudent(student.id, form);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to update student.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm(`Reset password for "${student.user.name}" to their Student ID?`)) return;
    setPwLoading(true);
    try {
      const result = await resetStudentPassword(student.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error("Failed to reset password.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleRegenQr = async () => {
    if (!confirm(`Regenerate QR token for "${student.user.name}"? Their old QR will stop working.`)) return;
    setQrLoading(true);
    try {
      const result = await regenerateQrToken(student.id);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error("Failed to regenerate QR.");
    } finally {
      setQrLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-primary">
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle>Edit Student</CardTitle>
          <CardDescription>Update student details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`ename-${student.id}`}>Full Name</Label>
              <Input
                id={`ename-${student.id}`}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`eemail-${student.id}`}>Email</Label>
              <Input
                id={`eemail-${student.id}`}
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`esid-${student.id}`}>Student ID</Label>
              <Input
                id={`esid-${student.id}`}
                value={form.studentId}
                onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`esection-${student.id}`}>Section</Label>
              <select
                id={`esection-${student.id}`}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.sectionId}
                onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
          <div className="border-t pt-4 mt-2 space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Admin Actions</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                onClick={handleResetPassword}
                disabled={pwLoading}
              >
                {pwLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                Reset Password
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                onClick={handleRegenQr}
                disabled={qrLoading}
              >
                {qrLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Regenerate QR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RemoveStudentButton({
  studentDbId,
  studentName,
}: {
  studentDbId: string;
  studentName: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove "${studentName}" from the system? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const result = await removeStudent(studentDbId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to remove student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
      onClick={handleRemove}
      disabled={loading}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </Button>
  );
}

export function EditAttendanceModal({
  studentDbId,
  studentName,
  sectionId,
  selectedDate,
  currentStatus,
  currentTime,
}: {
  studentDbId: string;
  studentName: string;
  sectionId: string;
  selectedDate: Date;
  currentStatus: string | null;
  currentTime: Date | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>(currentStatus || "");
  const [time, setTime] = useState<string>(
    currentTime
      ? `${String(new Date(currentTime).getUTCHours()).padStart(2, "0")}:${String(new Date(currentTime).getUTCMinutes()).padStart(2, "0")}`
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) { toast.error("Please select a status."); return; }
    setLoading(true);
    try {
      const result = await adminUpdateAttendance(
        studentDbId,
        sectionId,
        selectedDate,
        status as "PRESENT" | "ABSENT" | "LATE",
        time || undefined
      );
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error("Failed to update attendance.");
      }
    } catch {
      toast.error("Failed to update attendance.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        title="Edit Attendance"
      >
        <ClipboardEdit className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Attendance</CardTitle>
              <CardDescription>{studentName} — {formatDate(selectedDate)}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {(["PRESENT", "LATE", "ABSENT"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-colors ${
                      s === "PRESENT"
                        ? status === s
                          ? "bg-green-500 text-white border-green-500"
                          : "border-green-500/30 text-green-600 hover:bg-green-500/10"
                        : s === "LATE"
                        ? status === s
                          ? "bg-amber-500 text-white border-amber-500"
                          : "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                        : status === s
                        ? "bg-red-500 text-white border-red-500"
                        : "border-red-500/30 text-red-600 hover:bg-red-500/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`att-time-${studentDbId}`} className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Attendance Time <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id={`att-time-${studentDbId}`}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !status} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function DeleteAttendanceButton({
  studentDbId,
  studentName,
  sectionId,
  selectedDate,
  hasAttendance,
}: {
  studentDbId: string;
  studentName: string;
  sectionId: string;
  selectedDate: Date;
  hasAttendance: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Clear attendance record for "${studentName}" on ${formatDate(selectedDate)}?`)) return;
    setLoading(true);
    try {
      const result = await deleteAttendance(studentDbId, sectionId, selectedDate);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error("Failed to clear attendance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${
        hasAttendance
          ? "text-orange-400 hover:text-orange-500 hover:bg-orange-500/10"
          : "text-muted-foreground/20 cursor-not-allowed"
      }`}
      onClick={hasAttendance ? handleDelete : undefined}
      disabled={loading || !hasAttendance}
      title={hasAttendance ? "Clear attendance record" : "No attendance record"}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </Button>
  );
}

export function ViewQrModal({
  studentName,
  qrToken,
}: {
  studentName: string;
  qrToken: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        title="View QR Code"
      >
        <QrCode className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm shadow-2xl border-none overflow-hidden text-card-foreground">
        <CardHeader className="bg-primary text-primary-foreground pb-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Student QR Code</CardTitle>
              <CardDescription className="text-primary-foreground/70">
                {studentName}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="-mt-6 flex flex-col items-center">
          <div className="p-6 bg-card rounded-3xl shadow-lg border-4 border-primary/10">
            <div className="p-2 bg-white rounded-xl">
              <QRCodeSVG
                value={qrToken}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>
          <div className="mt-6 text-center space-y-2 pb-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              QR Token Reference
            </p>
            <code className="text-xs font-mono bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
              {qrToken}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

