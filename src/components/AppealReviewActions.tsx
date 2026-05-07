"use client";

import { useState } from "react";
import { reviewAppeal } from "@/src/app/actions/appeals";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, ImageIcon, ExternalLink } from "lucide-react";

interface AppealReviewActionsProps {
  appealId: string;
  imageUrl: string;
}

export default function AppealReviewActions({ appealId, imageUrl }: AppealReviewActionsProps) {
  const [loading, setLoading] = useState<"APPROVED" | "REJECTED" | null>(null);

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
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
    <div className="flex items-center gap-2">
      {imageUrl && imageUrl !== "/uploads/placeholder.jpg" && (
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <ImageIcon className="w-3 h-3" />
          Proof
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-green-600 hover:bg-green-50 hover:text-green-700 gap-1.5"
        onClick={() => handleReview("APPROVED")}
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
        onClick={() => handleReview("REJECTED")}
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
  );
}
