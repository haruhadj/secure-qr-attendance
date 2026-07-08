"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { changeOwnPassword } from "@/src/app/actions/password";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldAlert } from "lucide-react";

export default function ForcedPasswordChangeForm() {
  const { update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });

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
        toast.success("Password updated. Redirecting…");
        // Refresh the session token so middleware sees the cleared flag, then
        // send them to the login root, which routes to their dashboard.
        await update();
        router.replace("/");
        router.refresh();
      } else {
        toast.error(result.message);
        setLoading(false);
      }
    } catch {
      toast.error("Failed to change password.");
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-border/5 w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          Set a new password
        </CardTitle>
        <CardDescription>
          For your security, you must replace the default/temporary password before continuing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pw">Current (default/temporary) password</Label>
            <Input
              id="current-pw"
              type="password"
              value={form.current}
              onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              value={form.next}
              onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirm new password</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="gap-2 w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {loading ? "Saving…" : "Update password & continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
