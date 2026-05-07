"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, ListFilter } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DatePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const dateStr = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const selectedDate = parseISO(dateStr);
  
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setDate = (newDate: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(newDate, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  const handlePrev = () => setDate(subDays(selectedDate, 1));
  const handleNext = () => setDate(addDays(selectedDate, 1));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="relative" ref={popoverRef}>
      <div className="flex items-center gap-2 bg-background p-1 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer min-w-[160px] justify-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {format(selectedDate, "MMMM d, yyyy")}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 z-50 bg-background rounded-2xl border border-border shadow-2xl p-4 w-[320px]"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">
                {format(viewMonth, "MMMM yyyy")}
              </h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d} className="text-[10px] font-bold text-muted-foreground uppercase">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, viewMonth);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setDate(day)}
                    className={`
                      h-9 w-9 rounded-xl text-sm font-medium transition-all
                      flex items-center justify-center
                      ${isSelected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 
                        isCurrentMonth ? 'text-foreground hover:bg-accent' : 'text-muted-foreground/30'}
                    `}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-between gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs rounded-lg"
                onClick={() => setDate(new Date())}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs rounded-lg"
                onClick={() => setDate(subDays(new Date(), 1))}
              >
                Yesterday
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
