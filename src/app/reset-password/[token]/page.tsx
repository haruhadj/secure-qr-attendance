"use client";

import { useState } from "react";
import { consumePasswordReset } from "@/src/app/actions/password";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ShieldCheck, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await consumePasswordReset(token, newPassword);
      if (result.success) {
        setDone(true);
      } else {
        setErrorMsg(result.message);
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Secure QR Attendance
          </h1>
        </div>

        <Card className="border-none shadow-xl shadow-border/5">
          {done ? (
            <>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-green-500/10 rounded-2xl">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <CardTitle className="text-center">Password Reset!</CardTitle>
                <CardDescription className="text-center">
                  Your password has been updated. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/" className="w-full">
                  <Button className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Set New Password</CardTitle>
                <CardDescription>
                  Choose a strong password with at least 8 characters.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-pw">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-pw"
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="bg-muted/50 pr-9"
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
                    <Label htmlFor="confirm-pw">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-pw"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        className="bg-muted/50 pr-9"
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
                  {errorMsg && (
                    <p className="text-sm text-destructive">{errorMsg}</p>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                  <Link href="/forgot-password" className="w-full">
                    <Button variant="ghost" className="w-full gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Request a new link
                    </Button>
                  </Link>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
