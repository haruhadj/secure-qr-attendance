"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeOwnEmail } from "@/src/app/actions/password";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

export default function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(currentEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Please enter an email address.");
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      toast.error("That's already your email.");
      return;
    }
    setLoading(true);
    try {
      const result = await changeOwnEmail(trimmed);
      if (result.success) {
        toast.success(result.message);
        if (result.email) setEmail(result.email);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to save email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-border/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="w-4 h-4 text-muted-foreground" />
          {currentEmail ? "Change Email" : "Add Email"}
        </CardTitle>
        <CardDescription>
          Set an email so you can reset your own password if you forget it — no need to wait for an admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail className="w-4 h-4" />
              </span>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="pl-8"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="gap-2 w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {loading ? "Saving..." : "Save Email"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
