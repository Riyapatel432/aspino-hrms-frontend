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

export function DateTimePicker({ date, setDate, type = "datetime", placeholder = "Select date" }) {
  const [open, setOpen] = React.useState(false)

  // parse existing ISO date string if provided
  const parsedDate = typeof date === 'string' && date ? new Date(date) : date;
  
  // Extract time from the date object
  let initialTime = "";
  if (parsedDate) {
    const hh = String(parsedDate.getHours()).padStart(2, '0');
    const mm = String(parsedDate.getMinutes()).padStart(2, '0');
    initialTime = `${hh}:${mm}`;
  } else if (typeof date === 'string' && date.includes(':') && !date.includes('-')) {
    // If only time is passed (e.g. "10:30")
    initialTime = date;
  }
  
  const [timeStr, setTimeStr] = React.useState(initialTime);

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
                {parsedDate ? format(parsedDate, "PPP") : placeholder}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={parsedDate}
                captionLayout="dropdown"
                defaultMonth={parsedDate}
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
