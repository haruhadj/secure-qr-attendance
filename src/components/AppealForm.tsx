"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { submitAppeal } from "@/src/app/actions/appeals";
import { toast } from "sonner";
import { Loader2, Paperclip } from "lucide-react";

interface SubjectOption {
  id: string;
  code: string;
  name: string;
}

export default function AppealForm({ subjects }: { subjects: SubjectOption[] }) {
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl: string | null = null;

      // Upload proof (optional) first, then attach its URL to the appeal.
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to upload proof image.");
          setLoading(false);
          return;
        }
        imageUrl = data.url;
      }

      const result = await submitAppeal({
        description,
        subjectId: subjectId || null,
        date: date || null,
        imageUrl,
      });

      if (result.success) {
        toast.success("Appeal submitted successfully! Your teacher will review it soon.");
        setDescription("");
        setSubjectId("");
        setDate("");
        setFile(null);
      } else {
        toast.error(result.message || "Failed to submit appeal. Please try again.");
      }
    } catch {
      toast.error("Failed to submit appeal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject (optional)</Label>
          <select
            id="subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All / not sure</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date of absence (optional)</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-muted/50"
          />
        </div>
      </div>

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

      <div className="space-y-2">
        <Label htmlFor="proof" className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          Proof (optional) — image or PDF, max 5MB
        </Label>
        <Input
          id="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="bg-muted/50 file:text-foreground"
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
