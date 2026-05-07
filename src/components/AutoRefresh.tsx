"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AutoRefresh({ interval = 5000 }: { interval?: number }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        setIsRefreshing(true);
        router.refresh();
        // Keep the refreshing state for a moment to show the animation
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    };

    const timer = setInterval(handleRefresh, interval);

    // Also refresh when the window regains focus
    window.addEventListener("focus", handleRefresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleRefresh);
    };
  }, [router, interval]);

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card/90 backdrop-blur-md px-4 py-2 rounded-full border border-border shadow-lg text-[10px] font-bold text-muted-foreground uppercase tracking-widest z-50 pointer-events-none select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative flex items-center justify-center">
        <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-primary animate-ping opacity-75' : 'bg-green-500'}`} />
        <div className={`absolute w-2 h-2 rounded-full ${isRefreshing ? 'bg-primary' : 'bg-green-500'}`} />
      </div>
      <span>Live Syncing</span>
      <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-1000 ${isRefreshing ? 'rotate-180 text-primary' : 'text-muted-foreground/50'}`} />
    </div>
  );
}
