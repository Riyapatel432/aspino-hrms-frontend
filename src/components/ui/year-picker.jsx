"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

/**
 * YearPicker / Financial Year Picker component
 * Allows selecting starting year from an interactive calendar-style grid
 * and automatically formats FY Name, Period, and Assessment Year.
 */
export function YearPicker({
  value,
  onChange,
  placeholder = "Pick Financial Year",
  className,
  align = "start",
  disabled = false,
  error = false,
}) {
  const [open, setOpen] = React.useState(false);
  const currentYear = new Date().getFullYear();

  // Extract selected year number (e.g. from "2025" or "FY 2025-26")
  const selectedYear = React.useMemo(() => {
    if (!value) return null;
    const match = String(value).match(/20\d{2}/);
    return match ? Number(match[0]) : null;
  }, [value]);

  // Page start year for 12-year grid (e.g., 2020 for 2020..2031)
  const initialBaseYear = selectedYear ? Math.floor(selectedYear / 12) * 12 : Math.floor(currentYear / 12) * 12;
  const [baseYear, setBaseYear] = React.useState(initialBaseYear);

  React.useEffect(() => {
    if (selectedYear) {
      setBaseYear(Math.floor(selectedYear / 12) * 12);
    }
  }, [selectedYear]);

  const years = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => baseYear + i);
  }, [baseYear]);

  const handleSelectYear = (year) => {
    const startYear = year;
    const endShort = String(year + 1).slice(-2);
    const fyName = `FY ${startYear}-${endShort}`;
    const info = {
      startYear,
      endYear: year + 1,
      fyName,
      period: `1 Apr ${startYear} – 31 Mar ${year + 1}`,
      ay: `AY ${year + 1}-${String(year + 2).slice(-2)}`,
    };
    onChange?.(fyName, info);
    setOpen(false);
  };

  const selectedDisplayLabel = React.useMemo(() => {
    if (!selectedYear) return null;
    const endShort = String(selectedYear + 1).slice(-2);
    return `FY ${selectedYear}-${endShort} (Apr ${selectedYear} – Mar ${selectedYear + 1})`;
  }, [selectedYear]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal h-11 text-xs rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 focus:ring-2 focus:ring-sky-500 shadow-sm transition-all cursor-pointer",
            !selectedYear && "text-muted-foreground",
            error && "border-red-500 border-2 focus:ring-red-500",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 text-sky-500 shrink-0" />
            <span className={cn("truncate font-semibold", selectedYear ? "text-slate-900 dark:text-slate-100" : "text-slate-400")}>
              {selectedDisplayLabel || placeholder}
            </span>
          </div>
          {selectedYear && (
            <Badge className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[10px] font-mono shrink-0 ml-2 border border-sky-500/20">
              FY {selectedYear}-{String(selectedYear + 1).slice(-2)}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-[320px] p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl z-50 space-y-3"
      >
        {/* Navigation Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            onClick={() => setBaseYear((prev) => prev - 12)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {baseYear} – {baseYear + 11}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Select Financial Year</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            onClick={() => setBaseYear((prev) => prev + 12)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 12-Year Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {years.map((year) => {
            const isSelected = selectedYear === year;
            const isCurrent = currentYear === year;
            const endShort = String(year + 1).slice(-2);

            return (
              <button
                key={year}
                type="button"
                onClick={() => handleSelectYear(year)}
                className={cn(
                  "p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border text-center relative group",
                  isSelected
                    ? "bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-600/30 scale-[1.02] font-black"
                    : isCurrent
                    ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-100 dark:hover:bg-sky-900/60"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <span className="text-sm tracking-tight">{year}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono tracking-tight",
                    isSelected ? "text-sky-100" : isCurrent ? "text-sky-600 dark:text-sky-400 font-bold" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )}
                >
                  FY {endShort === "00" ? "99-00" : `${String(year).slice(-2)}-${endShort}`}
                </span>

                {isCurrent && !isSelected && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Selection Shortcuts */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => handleSelectYear(currentYear - 1)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors text-[10.5px]"
          >
            Prev FY ({currentYear - 1})
          </button>
          <button
            type="button"
            onClick={() => handleSelectYear(currentYear)}
            className="px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/80 font-bold transition-colors text-[10.5px]"
          >
            Current FY ({currentYear})
          </button>
          <button
            type="button"
            onClick={() => handleSelectYear(currentYear + 1)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium transition-colors text-[10.5px]"
          >
            Next FY ({currentYear + 1})
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
