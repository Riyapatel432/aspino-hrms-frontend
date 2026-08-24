"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchableSelect({
  options = [],
  value,
  onChange,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  contentClassName,
  disabled = false,
  renderOption,
  id,
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const scrollRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const handleSelect = (val) => {
    if (onValueChange) onValueChange(val);
    if (onChange) onChange(val);
    setOpen(false);
    setSearch("");
  };

  // Normalize options to { value, label, subLabel, ... }
  const normalizedOptions = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string" || typeof opt === "number") {
        return { value: String(opt), label: String(opt) };
      }
      return {
        ...opt,
        value: String(opt.value ?? opt.id ?? ""),
        label: opt.label ?? opt.name ?? opt.title ?? String(opt.value ?? ""),
      };
    });
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const query = search.toLowerCase();
    return normalizedOptions.filter((opt) => {
      const labelMatch = (opt.label || "").toLowerCase().includes(query);
      const subLabelMatch = (opt.subLabel || "").toLowerCase().includes(query);
      const valueMatch = (opt.value || "").toLowerCase().includes(query);
      return labelMatch || subLabelMatch || valueMatch;
    });
  }, [normalizedOptions, search]);

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [search, open]);

  const selectedOption = React.useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Robust wheel scrolling that works seamlessly inside Radix Dialogs/Modals
  const handleWheel = (e) => {
    e.stopPropagation();
    if (scrollRef.current) {
      scrollRef.current.scrollTop += e.deltaY;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = Math.min(prev + 1, Math.max(0, filteredOptions.length - 1));
        const el = scrollRef.current?.children[next];
        if (el) el.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = Math.max(prev - 1, 0);
        const el = scrollRef.current?.children[next];
        if (el) el.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter") {
      if (filteredOptions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-xl h-11 px-3 text-xs font-normal bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
            !selectedOption && "text-slate-400 dark:text-slate-500",
            className
          )}
        >
          <span className="truncate text-left flex-1 font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onWheel={handleWheel}
        onTouchMove={(e) => e.stopPropagation()}
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-[260px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl z-50 pointer-events-auto",
          contentClassName
        )}
      >
        {/* Search Bar */}
        <div className="relative mb-2 flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="h-9 pl-8 pr-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 focus-visible:ring-1"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Options List with direct wheel handler & touch support */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onTouchMove={(e) => e.stopPropagation()}
          className="max-h-60 overflow-y-auto space-y-0.5 pr-1 overscroll-contain select-none"
        >
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option, idx) => {
              const isSelected = String(option.value) === String(value);
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={option.value || idx}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-xs rounded-xl cursor-pointer transition-colors select-none",
                    isSelected
                      ? "bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 font-semibold"
                      : isHighlighted
                      ? "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <div className="flex-1 truncate pr-2">
                    {renderOption ? (
                      renderOption(option, isSelected)
                    ) : (
                      <>
                        <div className="truncate font-medium">{option.label}</div>
                        {option.subLabel && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {option.subLabel}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
