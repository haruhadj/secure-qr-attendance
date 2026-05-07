"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { submitAppeal } from "@/src/app/actions/appeals";
import { toast } from "sonner";
import { Upload, ImageIcon, Loader2, CheckCircle2 } from "lucide-react";

export default function AppealForm({ studentId }: { studentId: string }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selected);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setUploadedUrl(data.url);
      toast.success("File uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file.");
      setFile(null);
      setUploadedUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const imageUrl = uploadedUrl || "/uploads/no-proof.jpg";
      await submitAppeal(studentId, description, imageUrl);

      toast.success("Appeal submitted successfully! Your teacher will review it soon.");
      setDescription("");
      setFile(null);
      setUploadedUrl(null);
    } catch (error) {
      toast.error("Failed to submit appeal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Reason for Absence / Correction</Label>
        <Input
          id="description"
          placeholder="e.g. Medical emergency on Nov 15th"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="bg-muted/50"
        />
      </div>

      <div className="space-y-4">
        <Label>Proof Attachment</Label>
        <div className="border-2 border-dashed border-border rounded-xl p-8 transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer relative group">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            {uploading ? (
              <>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <p className="text-sm font-medium text-foreground">Uploading...</p>
              </>
            ) : uploadedUrl ? (
              <>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-sm font-medium text-foreground">{file?.name}</p>
                <p className="text-xs text-green-500">Uploaded successfully</p>
                <p className="text-xs text-muted-foreground">Click or drag to replace</p>
              </>
            ) : (
              <>
                <div className="p-3 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground">Upload medical certificate/proof</p>
                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or PDF (max 5MB)</p>
              </>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full h-12" disabled={loading || uploading || !description}>
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
