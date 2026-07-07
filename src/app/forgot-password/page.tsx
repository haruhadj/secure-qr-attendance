"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/src/app/actions/password";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ShieldCheck, ArrowLeft, Mail, MailCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestPasswordReset(normalized);
      if (result.success) {
        setSent(true);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong. Please try again later.");
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
          {sent ? (
            <>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <MailCheck className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center">Check your email</CardTitle>
                <CardDescription className="text-center">
                  If an account exists for <strong className="text-foreground">{email.trim().toLowerCase()}</strong>,
                  we&apos;ve sent a link to reset your password. The link expires in 30 minutes.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-center">Forgot your password?</CardTitle>
                <CardDescription className="text-center">
                  Enter the email on your account and we&apos;ll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@school.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    className="bg-muted/50"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </CardContent>
              <CardFooter>
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
