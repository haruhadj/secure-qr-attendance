"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { submitAppeal } from "@/src/app/actions/appeals";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AppealForm({ studentId }: { studentId: string }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitAppeal(studentId, description);
      toast.success("Appeal submitted successfully! Your teacher will review it soon.");
      setDescription("");
    } catch {
      toast.error("Failed to submit appeal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Reason for Absence / Correction</Label>
        <Textarea
          id="description"
          placeholder="e.g. I was absent on Nov 15th due to a medical emergency. Please correct my attendance."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          className="bg-muted/50 resize-none"
        />
      </div>
      <Button type="submit" className="w-full h-12" disabled={loading || !description.trim()}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : "Submit Appeal"}
      </Button>
    </form>
  );
}
