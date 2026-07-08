"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

// Catches unexpected errors thrown anywhere in the authenticated app so the user
// sees a friendly recovery screen instead of a blank page.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. You can try again, or return to the sign-in page. If this keeps
          happening, take a screenshot and check the Troubleshooting guide.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go to sign-in
          </Button>
        </div>
      </div>
    </main>
  );
}
