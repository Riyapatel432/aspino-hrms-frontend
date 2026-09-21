"use client";

import * as React from "react";
import { Clock, Timer, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

/**
 * DurationPicker (shadcn/ui duration time picker - NO AM/PM)
 *
 * Props:
 * - totalMinutes: number (e.g. 30, 90)
 * - onChange: (minutes: number, timeStr: string) => void
 * - timeStr: optional "HH:mm"
 * - maxHours: maximum hours available in picker (default: 8)
 * - presets: optional array of { label, minutes }
 * - className: string
 */
export function DurationPicker({
  totalMinutes = 0,
  onChange,
  maxHours = 8,
  placeholder = "Select duration...",
  presets = [
    { label: "15m", minutes: 15 },
    { label: "30m", minutes: 30 },
    { label: "45m", minutes: 45 },
    { label: "1 hr", minutes: 60 },
    { label: "1.5 hrs", minutes: 90 },
    { label: "2 hrs", minutes: 120 },
  ],
  className,
}) {
  const [open, setOpen] = React.useState(false);

  const safeMinutes = Number(totalMinutes) || 0;
  const hours = Math.floor(Math.max(0, safeMinutes) / 60);
  const minutes = Math.max(0, safeMinutes) % 60;

  const handleHoursChange = (hVal) => {
    const h = parseInt(hVal, 10) || 0;
    const newTotal = h * 60 + minutes;
    const timeStr = `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    onChange?.(newTotal, timeStr);
  };

  const handleMinutesChange = (mVal) => {
    const m = parseInt(mVal, 10) || 0;
    const newTotal = hours * 60 + m;
    const timeStr = `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange?.(newTotal, timeStr);
  };

  const handlePresetSelect = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange?.(mins, timeStr);
  };

  // Formatted display text
  const formatDisplay = () => {
    if (!safeMinutes || safeMinutes <= 0) return placeholder;
    const parts = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hr" : "hrs"}`);
    if (minutes > 0) parts.push(`${minutes} min`);
    return parts.join(" ");
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between font-normal h-11 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all px-3",
              safeMinutes <= 0 && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Timer className="h-4 w-4 text-slate-400 opacity-70 shrink-0" />
              <span className={cn(
                "truncate text-xs",
                safeMinutes > 0 ? "font-semibold text-slate-800 dark:text-slate-100" : "text-muted-foreground font-normal"
              )}>
                {formatDisplay()}
              </span>
            </div>
            {safeMinutes > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 shrink-0 ml-2">
                {safeMinutes} mins
              </span>
            ) : (
              <Clock className="h-4 w-4 opacity-40 text-slate-400 shrink-0 ml-2" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-3.5"
          align="start"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-4 h-4 text-rose-500" />
              Select Excess Duration
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              Hours & Minutes
            </span>
          </div>

          {/* Dual Pickers (Hours & Minutes) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                Hours
              </label>
              <Select
                value={String(hours)}
                onValueChange={handleHoursChange}
              >
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <SelectValue placeholder="0 Hours" />
                </SelectTrigger>
                <SelectContent className="max-h-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {Array.from({ length: maxHours + 1 }).map((_, i) => (
                    <SelectItem key={i} value={String(i)} className="text-xs">
                      {i} {i === 1 ? "Hour" : "Hours"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                Minutes
              </label>
              <Select
                value={String(minutes)}
                onValueChange={handleMinutesChange}
              >
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <SelectValue placeholder="0 Mins" />
                </SelectTrigger>
                <SelectContent className="max-h-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <SelectItem key={m} value={String(m)} className="text-xs">
                      {m} Mins
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Presets */}
          {presets && presets.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Quick Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {presets.map((p) => {
                  const isSelected = totalMinutes === p.minutes;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handlePresetSelect(p.minutes)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center border flex items-center justify-center gap-1",
                        isSelected
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 text-[11px]">
              Total: <strong className="text-rose-600 dark:text-rose-400">{totalMinutes} mins</strong> ({(totalMinutes / 60).toFixed(2)} hrs)
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 px-3 text-[11px] font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
