/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      if (role === "ADMIN") window.location.href = "/admin/dashboard";
      else if (role === "TEACHER") window.location.href = "/teacher/roster";
      else window.location.href = "/student/dashboard";
    }
  }, [session, status]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasError(false);
    setEmailError(false);
    setPasswordError(false);

    let valid = true;
    if (!email) {
      setEmailError(true);
      valid = false;
    }
    if (!password) {
      setPasswordError(true);
      valid = false;
    }

    if (!valid) {
      setHasError(true);
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setHasError(true);
        if (result.error.includes("Too many")) {
          toast.error("Too many failed attempts. Please wait 15 minutes before trying again.");
        } else {
          toast.error("Invalid credentials. Please check your email and password.");
        }
      } else {
        toast.success("Logged in successfully! Redirecting...");
        // Redirection is handled by the useEffect above
      }
    } catch (error) {
      setHasError(true);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-start md:justify-center p-4 py-12 md:py-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
            Secure QR Attendance
          </h1>
          <p className="text-muted-foreground">
            Monitoring system with hybrid fallback
          </p>
        </div>

        <motion.div
          animate={hasError ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Card className={`border-none shadow-xl shadow-border/5 transition-colors ${hasError ? 'ring-2 ring-destructive/20' : ''}`}>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your school email to access your dashboard</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className={emailError ? "text-destructive" : ""}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@school.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(false);
                      if (hasError) setHasError(false);
                    }}
                    className={`bg-muted/50 transition-colors ${emailError ? "border-destructive ring-destructive/20" : ""}`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className={passwordError ? "text-destructive" : ""}>Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(false);
                        if (hasError) setHasError(false);
                      }}
                      className={`bg-muted/50 transition-colors pr-9 ${passwordError ? "border-destructive ring-destructive/20" : ""}`}
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Continue"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>

      </div>
    </main>
  );
}
