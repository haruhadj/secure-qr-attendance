"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { FlaskConical, Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const DEMO_ACCOUNTS = [
  { role: "Admin",   email: "admin@school.com",   password: "password123", color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { role: "Teacher", email: "teacher@school.com", password: "password123", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { role: "Student", email: "john@student.com",   password: "password123", color: "text-green-500 bg-green-500/10 border-green-500/20" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1 p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function DemoAccountsCard() {
  const [showPasswords, setShowPasswords] = useState(false);

  return (
    <Card className="border-dashed border-2 border-amber-500/30 bg-amber-500/5 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <FlaskConical className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-sm text-amber-600">Demo / Test Accounts</CardTitle>
              <CardDescription className="text-xs">For testing purposes only — visible to admins</CardDescription>
            </div>
          </div>
          <button
            onClick={() => setShowPasswords((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPasswords ? "Hide" : "Show"} passwords
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_ACCOUNTS.map((account) => (
            <div
              key={account.role}
              className="p-3 rounded-xl bg-card border border-border space-y-2"
            >
              <Badge className={`text-[10px] font-bold uppercase tracking-wider ${account.color}`}>
                {account.role}
              </Badge>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Email</span>
                  <CopyButton text={account.email} />
                </div>
                <p className="text-xs font-mono text-foreground break-all">{account.email}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Password</span>
                  <CopyButton text={account.password} />
                </div>
                <p className="text-xs font-mono text-foreground">
                  {showPasswords ? account.password : "••••••••••••"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
