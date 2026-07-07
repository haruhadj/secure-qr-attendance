"use client";

import { useState } from "react";
import { reviewAppeal } from "@/src/app/actions/appeals";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface AppealReviewActionsProps {
  appealId: string;
  studentName?: string;
}

export default function AppealReviewActions({ appealId, studentName }: AppealReviewActionsProps) {
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [confirming, setConfirming] = useState<"APPROVED" | "REJECTED" | null>(null);

  const who = studentName || "this student";

  const runReview = async (status: "APPROVED" | "REJECTED") => {
    setConfirming(null);
    setLoading(status);
    try {
      const result = await reviewAppeal(appealId, status);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to process review.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-green-600 hover:bg-green-50 hover:text-green-700 gap-1.5"
          onClick={() => setConfirming("APPROVED")}
          disabled={loading !== null}
        >
          {loading === "APPROVED" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          Approve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5"
          onClick={() => setConfirming("REJECTED")}
          disabled={loading !== null}
        >
          {loading === "REJECTED" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          Reject
        </Button>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirming(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card border shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  confirming === "APPROVED" ? "bg-green-500/10" : "bg-red-500/10"
                }`}
              >
                {confirming === "APPROVED" ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {confirming === "APPROVED" ? "Approve this appeal?" : "Reject this appeal?"}
              </h2>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {confirming === "APPROVED" ? (
                <>
                  This will mark <strong className="text-foreground">{who} PRESENT for today</strong> on
                  their first enrolled subject and close the appeal. This can&apos;t be undone from here —
                  use the masterlist to adjust attendance afterward if needed.
                </>
              ) : (
                <>
                  This records your decision and closes the appeal.{" "}
                  <strong className="text-foreground">{who}&apos;s attendance stays unchanged.</strong>{" "}
                  They&apos;ll see the appeal marked as rejected.
                </>
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className={
                  confirming === "APPROVED"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
                onClick={() => runReview(confirming)}
              >
                {confirming === "APPROVED" ? "Approve & mark present" : "Reject appeal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
