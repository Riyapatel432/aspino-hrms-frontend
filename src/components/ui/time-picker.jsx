"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

export function TimePicker({ time, setTime }) {
  // Parse time "HH:MM"
  const [hours, setHours] = React.useState(time ? time.split(":")[0] : "");
  const [minutes, setMinutes] = React.useState(time ? time.split(":")[1] : "");

  React.useEffect(() => {
    if (time) {
      const [h, m] = time.split(":");
      setHours(h);
      setMinutes(m);
    }
  }, [time]);

  const handleTimeChange = (type, value) => {
    let newH = type === "hours" ? value : hours;
    let newM = type === "minutes" ? value : minutes;
    
    if (type === "hours") setHours(value);
    else setMinutes(value);
    
    if (newH.length === 2 && newM.length === 2) {
       setTime(`${newH}:${newM}`);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="grid gap-1 text-center">
        <Input
          type="text"
          inputMode="numeric"
          className="w-12 h-10 text-center text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-sky-500"
          value={hours}
          onChange={(e) => {
            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
            if (val.length === 2 && parseInt(val) > 23) val = "23";
            handleTimeChange("hours", val);
          }}
          onBlur={() => {
            if (hours.length === 1) handleTimeChange("hours", `0${hours}`);
            if (hours === "") handleTimeChange("hours", "00");
          }}
          placeholder="HH"
        />
      </div>
      <span className="text-xl font-bold text-slate-400 pb-1">:</span>
      <div className="grid gap-1 text-center">
        <Input
          type="text"
          inputMode="numeric"
          className="w-12 h-10 text-center text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-sky-500"
          value={minutes}
          onChange={(e) => {
            let val = e.target.value.replace(/\D/g, '').slice(0, 2);
            if (val.length === 2 && parseInt(val) > 59) val = "59";
            handleTimeChange("minutes", val);
          }}
          onBlur={() => {
            if (minutes.length === 1) handleTimeChange("minutes", `0${minutes}`);
            if (minutes === "") handleTimeChange("minutes", "00");
          }}
          placeholder="MM"
        />
      </div>
      <Clock className="ml-1.5 h-4 w-4 text-slate-400" />
    </div>
  );
}
