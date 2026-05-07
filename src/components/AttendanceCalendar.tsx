"use client";

import { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/src/lib/utils";

interface AttendanceRecord {
  id: string;
  date: Date;
  status: string;
  section: {
    name: string;
  };
}

export default function AttendanceCalendar({ attendances }: { attendances: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAttendanceForDay = (day: Date) => {
    return attendances.find(a => isSameDay(new Date(a.date), day));
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-xl overflow-hidden shadow-sm">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="bg-muted/50 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {day}
          </div>
        ))}
        {calendarDays.map(day => {
          const attendance = getAttendanceForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const today = isToday(day);

          return (
            <div 
              key={day.toISOString()} 
              className={cn(
                "min-h-[70px] md:min-h-[80px] bg-card p-1 md:p-2 flex flex-col items-center justify-between relative transition-colors",
                !isCurrentMonth && "bg-muted/20 text-muted-foreground/30"
              )}
            >
              <span className={cn(
                "text-xs font-medium self-start",
                today && "bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center -ml-0.5 -mt-0.5"
              )}>
                {format(day, "d")}
              </span>
              
              {attendance && (
                <div className={cn(
                  "w-full rounded-md p-0.5 md:p-1 flex flex-col items-center gap-0.5",
                  attendance.status === 'PRESENT' ? 'bg-green-500/10 text-green-600' :
                  attendance.status === 'LATE' ? 'bg-amber-500/10 text-amber-600' :
                  'bg-red-500/10 text-red-600'
                )}>
                   <div className={cn(
                     "w-1.5 h-1.5 rounded-full",
                     attendance.status === 'PRESENT' ? 'bg-green-500' :
                     attendance.status === 'LATE' ? 'bg-amber-500' :
                     'bg-red-500'
                   )} />
                   <span className="text-[7px] md:text-[8px] font-bold uppercase">{attendance.status}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-4 pt-2 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] text-muted-foreground font-medium">Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] text-muted-foreground font-medium">Late</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] text-muted-foreground font-medium">Absent</span>
        </div>
      </div>
    </div>
  );
}
