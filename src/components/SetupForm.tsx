"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFirstAdmin } from "@/src/app/actions/setup";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export default function SetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await createFirstAdmin(form.name, form.email, form.password);
    if (res.success) {
      toast.success("Administrator created. Please sign in.");
      router.replace("/");
      router.refresh();
    } else {
      toast.error(res.message);
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-xl shadow-border/5 w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Create the first administrator
        </CardTitle>
        <CardDescription>
          Welcome! This one-time setup creates the administrator account for your school. It is only available
          until the first admin exists.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password (min 8 characters)</Label>
            <Input id="password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? "Creating…" : "Create administrator"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
