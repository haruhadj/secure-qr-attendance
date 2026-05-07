"use client";

import { format, addDays, subDays, eachDayOfInterval, startOfWeek, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function WeeklyStrip() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const dateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const selectedDate = new Date(dateStr);

  // Get the week containing the selected date
  const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
  const days = eachDayOfInterval({
    start,
    end: addDays(start, 6),
  });

  const setDate = (newDate: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(newDate, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        
        return (
          <button
            key={day.toISOString()}
            onClick={() => setDate(day)}
            className={`
              flex flex-col items-center justify-center min-w-[60px] p-3 rounded-2xl transition-all
              ${isSelected 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105" 
                : "bg-card text-muted-foreground hover:bg-muted border border-border"
              }
            `}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
              {format(day, "EEE")}
            </span>
            <span className="text-lg font-bold">
              {format(day, "d")}
            </span>
            {isToday && !isSelected && (
              <div className="w-1 h-1 bg-primary rounded-full mt-1" />
            )}
          </button>
        );
      })}
    </div>
  );
}
