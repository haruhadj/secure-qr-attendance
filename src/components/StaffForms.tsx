"use client";

import { useState } from "react";
import { addStaff, removeStaff, resetStaffPasswordToTemp } from "@/src/app/actions/admin";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Trash2, Loader2, X, KeyRound, Copy, Check, Eye, EyeOff, RefreshCw, ShieldAlert } from "lucide-react";
import type { UserRole } from "@prisma/client";

export function AddStaffForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: UserRole }>({
    name: "",
    email: "",
    role: "TEACHER" as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await addStaff(form.name, form.email, form.role);
      if (result.success) {
        toast.success(result.message);
        setForm({ name: "", email: "", role: "TEACHER" as UserRole });
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to add staff member.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="w-4 h-4" />
        Add Staff
      </Button>
    );
  }

  return (
    <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Add New Staff</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Maria Clara"
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
              placeholder="maria@school.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              required
            >
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Adding..." : "Add Staff"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function RemoveStaffButton({
  userId,
  userName,
  currentUserId,
}: {
  userId: string;
  userName: string;
  currentUserId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove "${userName}" from the system? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const result = await removeStaff(userId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to remove staff.");
    } finally {
      setLoading(false);
    }
  };

  if (userId === currentUserId) return null; // Can't remove self

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

export function ResetStaffPasswordButton({
  userId,
  userName,
  currentUserId,
}: {
  userId: string;
  userName: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPw, setTempPw] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleOpen = () => {
    setTempPw(generateTempPassword());
    setDone(false);
    setCopied(false);
    setShowPw(false);
    setOpen(true);
  };

  const handleRegenerate = () => {
    setTempPw(generateTempPassword());
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tempPw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await resetStaffPasswordToTemp(userId, tempPw);
      if (result.success) {
        setDone(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (userId === currentUserId) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-amber-400 hover:text-amber-500 hover:bg-amber-500/10"
        onClick={handleOpen}
        title="Reset password"
      >
        <KeyRound className="w-3.5 h-3.5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Reset Password</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{userName}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!done ? (
                <>
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      A new temporary password will be set. Share it with <span className="font-semibold text-foreground">{userName}</span> and advise them to change it after logging in.
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
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleCopy} title="Copy password">
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleRegenerate} title="Generate new password">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleConfirm} disabled={loading}>
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                      {loading ? "Saving..." : "Confirm Reset"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-center space-y-3">
                    <Check className="w-8 h-8 text-green-500 mx-auto" />
                    <p className="text-sm font-semibold text-foreground">Password reset successfully</p>
                    <p className="text-xs text-muted-foreground">The new password for <span className="font-semibold text-foreground">{userName}</span> is:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-base font-mono font-bold tracking-widest text-foreground bg-muted px-4 py-2 rounded-lg">
                        {showPw ? tempPw : "••••••••"}
                      </code>
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="text-muted-foreground hover:text-foreground">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">This is the only time you can view this password.</p>
                  </div>
                  <Button type="button" className="w-full" onClick={() => setOpen(false)}>
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
