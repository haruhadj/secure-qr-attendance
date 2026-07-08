"use client";

import { useState } from "react";
import { addStudent, removeStudent, addSection, updateSection, removeSection, updateStudent, adminUpdateAttendance, deleteAttendance, resetStudentPasswordToTemp, regenerateQrToken, addSubject, updateSubject, removeSubject, updateStudentEnrollments } from "@/src/app/actions/masterlist";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Trash2, Loader2, FolderPlus, X, Edit2, QrCode, Clock, RefreshCw, KeyRound, ClipboardEdit, Copy, Check, Eye, EyeOff, ShieldAlert, BookOpen, BookMarked } from "lucide-react";
import { formatDate } from "@/src/lib/date";
import { encodeSchedule, decodeSchedule } from "@/src/lib/schedule";
import { deriveUsername } from "@/src/lib/username";
import { QRCodeSVG } from "qrcode.react";
import { QrDownloadButton } from "@/src/components/QrDownloadButton";

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
    username: "",
    studentId: "",
    sectionId: initialSectionId || sections[0]?.id || "",
    yearLevel: "",
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
          username: "",
          studentId: "",
          sectionId: initialSectionId || sections[0]?.id || "",
          yearLevel: "",
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
            <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@student.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground/60">Leave blank if unknown — you can add it later.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="username"
              placeholder={deriveUsername(form.name) || "michaelfernandez"}
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground/60">Used to log in. Defaults to first + last name if blank.</p>
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
            <p className="text-[11px] text-muted-foreground/60">Default login password will be their Student ID.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearLevel">Year Level <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="yearLevel"
              placeholder="Grade 10"
              value={form.yearLevel}
              onChange={(e) => setForm((f) => ({ ...f, yearLevel: e.target.value }))}
            />
          </div>
          {!initialSectionId && (
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <select
                id="section"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

function generateTempPassword(): string {
  const letters = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  let pass = "";
  for (let i = 0; i < 5; i++) pass += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 3; i++) pass += digits[Math.floor(Math.random() * digits.length)];
  return pass;
}

export function EditStudentModal({
  student,
  sections,
}: {
  student: { id: string; studentId: string; sectionId: string | null; yearLevel?: string | null; user: { name: string | null; email: string | null; username?: string | null } };
  sections: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [tempPw, setTempPw] = useState("");
  const [pwCopied, setPwCopied] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [form, setForm] = useState({
    name: student.user.name || "",
    email: student.user.email || "",
    username: student.user.username || "",
    studentId: student.studentId,
    sectionId: student.sectionId || "",
    yearLevel: student.yearLevel || "",
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

  const handleOpenPwModal = () => {
    setTempPw(generateTempPassword());
    setPwDone(false);
    setPwCopied(false);
    setShowPw(false);
    setPwModalOpen(true);
  };

  const handlePwRegenerate = () => {
    setTempPw(generateTempPassword());
    setPwCopied(false);
  };

  const handlePwCopy = async () => {
    await navigator.clipboard.writeText(tempPw);
    setPwCopied(true);
    setTimeout(() => setPwCopied(false), 2000);
  };

  const handlePwConfirm = async () => {
    setPwLoading(true);
    try {
      const result = await resetStudentPasswordToTemp(student.id, tempPw);
      if (result.success) {
        setPwDone(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
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
    <>
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
              <Label htmlFor={`eemail-${student.id}`}>Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id={`eemail-${student.id}`}
                type="email"
                placeholder="Leave blank if unknown"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`eusername-${student.id}`}>Username</Label>
              <Input
                id={`eusername-${student.id}`}
                placeholder={deriveUsername(form.name) || "michaelfernandez"}
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground/60">Login handle. Leave blank to regenerate from the name.</p>
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
              <Label htmlFor={`eyearlevel-${student.id}`}>Year Level <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id={`eyearlevel-${student.id}`}
                placeholder="Grade 10"
                value={form.yearLevel}
                onChange={(e) => setForm((f) => ({ ...f, yearLevel: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`esection-${student.id}`}>Section</Label>
              <select
                id={`esection-${student.id}`}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                onClick={handleOpenPwModal}
              >
                <KeyRound className="w-3.5 h-3.5" />
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

    {pwModalOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-base">Reset Password</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{student.user.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPwModalOpen(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pwDone ? (
              <>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    A new temporary password will be set for <span className="font-semibold text-foreground">{student.user.name}</span>. Share it with them and advise them to change it after logging in.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temporary Password</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        readOnly
                        type={showPw ? "text" : "password"}
                        value={tempPw}
                        className="w-full h-9 px-3 pr-9 rounded-md border border-input bg-muted font-mono text-sm text-foreground focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handlePwCopy} title="Copy password">
                      {pwCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handlePwRegenerate} title="Generate new password">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setPwModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white" onClick={handlePwConfirm} disabled={pwLoading}>
                    {pwLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                    {pwLoading ? "Saving..." : "Confirm Reset"}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-center space-y-3">
                  <Check className="w-8 h-8 text-green-500 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Password reset successfully</p>
                  <p className="text-xs text-muted-foreground">The new password for <span className="font-semibold text-foreground">{student.user.name}</span> is:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-base font-mono font-bold tracking-widest text-foreground bg-muted px-4 py-2 rounded-lg">
                      {showPw ? tempPw : "••••••••"}
                    </code>
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button type="button" onClick={handlePwCopy} className="text-muted-foreground hover:text-foreground">
                      {pwCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">This is the only time you can view this password.</p>
                </div>
                <Button type="button" className="w-full" onClick={() => setPwModalOpen(false)}>
                  Done
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )}
  </>
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
  subjectId,
  selectedDate,
  currentStatus,
  currentTime,
}: {
  studentDbId: string;
  studentName: string;
  subjectId: string;
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
        subjectId,
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
  subjectId,
  selectedDate,
  hasAttendance,
}: {
  studentDbId: string;
  studentName: string;
  subjectId: string;
  selectedDate: Date;
  hasAttendance: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Clear attendance record for "${studentName}" on ${formatDate(selectedDate)}?`)) return;
    setLoading(true);
    try {
      const result = await deleteAttendance(studentDbId, subjectId, selectedDate);
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
  studentId,
  section,
  yearLevel,
}: {
  studentName: string;
  qrToken: string;
  studentId?: string;
  section?: string | null;
  yearLevel?: string | null;
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
          <div className="mt-5 mb-2">
            <QrDownloadButton
              qrToken={qrToken}
              studentName={studentName}
              studentId={studentId ?? ""}
              section={section}
              yearLevel={yearLevel}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const SCHEDULE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Day picker with an independent time field per selected day. Controlled via
 * `days` + `times`; encode/decode to the stored columns lives in lib/schedule.
 */
function ScheduleEditor({
  days,
  times,
  onChange,
}: {
  days: string[];
  times: Record<string, string>;
  onChange: (days: string[], times: Record<string, string>) => void;
}) {
  const toggleDay = (day: string) => {
    if (days.includes(day)) {
      const nextTimes = { ...times };
      delete nextTimes[day];
      onChange(days.filter((d) => d !== day), nextTimes);
    } else {
      // Convenience: seed a newly checked day with a time already entered elsewhere.
      const seed = days.map((d) => times[d]).find((t) => t && t.trim()) || "";
      onChange([...days, day], seed ? { ...times, [day]: seed } : times);
    }
  };
  const setTime = (day: string, val: string) => onChange(days, { ...times, [day]: val });
  const ordered = SCHEDULE_DAYS.filter((d) => days.includes(d));

  return (
    <div className="space-y-2">
      <Label>Schedule Days &amp; Times</Label>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-md border border-input bg-background px-3 py-2">
        {SCHEDULE_DAYS.map((day) => (
          <label key={day} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)} className="accent-primary" />
            {day}
          </label>
        ))}
      </div>
      {ordered.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {ordered.map((day) => (
            <div key={day} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-sm font-medium text-muted-foreground">{day}</span>
              <Input
                value={times[day] ?? ""}
                onChange={(e) => setTime(day, e.target.value)}
                placeholder="08:00-09:30"
                className="h-9"
              />
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">
            Each day keeps its own time. Leave a day blank if it has no fixed start time.
          </p>
        </div>
      )}
    </div>
  );
}

export function AddSubjectForm({ teachers }: { teachers: { id: string; user: { name: string | null } }[] }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [units, setUnits] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<Record<string, string>>({});
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) { toast.error("Subject code and name are required."); return; }
    setLoading(true);
    try {
      const { scheduleDay, scheduleTime } = encodeSchedule(days, times);
      const result = await addSubject({
        code: code.trim(),
        name: name.trim(),
        units: units ? parseInt(units) : undefined,
        scheduleDay: scheduleDay ?? undefined,
        scheduleTime: scheduleTime ?? undefined,
        teacherId: teacherId || undefined,
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false); setCode(""); setName(""); setUnits(""); setDays([]); setTimes({}); setTeacherId("");
      } else {
        toast.error(result.message);
      }
    } catch { toast.error("Failed to create subject."); }
    finally { setLoading(false); }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="gap-2">
        <BookOpen className="w-4 h-4" />
        Add Subject
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Add Subject</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8"><X className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subject Code *</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="OS101" />
              </div>
              <div className="space-y-1">
                <Label>Units</Label>
                <Input type="number" value={units} onChange={(e) => setUnits(e.target.value)} placeholder="3" min={1} max={6} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Subject Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Operating Systems" />
            </div>
            <ScheduleEditor days={days} times={times} onChange={(d, t) => { setDays(d); setTimes(t); }} />
            <div className="space-y-1">
              <Label>Assigned Teacher</Label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">-- Unassigned --</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Subject
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function EditSubjectModal({
  subject,
  teachers,
}: {
  subject: { id: string; code: string; name: string; units?: number | null; scheduleDay?: string | null; scheduleTime?: string | null; teacherId?: string | null };
  teachers: { id: string; user: { name: string | null } }[];
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState(subject.code);
  const [name, setName] = useState(subject.name);
  const [units, setUnits] = useState(subject.units ? String(subject.units) : "");
  const initialSchedule = decodeSchedule(subject.scheduleDay, subject.scheduleTime);
  const [days, setDays] = useState<string[]>(initialSchedule.days);
  const [times, setTimes] = useState<Record<string, string>>(initialSchedule.times);
  const [teacherId, setTeacherId] = useState(subject.teacherId || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { scheduleDay, scheduleTime } = encodeSchedule(days, times);
      const result = await updateSubject(subject.id, {
        code: code.trim() || undefined,
        name: name.trim() || undefined,
        units: units ? parseInt(units) : null,
        scheduleDay,
        scheduleTime,
        teacherId: teacherId || null,
      });
      if (result.success) { toast.success(result.message); setOpen(false); }
      else toast.error(result.message);
    } catch { toast.error("Failed to update subject."); }
    finally { setLoading(false); }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); setOpen(true); }} className="h-7 w-7 text-muted-foreground hover:text-primary" title="Edit Subject">
        <Edit2 className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Subject</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8"><X className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Subject Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Units</Label>
                <Input type="number" value={units} onChange={(e) => setUnits(e.target.value)} min={1} max={6} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Subject Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <ScheduleEditor days={days} times={times} onChange={(d, t) => { setDays(d); setTimes(t); }} />
            <div className="space-y-1">
              <Label>Teacher</Label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">-- Unassigned --</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
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

export function ManageStudentSubjectsModal({
  studentDbId,
  studentName,
  allSubjects,
  enrolledSubjectIds,
}: {
  studentDbId: string;
  studentName: string;
  allSubjects: { id: string; code: string; name: string }[];
  enrolledSubjectIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(enrolledSubjectIds);
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateStudentEnrollments(studentDbId, selected);
      if (result.success) { toast.success(result.message); setOpen(false); }
      else toast.error(result.message);
    } catch { toast.error("Failed to update enrollments."); }
    finally { setLoading(false); }
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => { e.preventDefault(); setSelected(enrolledSubjectIds); setOpen(true); }}
        className="h-7 w-7 text-muted-foreground hover:text-primary"
        title="Manage Subject Enrollments"
      >
        <BookMarked className="w-3.5 h-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Manage Subjects</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{studentName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-input bg-background divide-y divide-border max-h-64 overflow-y-auto">
            {allSubjects.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center italic">No subjects available.</p>
            )}
            {allSubjects.map((sub) => (
              <label key={sub.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.includes(sub.id)}
                  onChange={() => toggle(sub.id)}
                  className="accent-primary"
                />
                <span className="font-mono text-xs text-primary font-bold w-16 shrink-0">{sub.code}</span>
                <span className="text-sm text-foreground">{sub.name}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RemoveSubjectButton({ subjectId, subjectCode }: { subjectId: string; subjectCode: string }) {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Delete subject "${subjectCode}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const result = await removeSubject(subjectId);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch { toast.error("Failed to delete subject."); }
    finally { setLoading(false); }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={(e) => { e.preventDefault(); handleRemove(); }}
      disabled={loading}
      title="Delete Subject"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </Button>
  );
}

