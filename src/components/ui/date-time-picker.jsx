"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateTimePicker({ date, setDate, type = "datetime", placeholder = "Select date", minDate, disablePast = false, disabled }) {
  const [open, setOpen] = React.useState(false);

  // Helper to extract HH:mm time string safely
  const extractTimeStr = (d) => {
    if (!d) return "";
    if (typeof d === "string") {
      const trimmed = d.trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
        const parts = trimmed.split(":");
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const hh = String(parsed.getHours()).padStart(2, '0');
        const mm = String(parsed.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
    } else if (d instanceof Date && !isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return "";
  };

  const parsedDate = React.useMemo(() => {
    if (!date) return null;
    if (typeof date === 'string' && /^\d{1,2}:\d{2}/.test(date.trim())) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    return d && !isNaN(d.getTime()) ? d : null;
  }, [date]);

  const [timeStr, setTimeStr] = React.useState(() => extractTimeStr(date));

  React.useEffect(() => {
    setTimeStr(extractTimeStr(date));
  }, [date]);

  // Update parent when either changes
  const updateParent = (newD, newT) => {
    if (type === "time") {
      setDate(newT); // just return the time string HH:mm
      return;
    }
    
    if (!newD) {
      setDate("");
      return;
    }
    
    const finalDate = new Date(newD);
    if (type === "datetime" && newT) {
      const [h, m] = newT.split(":");
      finalDate.setHours(parseInt(h, 10) || 0);
      finalDate.setMinutes(parseInt(m, 10) || 0);
    } else {
      finalDate.setHours(0, 0, 0, 0);
    }
    
    if (type === "date") {
      // Return YYYY-MM-DD
      const tzOffset = finalDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(finalDate.getTime() - tzOffset)).toISOString().slice(0, 10);
      setDate(localISOTime);
    } else {
      // Return YYYY-MM-DDTHH:mm
      const tzOffset = finalDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(finalDate.getTime() - tzOffset)).toISOString().slice(0, 16);
      setDate(localISOTime);
    }
  };

  const calendarDisabled = disabled
    ? disabled
    : minDate
    ? { before: new Date(minDate) }
    : disablePast
    ? { before: new Date(new Date().setHours(0, 0, 0, 0)) }
    : undefined;

  return (
    <div className={cn("flex flex-row items-center gap-2", type === "datetime" ? "w-full" : "w-auto")}>
      {(type === "date" || type === "datetime") && (
        <div className={type === "datetime" ? "flex-1" : "w-full"}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between font-normal h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
                  !parsedDate && "text-muted-foreground"
                )}
              >
                {parsedDate ? format(parsedDate, "dd/MM/yyyy") : placeholder}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={parsedDate}
                captionLayout="dropdown"
                defaultMonth={parsedDate || (disablePast ? new Date() : undefined)}
                disabled={calendarDisabled}
                onSelect={(d) => {
                  updateParent(d, timeStr);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
      {(type === "time" || type === "datetime") && (
        <div className={type === "datetime" ? "w-[120px]" : "w-full"}>
          <Input
            type="time"
            value={timeStr}
            onChange={(e) => {
              setTimeStr(e.target.value);
              updateParent(parsedDate, e.target.value);
            }}
            className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none text-center w-full"
          />
        </div>
      )}
    </div>
  )
}
