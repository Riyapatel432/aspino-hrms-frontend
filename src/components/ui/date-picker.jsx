"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
  date,
  setDate,
  placeholder = "Pick a date",
  className,
  align = "start",
  disabled = false,
}) {
  // convert string YYYY-MM-DD or Date object safely
  const selectedDate = React.useMemo(() => {
    if (!date) return null;
    const d = typeof date === "string" ? new Date(date) : date;
    return d && !isNaN(d.getTime()) ? d : null;
  }, [date]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 text-xs rounded-xl bg-background border border-border/60 hover:border-slate-400 dark:hover:border-slate-600 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {selectedDate ? format(selectedDate, "dd MMM yyyy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50"
      >
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(d) => {
            if (d) {
              const tzOffset = d.getTimezoneOffset() * 60000;
              const localISOTime = new Date(d.getTime() - tzOffset)
                .toISOString()
                .slice(0, 10);
              setDate(localISOTime);
            } else {
              setDate("");
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
