import { Button } from "@/src/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ShieldCheck, ArrowLeft, UserCog } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
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
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <UserCog className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">Forgot your password?</CardTitle>
            <CardDescription className="text-center space-y-3">
              <span className="block">
                Password resets are handled by your school administrator.
              </span>
              <span className="block text-xs bg-muted rounded-lg px-4 py-3 text-left leading-relaxed">
                <strong className="text-foreground block mb-1">What to do:</strong>
                Contact your admin or teacher and ask them to reset your password.
                Your default password is your <strong className="text-foreground">Student ID</strong> (e.g. <code className="font-mono">2024-0001</code>).
                If you've changed it and forgotten it, only an admin can reset it for you.
              </span>
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
        </Card>
      </div>
    </main>
  );
}
