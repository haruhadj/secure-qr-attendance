"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeOwnUsername } from "@/src/app/actions/password";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { AtSign, Loader2 } from "lucide-react";

export default function ChangeUsernameForm({ currentUsername }: { currentUsername: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(currentUsername);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error("Username cannot be empty.");
      return;
    }
    if (trimmed.toLowerCase() === currentUsername.toLowerCase()) {
      toast.error("That's already your username.");
      return;
    }
    setLoading(true);
    try {
      const result = await changeOwnUsername(trimmed);
      if (result.success) {
        toast.success(result.message);
        if (result.username) setUsername(result.username);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to change username.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-border/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AtSign className="w-4 h-4 text-muted-foreground" />
          Change Username
        </CardTitle>
        <CardDescription>
          This is your login handle. You&apos;ll use it to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <AtSign className="w-4 h-4" />
              </span>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="pl-8"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Only letters and numbers are kept; everything else is removed.
            </p>
          </div>

          <Button type="submit" disabled={loading} className="gap-2 w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AtSign className="w-4 h-4" />}
            {loading ? "Saving..." : "Update Username"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
