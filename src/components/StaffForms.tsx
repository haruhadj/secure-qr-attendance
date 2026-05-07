"use client";

import { useState } from "react";
import { addStaff, removeStaff } from "@/src/app/actions/admin";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { UserPlus, Trash2, Loader2, X } from "lucide-react";
import { UserRole } from "@prisma/client";

export function AddStaffForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: UserRole }>({
    name: "",
    email: "",
    role: UserRole.TEACHER,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await addStaff(form.name, form.email, form.role);
      if (result.success) {
        toast.success(result.message);
        setForm({ name: "", email: "", role: UserRole.TEACHER });
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
              <option value={UserRole.TEACHER}>Teacher</option>
              <option value={UserRole.ADMIN}>Administrator</option>
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
