import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-8xl font-black text-foreground/10 leading-none select-none">404</p>
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-muted-foreground text-sm">
            The page you're looking for doesn't exist or you don't have permission to access it.
          </p>
        </div>

        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Button>
        </Link>
      </div>
    </main>
  );
}
