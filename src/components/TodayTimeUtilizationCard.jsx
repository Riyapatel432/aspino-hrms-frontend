"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePermissions } from "@/context/PermissionContext";
import { createAttendance, fetchAttendance, fetchEmployees } from "@/features/attendance/store/attendanceSlice";
import {
  Play,
  Pause,
  Square,
  Coffee,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Sparkles,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TodayTimeUtilizationCard({
  className = "",
  showProfileHeader = true,
  onAttendanceChanged,
}) {
  const dispatch = useDispatch();
  const { user, isEmployee } = usePermissions();
  const { attendance, employees } = useSelector((state) => state.attendance);

  const rawEmpList = useMemo(
    () => (Array.isArray(employees?.data) ? employees.data : Array.isArray(employees) ? employees : []),
    [employees]
  );

  const myEmployee = useMemo(() => {
    if (!user) return null;
    if (user.employee) return user.employee;
    const found = rawEmpList.find(
      (e) =>
        (user.id && (String(e.userId) === String(user.id) || String(e.id) === String(user.id))) ||
        (user.employeeId && (String(e.id) === String(user.employeeId) || String(e.employeeId) === String(user.employeeId))) ||
        (user.email && e.email?.toLowerCase() === user.email.toLowerCase()) ||
        (user.name &&
          (`${e.firstName} ${e.lastName}`.toLowerCase().includes(user.name.toLowerCase()) ||
            user.name.toLowerCase().includes(e.firstName?.toLowerCase())))
    );
    if (found) return found;
    return {
      id: user.employeeId || user.id || "EMP_CURRENT",
      employeeId: user.employeeCode || user.employeeId || "EMP_CURRENT",
      firstName: user.name?.split?.(" ")?.[0] || user.firstName || "Employee",
      lastName: user.name?.split?.(" ")?.slice(1)?.join(" ") || user.lastName || "",
      department: { name: user.department || "Operations & Staff" },
    };
  }, [user, rawEmpList]);

  const myEmployeeId = myEmployee?.id || user?.employeeId || user?.id || null;

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Today's attendance record - strictly match target employee
  const todayAttendance = useMemo(() => {
    const attList = Array.isArray(attendance?.data) ? attendance.data : Array.isArray(attendance) ? attendance : [];
    const targetId = String(myEmployeeId || myEmployee?.id || "");
    const targetCode = String(myEmployee?.employeeId || "");

    if (!targetId && !targetCode) return null;

    const matching = attList.filter((rec) => {
      const recDate = rec.date
        ? typeof rec.date === "string"
          ? rec.date.split("T")[0]
          : new Date(rec.date).toISOString().split("T")[0]
        : "";
      if (recDate !== todayStr) return false;

      const empId = String(rec.employeeId || rec.employee?.id || "");
      const empCode = String(rec.employee?.employeeId || "");

      return (
        (targetId && empId === targetId) ||
        (targetCode && empCode === targetCode) ||
        (targetId && empCode === targetId) ||
        (targetCode && empId === targetCode)
      );
    });

    if (matching.length === 0) return null;
    return matching[0];
  }, [attendance, todayStr, myEmployeeId, myEmployee]);

  // Ensure employees and attendance are fetched on mount
  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchAttendance({ employeeId: isEmployee ? (myEmployeeId || undefined) : undefined }));
  }, [dispatch, isEmployee, myEmployeeId]);

  // Live timer and optimistic session states
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakElapsedSeconds, setBreakElapsedSeconds] = useState(0);
  const [localBreakMins, setLocalBreakMins] = useState(0); // optimistic local accumulator
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [punchLoading, setPunchLoading] = useState(false);
  const [localSessionState, setLocalSessionState] = useState(null);
  const [localCheckIn, setLocalCheckIn] = useState(null);
  const [localCheckOut, setLocalCheckOut] = useState(null);

  // Recover break start time & persistent session state from localStorage
  useEffect(() => {
    if (!myEmployeeId) return;
    const sessionKey = `hrms_session_${myEmployeeId}`;
    const checkInKey = `hrms_checkin_${myEmployeeId}`;
    const checkOutKey = `hrms_checkout_${myEmployeeId}`;
    const breakKey = `hrms_break_${myEmployeeId}`;

    const savedBreak = localStorage.getItem(breakKey);
    if (savedBreak) {
      const startMs = Number(savedBreak);
      if (!isNaN(startMs) && Date.now() - startMs < 24 * 60 * 60 * 1000) {
        setBreakStartTime(startMs);
      } else {
        localStorage.removeItem(breakKey);
      }
    }

    const savedBreakMins = localStorage.getItem(`hrms_break_mins_${myEmployeeId}`);
    if (savedBreakMins) {
      const mins = Number(savedBreakMins);
      if (!isNaN(mins) && mins > 0) {
        setLocalBreakMins(mins);
      }
    }

    const savedSession = localStorage.getItem(sessionKey);
    const savedCheckIn = localStorage.getItem(checkInKey);
    const savedCheckOut = localStorage.getItem(checkOutKey);

    if (savedSession && ["NOT_PUNCHED", "WORKING", "ON_BREAK", "COMPLETED"].includes(savedSession)) {
      setLocalSessionState(savedSession);
    }
    if (savedCheckIn) {
      setLocalCheckIn(savedCheckIn);
    }
    if (savedCheckOut) {
      setLocalCheckOut(savedCheckOut);
    }
  }, [myEmployeeId]);

  // Sync with todayAttendance when fetched from API
  useEffect(() => {
    if (todayAttendance) {
      const hasOut = todayAttendance.checkOut && String(todayAttendance.checkOut).trim() !== "" && todayAttendance.checkOut !== todayAttendance.checkIn;
      if (hasOut) {
        setLocalSessionState("COMPLETED");
        setLocalCheckIn(todayAttendance.checkIn);
        setLocalCheckOut(todayAttendance.checkOut);
        if (myEmployeeId) {
          localStorage.setItem(`hrms_session_${myEmployeeId}`, "COMPLETED");
          localStorage.setItem(`hrms_checkout_${myEmployeeId}`, String(todayAttendance.checkOut));
        }
      } else if (todayAttendance.checkIn) {
        const isBreak = localStorage.getItem(`hrms_break_${myEmployeeId || "curr"}`);
        const state = isBreak ? "ON_BREAK" : "WORKING";
        setLocalSessionState(state);
        setLocalCheckIn(todayAttendance.checkIn);
        setLocalCheckOut(null);
        if (myEmployeeId) {
          localStorage.setItem(`hrms_session_${myEmployeeId}`, state);
          localStorage.setItem(`hrms_checkin_${myEmployeeId}`, String(todayAttendance.checkIn));
        }
      }
    }
  }, [todayAttendance, myEmployeeId]);

  // Effective check-in and check-out
  const effectiveCheckIn = localCheckIn !== null ? localCheckIn : todayAttendance?.checkIn;
  const effectiveCheckOut = localCheckOut !== null ? localCheckOut : todayAttendance?.checkOut;

  // Effective Session State calculation
  const currentSessionState = useMemo(() => {
    if (localSessionState !== null) return localSessionState;
    if (breakStartTime) return "ON_BREAK";
    if (effectiveCheckOut && String(effectiveCheckOut).trim() !== "" && effectiveCheckOut !== effectiveCheckIn) {
      return "COMPLETED";
    }
    if (effectiveCheckIn) return "WORKING";
    return "NOT_PUNCHED";
  }, [localSessionState, breakStartTime, effectiveCheckIn, effectiveCheckOut]);

  // Sync localBreakMins upward whenever DB confirms a higher value
  useEffect(() => {
    const dbMins = todayAttendance?.breakMinutes || 0;
    if (dbMins > 0) {
      setLocalBreakMins((prev) => Math.max(prev, dbMins));
    }
  }, [todayAttendance?.breakMinutes]);

  // Live break timer ticker
  useEffect(() => {
    let timer = null;
    if (breakStartTime) {
      const updateBreak = () => {
        setBreakElapsedSeconds(Math.max(0, Math.floor((Date.now() - breakStartTime) / 1000)));
      };
      updateBreak();
      timer = setInterval(updateBreak, 1000);
    } else {
      setBreakElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [breakStartTime]);

  // Live work duration ticker
  useEffect(() => {
    let workTimer = null;
    if (effectiveCheckIn && !effectiveCheckOut) {
      const checkInMs = new Date(effectiveCheckIn).getTime();
      const updateWork = () => {
        const nowMs = Date.now();
        const totalSpanSec = Math.max(0, Math.floor((nowMs - checkInMs) / 1000));
        const savedBreakSec = effectiveBreakMins * 60;
        const currentBreakSec = breakStartTime ? Math.max(0, Math.floor((nowMs - breakStartTime) / 1000)) : 0;
        const netWorkSec = Math.max(0, totalSpanSec - (savedBreakSec + currentBreakSec));
        setLiveElapsedSeconds(netWorkSec);
      };
      updateWork();
      workTimer = setInterval(updateWork, 1000);
    } else if (todayAttendance?.totalWorkHours) {
      setLiveElapsedSeconds(Math.round(todayAttendance.totalWorkHours * 3600));
    } else {
      setLiveElapsedSeconds(0);
    }
    return () => {
      if (workTimer) clearInterval(workTimer);
    };
  }, [effectiveCheckIn, effectiveCheckOut, todayAttendance, breakStartTime]);

  // Calculate formatted work hours: HH:MM
  const totalHoursFormatted = useMemo(() => {
    if (!effectiveCheckIn) return "00:00";
    const hours = Math.floor(liveElapsedSeconds / 3600);
    const mins = Math.floor((liveElapsedSeconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }, [effectiveCheckIn, liveElapsedSeconds]);

  // Calculate formatted break timer: HH:MM:SS
  // Uses the higher of: DB-persisted breakMinutes vs local optimistic accumulator
  // so the display never drops to 00:00:00 between optimistic clear and API response.
  const effectiveBreakMins = Math.max(todayAttendance?.breakMinutes || 0, localBreakMins);
  const breakTimerFormatted = useMemo(() => {
    const savedBreakSec = effectiveBreakMins * 60;
    const totalBreakSec = savedBreakSec + (breakStartTime ? breakElapsedSeconds : 0);
    const hrs = Math.floor(totalBreakSec / 3600);
    const mins = Math.floor((totalBreakSec % 3600) / 60);
    const secs = totalBreakSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [effectiveBreakMins, breakStartTime, breakElapsedSeconds]);

  // Punch In formatted string
  const punchInTimeFormatted = useMemo(() => {
    if (!effectiveCheckIn) return "—";
    return new Date(effectiveCheckIn).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [effectiveCheckIn]);

  // Shift Timing (Default 09:30 - 18:15 = 8h 45m = 525 minutes = 31500 sec)
  const shiftTargetSeconds = 8.75 * 3600; // 8 hours 45 mins
  const progressPercentage = useMemo(() => {
    if (!effectiveCheckIn) return 0;
    const pct = Math.min(100, Math.round((liveElapsedSeconds / shiftTargetSeconds) * 100));
    return isNaN(pct) ? 0 : pct;
  }, [effectiveCheckIn, liveElapsedSeconds, shiftTargetSeconds]);

  // Circular gauge SVG parameters
  const radius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercentage) / 100;

  // --- ACTIONS ---
  const handleStartWork = async () => {
    // If currently on break, resume work!
    if (breakStartTime) {
      await handleBreakOut();
      return;
    }

    const empId = myEmployee?.id || myEmployeeId || rawEmpList[0]?.id;
    if (!empId) {
      toast.error("Employee identification not found.");
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Optimistic UI updates
    setLocalCheckIn(nowIso);
    setLocalCheckOut(null);
    setLocalSessionState("WORKING");
    setBreakStartTime(null);
    if (myEmployeeId) {
      localStorage.setItem(`hrms_session_${myEmployeeId}`, "WORKING");
      localStorage.setItem(`hrms_checkin_${myEmployeeId}`, nowIso);
      localStorage.removeItem(`hrms_checkout_${myEmployeeId}`);
      localStorage.removeItem(`hrms_break_${myEmployeeId}`);
    }

    setPunchLoading(true);
    try {
      await dispatch(
        createAttendance({
          id: todayAttendance?.id,
          employeeId: String(empId),
          date: todayStr,
          checkIn: nowIso,
          checkOut: null,
          status: "PRESENT",
          captureMethod: "WEB_CLOCK",
          totalWorkHours: 0,
          presentDay: 1.0,
        })
      ).unwrap();

      toast.success(`🎉 Punched In at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}!`);
      dispatch(fetchAttendance({ employeeId: isEmployee ? (myEmployeeId || undefined) : undefined }));
      if (onAttendanceChanged) onAttendanceChanged();
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to start work");
    } finally {
      setPunchLoading(false);
    }
  };

  const handleBreakIn = () => {
    if (!effectiveCheckIn) {
      toast.warning("Please Punch In first before taking a break.");
      return;
    }
    const now = Date.now();
    setBreakStartTime(now);
    setLocalSessionState("ON_BREAK");
    if (myEmployeeId) {
      localStorage.setItem(`hrms_session_${myEmployeeId}`, "ON_BREAK");
      localStorage.setItem(`hrms_break_${myEmployeeId}`, String(now));
    }
    toast.info("☕ Break started! Standard limit is 60 minutes.");
  };

  const handleBreakOut = async () => {
    const elapsedMins = breakStartTime ? Math.max(0, Math.floor((Date.now() - breakStartTime) / 60000)) : 0;
    
    // Optimistic UI updates — update localBreakMins BEFORE clearing breakStartTime
    // so breakTimerFormatted never drops to 00:00:00 while waiting for the API response
    const prevBreakMins = effectiveBreakMins;
    const newBreakMins = prevBreakMins + elapsedMins;
    setLocalBreakMins(newBreakMins);
    setBreakStartTime(null);
    setLocalSessionState("WORKING");
    if (myEmployeeId) {
      localStorage.setItem(`hrms_session_${myEmployeeId}`, "WORKING");
      localStorage.removeItem(`hrms_break_${myEmployeeId}`);
      localStorage.setItem(`hrms_break_mins_${myEmployeeId}`, String(newBreakMins));
    }

    setPunchLoading(true);
    try {
      const empId = myEmployee?.id || myEmployeeId || todayAttendance?.employeeId;

      let netWorkHours = todayAttendance?.totalWorkHours || 0;
      if (effectiveCheckIn) {
        const checkInDate = new Date(effectiveCheckIn);
        const currentElapsedWorkMins = Math.max(0, Math.round((Date.now() - checkInDate.getTime()) / 60000) - newBreakMins);
        netWorkHours = parseFloat((currentElapsedWorkMins / 60).toFixed(2));
      }

      await dispatch(
        createAttendance({
          id: todayAttendance?.id,
          employeeId: String(empId),
          date: todayStr,
          checkIn: effectiveCheckIn,
          checkOut: null,
          breakMinutes: newBreakMins,
          totalWorkHours: netWorkHours,
          status: todayAttendance?.status || "PRESENT",
          captureMethod: "WEB_CLOCK",
        })
      ).unwrap();

      toast.success(`☕ Break ended (+${elapsedMins} mins). Resumed work!`);
      dispatch(fetchAttendance({ employeeId: isEmployee ? (myEmployeeId || undefined) : undefined }));
      if (onAttendanceChanged) onAttendanceChanged();
    } catch (err) {
      console.error(err);
      toast.error("Failed to record break duration.");
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOut = async () => {
    if (!effectiveCheckIn) {
      toast.warning("No active check-in record found for today.");
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // Optimistic UI updates
    setLocalCheckOut(nowIso);
    setLocalSessionState("COMPLETED");
    setBreakStartTime(null);
    if (myEmployeeId) {
      localStorage.setItem(`hrms_session_${myEmployeeId}`, "COMPLETED");
      localStorage.setItem(`hrms_checkout_${myEmployeeId}`, nowIso);
      localStorage.removeItem(`hrms_break_${myEmployeeId}`);
    }

    setPunchLoading(true);
    try {
      const empId = myEmployee?.id || myEmployeeId || todayAttendance?.employeeId;
      const inDate = new Date(effectiveCheckIn);
      const diffMs = now.getTime() - inDate.getTime();
      const totalSpanMins = Math.max(0, Math.round(diffMs / 60000));
      const breakMins = effectiveBreakMins + (breakStartTime ? Math.floor((Date.now() - breakStartTime) / 60000) : 0);
      const netWorkMins = Math.max(0, totalSpanMins - breakMins);
      const netHours = parseFloat((netWorkMins / 60).toFixed(2));
      const otHours = netHours > 8.0 ? parseFloat((netHours - 8.0).toFixed(2)) : 0;
      const isHalfDay = netHours < 4.5;
      const status = isHalfDay ? "HALFDAY" : "PRESENT";
      const presentDay = isHalfDay ? 0.5 : 1.0;

      await dispatch(
        createAttendance({
          id: todayAttendance?.id,
          employeeId: String(empId),
          date: todayStr,
          checkIn: effectiveCheckIn,
          checkOut: nowIso,
          breakMinutes: breakMins,
          totalWorkHours: netHours,
          otHours,
          status,
          presentDay,
          captureMethod: "WEB_CLOCK",
        })
      ).unwrap();

      toast.success(`👋 Punched Out! Shift duration: ${netHours} hrs${otHours > 0 ? ` (+${otHours} hrs OT)` : ""}`);
      dispatch(fetchAttendance({ employeeId: isEmployee ? (myEmployeeId || undefined) : undefined }));
      if (onAttendanceChanged) onAttendanceChanged();
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to punch out");
    } finally {
      setPunchLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 ${className}`}>
      {/* 1. Profile & Title Header */}
      {showProfileHeader && (
        <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Profile</span>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500">Verified</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              {myEmployee ? `${myEmployee.firstName?.[0] || ""}${myEmployee.lastName?.[0] || ""}` : <User className="size-5" />}
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                {myEmployee ? `${myEmployee.firstName} ${myEmployee.lastName}` : (user?.name || "Employee")}
              </h4>
              <p className="text-[11px] font-medium text-slate-400">
                {myEmployee?.department?.name || myEmployee?.department || "Operations & Staff"} • {myEmployee?.employeeId || "Staff"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Today's Time Utilization Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
          <span>Today&apos;s Time Utilization</span>
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-800">
            [09:30 - 18:15]
          </span>
        </h3>
        <span title="Standard shift duration: 8 hrs 45 mins (including lunch & refreshments)">
          <Info className="w-4 h-4 text-slate-400 hover:text-sky-500 transition-colors cursor-pointer" />
        </span>
      </div>

      {/* 3. Outer Utilization Container */}
      <div className="bg-sky-50/40 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-700/60 rounded-2xl p-4 space-y-4">
        {/* Top Mini Tiles: Punch In & Total Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 block leading-tight">Punch In:</span>
            <span className="text-sm font-black text-slate-800 dark:text-white mt-1 block">
              {punchInTimeFormatted}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 block leading-tight">Total Hours:</span>
            <span className="text-sm font-black font-mono text-slate-800 dark:text-white mt-1 block">
              {totalHoursFormatted}
            </span>
          </div>
        </div>

        {/* Center: Circular Progress Gauge */}
        <div className="relative flex flex-col items-center justify-center py-2">
          <svg className="size-36 -rotate-90 transform" viewBox="0 0 130 130">
            {/* Background Track Circle */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-200 dark:text-slate-800"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${
                currentSessionState === "ON_BREAK"
                  ? "text-amber-500"
                  : currentSessionState === "COMPLETED"
                  ? "text-emerald-500"
                  : currentSessionState === "WORKING"
                  ? "text-sky-500"
                  : "text-slate-300 dark:text-slate-700"
              }`}
              fill="transparent"
            />
          </svg>

          {/* Center Text inside the circle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-baseline">
              <span>{progressPercentage}</span>
              <span className="text-sm font-bold text-slate-400 ml-0.5">%</span>
            </div>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              {currentSessionState === "ON_BREAK"
                ? "On Break"
                : currentSessionState === "COMPLETED"
                ? "Completed"
                : currentSessionState === "WORKING"
                ? "In Progress"
                : "Not Started"}
            </span>
          </div>
        </div>

        {/* Action Buttons: Sequential State Flow */}
        <div className="space-y-2 pt-1">
          {/* STATE 1: NOT PUNCHED IN -> ONLY SHOW PUNCH IN BUTTON */}
          {currentSessionState === "NOT_PUNCHED" && (
            <Button
              type="button"
              disabled={punchLoading}
              onClick={handleStartWork}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl h-11 shadow-lg shadow-emerald-600/20 gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
            >
              {punchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Punch In
                </>
              )}
            </Button>
          )}

          {/* STATE 2: WORKING ACTIVE -> SHOW BREAK IN & PUNCH OUT */}
          {currentSessionState === "WORKING" && (
            <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
              <Button
                type="button"
                disabled={punchLoading}
                onClick={handleBreakIn}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl h-11 shadow-sm gap-1.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
              >
                <Coffee className="w-4 h-4" />
                Break In
              </Button>

              <Button
                type="button"
                disabled={punchLoading}
                onClick={handlePunchOut}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl h-11 shadow-sm gap-1.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
              >
                {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-current" />}
                Punch Out
              </Button>
            </div>
          )}

          {/* STATE 3: ON BREAK -> SHOW BREAK OUT / RESUME WORK & PUNCH OUT */}
          {currentSessionState === "ON_BREAK" && (
            <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
              <Button
                type="button"
                disabled={punchLoading}
                onClick={handleBreakOut}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl h-11 shadow-md gap-1.5 cursor-pointer animate-pulse transition-all hover:scale-[1.01] active:scale-95"
              >
                {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Break Out (Resume)
              </Button>

              <Button
                type="button"
                disabled={punchLoading}
                onClick={handlePunchOut}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl h-11 shadow-sm gap-1.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
              >
                {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-current" />}
                Punch Out
              </Button>
            </div>
          )}

          {/* STATE 4: SHIFT COMPLETED -> SHOW COMPLETED STATUS & START NEW PUNCH OPTION */}
          {currentSessionState === "COMPLETED" && (
            <div className="space-y-2">
              <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-center font-bold text-xs flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Shift Completed ({todayAttendance?.totalWorkHours || 8} hrs logged)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={punchLoading}
                onClick={handleStartWork}
                className="w-full border-dashed border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs font-bold rounded-xl h-9 gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start New Session / Re-Punch
              </Button>
            </div>
          )}
        </div>

        {/* Live Break Duration Timer */}
        <div className="text-center pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Break: <strong className="font-mono text-slate-800 dark:text-white font-bold">{breakTimerFormatted}</strong>
          </span>
          {breakStartTime && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5 animate-pulse">
              ☕ Currently on break (Limit: 60 mins)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
