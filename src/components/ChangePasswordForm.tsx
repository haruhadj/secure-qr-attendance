"use client";

import { useState } from "react";
import { changeOwnPassword } from "@/src/app/actions/password";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (form.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await changeOwnPassword(form.current, form.next);
      if (result.success) {
        toast.success(result.message);
        setForm({ current: "", next: "", confirm: "" });
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-border/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="w-4 h-4 text-muted-foreground" />
          Change Password
        </CardTitle>
        <CardDescription>Update your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="current-pw">Current Password</Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrent ? "text" : "password"}
                value={form.current}
                onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                required
                className="pr-9"
              />
             
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-pw">New Password</Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNew ? "text" : "password"}
                value={form.next}
                onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
                required
                minLength={8}
                className="pr-9"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-pw"
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                required
                className="pr-9"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="gap-2 w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {loading ? "Saving..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
