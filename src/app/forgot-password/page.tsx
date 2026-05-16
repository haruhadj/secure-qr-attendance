"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/src/app/actions/password";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ShieldCheck, ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setSent(true);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
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
                  <div className="p-3 bg-green-500/10 rounded-2xl">
                    <MailCheck className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <CardTitle className="text-center">Check your email</CardTitle>
                <CardDescription className="text-center">
                  If <span className="font-medium text-foreground">{email}</span> is registered,
                  you'll receive a reset link shortly. It expires in 30 minutes.
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
            <>
              <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>
                  Enter your school email and we'll send you a link to reset your password.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@school.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-muted/50"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Link href="/" className="w-full">
                    <Button variant="ghost" className="w-full gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
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
