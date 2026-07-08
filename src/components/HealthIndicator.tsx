"use client";

import { useEffect, useState } from "react";

// Small live status pill on the admin dashboard. Polls the public health probe
// so the operator can see at a glance that the app + database are reachable.
export default function HealthIndicator() {
  const [state, setState] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (active) setState(res.ok ? "ok" : "down");
      } catch {
        if (active) setState("down");
      }
    };
    check();
    const id = setInterval(check, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const config = {
    checking: { dot: "bg-muted-foreground/50", label: "Checking…", text: "text-muted-foreground" },
    ok: { dot: "bg-green-500", label: "System healthy", text: "text-green-600 dark:text-green-500" },
    down: { dot: "bg-red-500", label: "System issue", text: "text-red-600 dark:text-red-500" },
  }[state];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} ${state === "checking" ? "animate-pulse" : ""}`} />
      {config.label}
    </span>
  );
}
