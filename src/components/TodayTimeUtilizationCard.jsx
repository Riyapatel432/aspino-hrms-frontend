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
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    const userEmail = (user.email || "").toLowerCase().trim();
    const userName = (user.name || "").toLowerCase().trim();
    const userId = user.id ? String(user.id) : "";
    const userEmpId = user.employeeId ? String(user.employeeId) : "";
    const userEmpCode = user.employeeCode ? String(user.employeeCode) : "";

    const found = rawEmpList.find((e) => {
      const eUserId = e.userId ? String(e.userId) : "";
      const eId = e.id ? String(e.id) : "";
      const eEmpCode = e.employeeId ? String(e.employeeId) : "";
      const eEmail = (e.email || "").toLowerCase().trim();
      const eFullName = `${e.firstName || ""} ${e.lastName || ""}`.toLowerCase().trim();

      // 1. Direct ID / UserID match
      if (userId && (eUserId === userId || eId === userId)) return true;
      // 2. Direct Employee ID match
      if (userEmpId && (eId === userEmpId || eEmpCode === userEmpId)) return true;
      // 3. Direct Employee Code match
      if (userEmpCode && (eEmpCode === userEmpCode || eId === userEmpCode)) return true;
      // 4. Exact Email match
      if (userEmail && eEmail && eEmail === userEmail) return true;
      // 5. Exact Full Name match
      if (userName && eFullName && eFullName === userName) return true;

      return false;
    });

    if (found) return found;

    // Strict isolated fallback for current session user (HR or Employee)
    const nameParts = (user.name || (isEmployee ? "Aspino Employee" : "Aspino HR Manager")).trim().split(/\s+/);
    return {
      id: user.employeeId || user.id || (isEmployee ? "EMP_USER" : "HR_USER"),
      employeeId: user.employeeCode || user.employeeId || (isEmployee ? "ASP-EMP-001" : "ASP-HR-001"),
      firstName: nameParts[0] || (isEmployee ? "Employee" : "HR"),
      lastName: nameParts.slice(1).join(" ") || (isEmployee ? "Staff" : "Manager"),
      email: user.email || (isEmployee ? "employee@aspino.com" : "hr@aspino.com"),
      department: { name: user.department || (isEmployee ? "Operations & Staff" : "Human Resources") },
    };
  }, [user, rawEmpList, isEmployee]);

  const myEmployeeId = myEmployee?.id || user?.employeeId || user?.id || null;

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Today's attendance record - strictly match target employee or user
  const todayAttendance = useMemo(() => {
    const attList = Array.isArray(attendance?.data) ? attendance.data : Array.isArray(attendance) ? attendance : [];
    const targetId = String(myEmployeeId || myEmployee?.id || user?.id || "");
    const targetCode = String(myEmployee?.employeeId || user?.employeeCode || user?.employeeId || "");
    const targetUserId = String(user?.id || user?.userId || "");
    const targetEmail = String(user?.email || myEmployee?.email || "").toLowerCase().trim();

    if (!targetId && !targetCode && !targetUserId && !targetEmail) return null;

    const matching = attList.filter((rec) => {
      const recDate = rec.date
        ? typeof rec.date === "string"
          ? rec.date.split("T")[0]
          : new Date(rec.date).toISOString().split("T")[0]
        : "";
      if (recDate !== todayStr) return false;

      const empId = String(rec.employeeId || rec.employee?.id || "");
      const empCode = String(rec.employee?.employeeId || "");
      const empUserId = String(rec.employee?.userId || "");
      const empEmail = String(rec.employee?.email || "").toLowerCase().trim();

      return (
        (targetId && (empId === targetId || empCode === targetId || empUserId === targetId)) ||
        (targetUserId && (empUserId === targetUserId || empId === targetUserId)) ||
        (targetCode && (empCode === targetCode || empId === targetCode)) ||
        (targetEmail && empEmail && empEmail === targetEmail)
      );
    });

    if (matching.length === 0) return null;
    return matching[0];
  }, [attendance, todayStr, myEmployeeId, myEmployee, user]);

  // Ensure employees and attendance are fetched on mount
  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchAttendance({ employeeId: isEmployee ? (myEmployeeId || undefined) : undefined }));
  }, [dispatch, isEmployee, myEmployeeId]);

  // Live timer and optimistic session states
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakElapsedSeconds, setBreakElapsedSeconds] = useState(0);
  const [localBreakSeconds, setLocalBreakSeconds] = useState(0); // second-precision accumulator
  const [lastBreakIn, setLastBreakIn] = useState(null);
  const [lastBreakOut, setLastBreakOut] = useState(null);
  const [breakCount, setBreakCount] = useState(0);
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  const [punchLoading, setPunchLoading] = useState(false);
  const [localSessionState, setLocalSessionState] = useState(null);
  const [localCheckIn, setLocalCheckIn] = useState(null);
  const [localCheckOut, setLocalCheckOut] = useState(null);

  // Late / Missed Punch Out confirmation modal state
  const [showLatePunchOutModal, setShowLatePunchOutModal] = useState(false);
  const [customOutTime, setCustomOutTime] = useState("18:15");
  const [punchOutReason, setPunchOutReason] = useState("Forgot to punch out yesterday");
  const [customReasonNote, setCustomReasonNote] = useState("");

  // Recover break start time, break stats & persistent session state from localStorage for today
  useEffect(() => {
    if (!myEmployeeId || !todayStr) return;
    const sessionKey = `hrms_${todayStr}_session_${myEmployeeId}`;
    const checkInKey = `hrms_${todayStr}_checkin_${myEmployeeId}`;
    const checkOutKey = `hrms_${todayStr}_checkout_${myEmployeeId}`;
    const breakKey = `hrms_${todayStr}_break_${myEmployeeId}`;
    const breakInKey = `hrms_${todayStr}_break_in_${myEmployeeId}`;
    const breakOutKey = `hrms_${todayStr}_break_out_${myEmployeeId}`;
    const breakCountKey = `hrms_${todayStr}_break_count_${myEmployeeId}`;
    const breakSecsKey = `hrms_${todayStr}_break_secs_${myEmployeeId}`;

    const savedBreak = localStorage.getItem(breakKey);
    if (savedBreak) {
      const startMs = Number(savedBreak);
      if (!isNaN(startMs) && Date.now() - startMs < 24 * 60 * 60 * 1000) {
        setBreakStartTime(startMs);
      } else {
        localStorage.removeItem(breakKey);
      }
    }

    const savedBreakSecs = localStorage.getItem(breakSecsKey);
    if (savedBreakSecs) {
      const secs = Number(savedBreakSecs);
      if (!isNaN(secs) && secs > 0) {
        setLocalBreakSeconds(secs);
      }
    } else {
      const savedBreakMins = localStorage.getItem(`hrms_${todayStr}_break_mins_${myEmployeeId}`);
      if (savedBreakMins) {
        const mins = Number(savedBreakMins);
        if (!isNaN(mins) && mins > 0) {
          setLocalBreakSeconds(mins * 60);
        }
      }
    }

    const savedBreakIn = localStorage.getItem(breakInKey);
    if (savedBreakIn) setLastBreakIn(savedBreakIn);

    const savedBreakOut = localStorage.getItem(breakOutKey);
    if (savedBreakOut) setLastBreakOut(savedBreakOut);

    const savedBreakCount = localStorage.getItem(breakCountKey);
    if (savedBreakCount) setBreakCount(Number(savedBreakCount) || 0);

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
  }, [myEmployeeId, todayStr]);

  // Sync with todayAttendance when fetched from API
  useEffect(() => {
    if (!todayStr) return;
    if (todayAttendance) {
      const hasOut = todayAttendance.checkOut && String(todayAttendance.checkOut).trim() !== "" && todayAttendance.checkOut !== todayAttendance.checkIn;
      if (hasOut) {
        setLocalSessionState("COMPLETED");
        setLocalCheckIn(todayAttendance.checkIn);
        setLocalCheckOut(todayAttendance.checkOut);
        if (myEmployeeId) {
          localStorage.setItem(`hrms_${todayStr}_session_${myEmployeeId}`, "COMPLETED");
          localStorage.setItem(`hrms_${todayStr}_checkout_${myEmployeeId}`, String(todayAttendance.checkOut));
        }
      } else if (todayAttendance.checkIn) {
        const isBreak = localStorage.getItem(`hrms_${todayStr}_break_${myEmployeeId || "curr"}`);
        const state = isBreak ? "ON_BREAK" : "WORKING";
        setLocalSessionState(state);
        setLocalCheckIn(todayAttendance.checkIn);
        setLocalCheckOut(null);
        if (myEmployeeId) {
          localStorage.setItem(`hrms_${todayStr}_session_${myEmployeeId}`, state);
          localStorage.setItem(`hrms_${todayStr}_checkin_${myEmployeeId}`, String(todayAttendance.checkIn));
        }
      }
    }
  }, [todayAttendance, myEmployeeId, todayStr]);

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

  // Sync localBreakSeconds upward whenever DB confirms a higher value
  useEffect(() => {
    const dbMins = todayAttendance?.breakMinutes || 0;
    if (dbMins > 0) {
      setLocalBreakSeconds((prev) => Math.max(prev, dbMins * 60));
    }
  }, [todayAttendance?.breakMinutes]);

  // Effective break seconds accumulator
  const effectiveTotalBreakSec = Math.max((todayAttendance?.breakMinutes || 0) * 60, localBreakSeconds);
  const effectiveBreakMins = Math.ceil(effectiveTotalBreakSec / 60);

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
        const savedBreakSec = effectiveTotalBreakSec;
        const currentBreakSec = breakStartTime ? Math.max(0, Math.floor((nowMs - breakStartTime) / 1000)) : 0;
        const netWorkSec = Math.min(24 * 3600, Math.max(0, totalSpanSec - (savedBreakSec + currentBreakSec)));
        setLiveElapsedSeconds(netWorkSec);
      };
      updateWork();
      workTimer = setInterval(updateWork, 1000);
    } else if (todayAttendance?.totalWorkHours) {
      setLiveElapsedSeconds(Math.round(Math.min(24, todayAttendance.totalWorkHours) * 3600));
    } else {
      setLiveElapsedSeconds(0);
    }
    return () => {
      if (workTimer) clearInterval(workTimer);
    };
  }, [effectiveCheckIn, effectiveCheckOut, todayAttendance, breakStartTime, effectiveTotalBreakSec]);

  // Calculate formatted work hours: HH:MM
  const totalHoursFormatted = useMemo(() => {
    if (!effectiveCheckIn) return "00:00";
    const hours = Math.floor(liveElapsedSeconds / 3600);
    const mins = Math.floor((liveElapsedSeconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }, [effectiveCheckIn, liveElapsedSeconds]);

  // Calculate formatted break timer: HH:MM:SS
  const breakTimerFormatted = useMemo(() => {
    const totalBreakSec = effectiveTotalBreakSec + (breakStartTime ? breakElapsedSeconds : 0);
    const hrs = Math.floor(totalBreakSec / 3600);
    const mins = Math.floor((totalBreakSec % 3600) / 60);
    const secs = totalBreakSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [effectiveTotalBreakSec, breakStartTime, breakElapsedSeconds]);

  // Punch In formatted string
  const punchInTimeFormatted = useMemo(() => {
    if (!effectiveCheckIn) return "—";
    return new Date(effectiveCheckIn).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [effectiveCheckIn]);

  // Punch Out formatted string
  const punchOutTimeFormatted = useMemo(() => {
    if (!effectiveCheckOut || effectiveCheckOut === effectiveCheckIn) return "—";
    return new Date(effectiveCheckOut).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [effectiveCheckOut, effectiveCheckIn]);

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
    // 1. Guard against punching in again on the same day if already completed
    const isAlreadyCompletedToday = Boolean(
      (todayAttendance?.checkOut && String(todayAttendance.checkOut).trim() !== "" && todayAttendance.checkOut !== todayAttendance.checkIn) ||
      (localCheckOut && String(localCheckOut).trim() !== "") ||
      localSessionState === "COMPLETED"
    );

    if (isAlreadyCompletedToday) {
      toast.warning("You have already completed your shift for today. Punch in will be available tomorrow.");
      return;
    }

    if (breakStartTime) {
      await handleBreakOut();
      return;
    }

    const empId = myEmployee?.id || myEmployeeId || user?.employeeId || user?.id;
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
    setLastBreakIn(null);
    setLastBreakOut(null);
    setBreakCount(0);
    setLocalBreakSeconds(0);

    if (myEmployeeId && todayStr) {
      localStorage.setItem(`hrms_${todayStr}_session_${myEmployeeId}`, "WORKING");
      localStorage.setItem(`hrms_${todayStr}_checkin_${myEmployeeId}`, nowIso);
      localStorage.removeItem(`hrms_${todayStr}_checkout_${myEmployeeId}`);
      localStorage.removeItem(`hrms_${todayStr}_break_${myEmployeeId}`);
      localStorage.removeItem(`hrms_${todayStr}_break_in_${myEmployeeId}`);
      localStorage.removeItem(`hrms_${todayStr}_break_out_${myEmployeeId}`);
      localStorage.removeItem(`hrms_${todayStr}_break_count_${myEmployeeId}`);
      localStorage.removeItem(`hrms_${todayStr}_break_mins_${myEmployeeId}`);
      localStorage.removeItem(`hrms_${todayStr}_break_secs_${myEmployeeId}`);
    }

    setPunchLoading(true);
    try {
      const result = await dispatch(
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

      const savedAtt = result?.data || result;
      if (savedAtt) {
        setLocalCheckIn(savedAtt.checkIn || nowIso);
        setLocalCheckOut(null);
        setLocalSessionState("WORKING");
      }

      toast.success(`🎉 Punched In at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}!`);
      dispatch(fetchEmployees());
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
    const nowMs = Date.now();
    const formattedIn = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setBreakStartTime(nowMs);
    setLastBreakIn(formattedIn);
    setLocalSessionState("ON_BREAK");

    if (myEmployeeId && todayStr) {
      localStorage.setItem(`hrms_${todayStr}_session_${myEmployeeId}`, "ON_BREAK");
      localStorage.setItem(`hrms_${todayStr}_break_${myEmployeeId}`, String(nowMs));
      localStorage.setItem(`hrms_${todayStr}_break_in_${myEmployeeId}`, formattedIn);
    }
    toast.info(`☕ Break started at ${formattedIn}! (Standard limit: 60 mins)`);
  };

  const handleBreakOut = async () => {
    const elapsedSecs = breakStartTime ? Math.max(0, Math.floor((Date.now() - breakStartTime) / 1000)) : 0;
    const formattedOut = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const prevBreakSecs = effectiveTotalBreakSec;
    const newBreakSecs = prevBreakSecs + elapsedSecs;
    const newBreakMins = Math.max(0, Math.ceil(newBreakSecs / 60));
    const newBreakCount = (breakCount || 0) + 1;

    setLocalBreakSeconds(newBreakSecs);
    setBreakStartTime(null);
    setLastBreakOut(formattedOut);
    setBreakCount(newBreakCount);
    setLocalSessionState("WORKING");

    if (myEmployeeId && todayStr) {
      localStorage.setItem(`hrms_${todayStr}_session_${myEmployeeId}`, "WORKING");
      localStorage.removeItem(`hrms_${todayStr}_break_${myEmployeeId}`);
      localStorage.setItem(`hrms_${todayStr}_break_secs_${myEmployeeId}`, String(newBreakSecs));
      localStorage.setItem(`hrms_${todayStr}_break_mins_${myEmployeeId}`, String(newBreakMins));
      localStorage.setItem(`hrms_${todayStr}_break_out_${myEmployeeId}`, formattedOut);
      localStorage.setItem(`hrms_${todayStr}_break_count_${myEmployeeId}`, String(newBreakCount));
    }

    setPunchLoading(true);
    try {
      const empId = myEmployee?.id || myEmployeeId || todayAttendance?.employeeId || user?.employeeId || user?.id;
      if (!empId) {
        toast.error("Employee identification not found.");
        return;
      }

      let netWorkHours = todayAttendance?.totalWorkHours || 0;
      let checkInToSend = new Date().toISOString();

      if (effectiveCheckIn) {
        const checkInDate = new Date(effectiveCheckIn);
        if (!isNaN(checkInDate.getTime())) {
          checkInToSend = checkInDate.toISOString();
          const currentElapsedWorkMins = Math.max(0, Math.round((Date.now() - checkInDate.getTime()) / 60000) - (newBreakMins || 0));
          const computedHours = parseFloat((currentElapsedWorkMins / 60).toFixed(2));
          netWorkHours = !isNaN(computedHours) ? Math.min(24.0, computedHours) : 0;
        }
      }

      const validStatuses = ["PRESENT", "ABSENT", "LATE", "HALFDAY", "ON_LEAVE", "HOLIDAY"];
      const currentStatus = todayAttendance?.status?.toUpperCase();
      const statusToSend = validStatuses.includes(currentStatus) ? currentStatus : "PRESENT";

      const result = await dispatch(
        createAttendance({
          id: todayAttendance?.id,
          employeeId: String(empId),
          date: todayStr,
          checkIn: checkInToSend,
          checkOut: null,
          breakMinutes: Number(newBreakMins) || 0,
          totalWorkHours: Number(netWorkHours) || 0,
          status: statusToSend,
          captureMethod: "WEB_CLOCK",
        })
      ).unwrap();

      const savedAtt = result?.data || result;
      if (savedAtt) {
        setLocalCheckIn(savedAtt.checkIn || checkInToSend);
        setLocalSessionState("WORKING");
      }

      const elapsedDisplay = elapsedSecs >= 60 ? `+${Math.round(elapsedSecs / 60)} min` : `+${elapsedSecs}s`;
      toast.success(`☕ Break ended at ${formattedOut} (${elapsedDisplay}). Total breaks: ${newBreakCount}. Resumed work!`);
      dispatch(fetchEmployees());
      dispatch(fetchAttendance({ employeeId: isEmployee ? (myEmployeeId || undefined) : undefined }));
      if (onAttendanceChanged) onAttendanceChanged();
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (err?.message || "Failed to record break duration."));
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchOutClick = () => {
    if (!effectiveCheckIn) {
      toast.warning("No active check-in record found for today.");
      return;
    }

    const inDate = new Date(effectiveCheckIn);
    const now = new Date();
    const diffHours = (now.getTime() - inDate.getTime()) / (1000 * 60 * 60);

    // If check-in was from an earlier calendar date or elapsed duration is abnormal (>14 hours), prompt reason
    if (inDate.toDateString() !== now.toDateString() || diffHours > 14) {
      setShowLatePunchOutModal(true);
      return;
    }

    executePunchOut();
  };

  const executePunchOut = async (overrideOutIso, reasonText) => {
    const now = new Date();
    let finalOutIso = overrideOutIso || now.toISOString();
    let outDate = new Date(finalOutIso);

    // Optimistic UI updates
    setLocalCheckOut(finalOutIso);
    setLocalSessionState("COMPLETED");
    setBreakStartTime(null);
    if (myEmployeeId && todayStr) {
      localStorage.setItem(`hrms_${todayStr}_session_${myEmployeeId}`, "COMPLETED");
      localStorage.setItem(`hrms_${todayStr}_checkout_${myEmployeeId}`, finalOutIso);
      localStorage.removeItem(`hrms_${todayStr}_break_${myEmployeeId}`);
    }

    setPunchLoading(true);
    setShowLatePunchOutModal(false);

    try {
      const empId = myEmployee?.id || myEmployeeId || todayAttendance?.employeeId || user?.employeeId || user?.id;
      if (!empId) {
        toast.error("Employee identification not found.");
        return;
      }

      let validCheckIn = new Date(now.getTime() - 8 * 3600000).toISOString();
      if (effectiveCheckIn) {
        const testDate = new Date(effectiveCheckIn);
        if (!isNaN(testDate.getTime())) {
          validCheckIn = testDate.toISOString();
        }
      }

      const inDate = new Date(validCheckIn);
      const diffMs = Math.max(0, outDate.getTime() - inDate.getTime());
      const totalSpanMins = Math.max(0, Math.round(diffMs / 60000));
      const additionalBreakSecs = breakStartTime ? Math.max(0, Math.floor((Date.now() - breakStartTime) / 1000)) : 0;
      const breakSecs = (Number(effectiveTotalBreakSec) || 0) + additionalBreakSecs;
      const breakMins = Math.max(0, Math.ceil(breakSecs / 60));
      const netWorkMins = Math.max(0, totalSpanMins - breakMins);
      const computedNetHours = parseFloat((netWorkMins / 60).toFixed(2));
      let netHours = !isNaN(computedNetHours) ? Math.min(24.0, computedNetHours) : 0;

      const standardShiftHours = 8.75;
      const earlyGoingHours = netHours < standardShiftHours ? parseFloat(Math.max(0, standardShiftHours - netHours).toFixed(2)) : 0;
      const otHours = netHours > 8.0 ? parseFloat((netHours - 8.0).toFixed(2)) : 0;
      const isHalfDay = netHours < 4.5;
      const status = isHalfDay ? "HALFDAY" : "PRESENT";
      const presentDay = isHalfDay ? 0.5 : 1.0;

      const recordDate = todayAttendance?.date
        ? (typeof todayAttendance.date === "string" ? todayAttendance.date.split("T")[0] : new Date(todayAttendance.date).toISOString().split("T")[0])
        : (inDate && !isNaN(inDate.getTime()) ? inDate.toISOString().split("T")[0] : todayStr);

      const result = await dispatch(
        createAttendance({
          id: todayAttendance?.id,
          employeeId: String(empId),
          date: recordDate,
          checkIn: validCheckIn,
          checkOut: finalOutIso,
          breakMinutes: Number(breakMins) || 0,
          totalWorkHours: Number(netHours) || 0,
          otHours: Number(otHours) || 0,
          earlyGoingHours: Number(earlyGoingHours) || 0,
          isHalfDay: Boolean(isHalfDay),
          status,
          presentDay: Number(presentDay) || 1.0,
          captureMethod: "WEB_CLOCK",
        })
      ).unwrap();

      const savedAtt = result?.data || result;
      if (savedAtt) {
        setLocalCheckIn(savedAtt.checkIn || validCheckIn);
        setLocalCheckOut(savedAtt.checkOut || finalOutIso);
        setLocalSessionState("COMPLETED");
      }

      const outTimeDisplay = outDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const earlyMsg = earlyGoingHours > 0 ? ` (Early Out: ${earlyGoingHours}h early)` : "";
      const otMsg = otHours > 0 ? ` (+${otHours}h OT)` : "";
      toast.success(`👋 Punched Out at ${outTimeDisplay}! Work duration: ${netHours} hrs${otMsg}${earlyMsg}${reasonText ? ` • Reason: ${reasonText}` : ""}`);
      dispatch(fetchEmployees());
      dispatch(fetchAttendance({ employeeId: isEmployee ? (myEmployeeId || undefined) : undefined }));
      if (onAttendanceChanged) onAttendanceChanged();
    } catch (err) {
      console.error("Error in executePunchOut:", err);
      toast.error(typeof err === "string" ? err : (err?.message || "Failed to punch out"));
    } finally {
      setPunchLoading(false);
    }
  };

  const handleConfirmLatePunchOut = () => {
    const inDate = new Date(effectiveCheckIn);
    const [hrs, mins] = customOutTime.split(":").map(Number);
    const targetOutDate = new Date(inDate);
    targetOutDate.setHours(hrs || 18, mins || 15, 0, 0);

    const reasonSummary = customReasonNote ? `${punchOutReason} - ${customReasonNote}` : punchOutReason;
    executePunchOut(targetOutDate.toISOString(), reasonSummary);
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
        {/* Top Mini Tiles: Punch In, Out & Hours */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">Punch In:</span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white mt-1 block truncate">
              {punchInTimeFormatted}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">Punch Out:</span>
            <span className={`text-xs sm:text-sm font-black mt-1 block truncate ${punchOutTimeFormatted !== "—" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
              {punchOutTimeFormatted}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold text-slate-400 block leading-tight">Total Hours:</span>
            <span className="text-xs sm:text-sm font-black font-mono text-sky-600 dark:text-sky-400 mt-1 block">
              {totalHoursFormatted}
            </span>
          </div>
        </div>

        {/* Break Details Metric Strip */}
        <div className="grid grid-cols-2 gap-2.5 bg-white dark:bg-slate-900/90 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Coffee className="size-3 text-amber-500" /> Last Break:
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 block truncate">
              {lastBreakIn ? `${lastBreakIn}${lastBreakOut ? ` - ${lastBreakOut}` : " (Active)"}` : "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="size-3 text-indigo-500" /> Total Break Time:
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5 block font-mono">
              {breakTimerFormatted} <span className="text-[10px] font-normal text-slate-400">({breakCount} {breakCount === 1 ? "break" : "breaks"})</span>
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
                onClick={handlePunchOutClick}
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
                onClick={handlePunchOutClick}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl h-11 shadow-sm gap-1.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-95"
              >
                {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-current" />}
                Punch Out
              </Button>
            </div>
          )}

          {/* STATE 4: SHIFT COMPLETED -> LOCKED FOR TODAY (NEXT PUNCH IN AVAILABLE TOMORROW) */}
          {currentSessionState === "COMPLETED" && (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-center font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-extrabold text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Shift Completed for Today</span>
                </div>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400/90">
                  {todayAttendance?.totalWorkHours || totalHoursFormatted || "0"} hrs logged • Next Punch In will be available tomorrow
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Break Status */}
        {breakStartTime && (
          <div className="text-center pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-[10.5px] text-amber-600 dark:text-amber-400 font-bold block animate-pulse">
              ☕ Currently on break (Started: {lastBreakIn || "Now"} • Limit: 60 mins)
            </span>
          </div>
        )}
      </div>

      {/* Delayed / Missed Punch Out Reason Modal */}
      <Dialog open={showLatePunchOutModal} onOpenChange={setShowLatePunchOutModal}>
        <DialogContent className="max-w-md border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-white dark:bg-slate-950">
          <div className="bg-gradient-to-r from-amber-600 to-rose-700 p-5 text-white">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-200" /> Record Shift Punch Out & Reason
            </DialogTitle>
            <DialogDescription className="text-amber-100 text-xs mt-1">
              Your punch-in was recorded at {punchInTimeFormatted}. Please confirm the punch out time and reason for late punchout.
            </DialogDescription>
          </div>

          <div className="p-5 space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Punch Out Time *</Label>
              <Input
                type="time"
                value={customOutTime}
                onChange={(e) => setCustomOutTime(e.target.value)}
                className="rounded-xl h-10 bg-slate-50 dark:bg-slate-900"
              />
              <span className="text-[10px] text-slate-400">Default is regular shift departure (18:15).</span>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Reason for Late Punch Out *</Label>
              <Select value={punchOutReason} onValueChange={setPunchOutReason}>
                <SelectTrigger className="rounded-xl h-10 bg-slate-50 dark:bg-slate-900">
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Forgot to punch out yesterday">Forgot to punch out yesterday</SelectItem>
                  <SelectItem value="Outdoor / Field assignment">Outdoor / Field assignment</SelectItem>
                  <SelectItem value="System / Network downtime">System / Network downtime</SelectItem>
                  <SelectItem value="Worked continuous late shift">Worked continuous late shift</SelectItem>
                  <SelectItem value="Other">Other reason</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-700 dark:text-slate-300">Additional Remarks (Optional)</Label>
              <Input
                placeholder="e.g. Worked at client site till 6:30 PM"
                value={customReasonNote}
                onChange={(e) => setCustomReasonNote(e.target.value)}
                className="rounded-xl h-10 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          <DialogFooter className="p-5 pt-0 gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowLatePunchOutModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold gap-2 shadow-md"
              disabled={punchLoading}
              onClick={handleConfirmLatePunchOut}
            >
              {punchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-current" />}
              Confirm Punch Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
