"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import {
  CalendarDays,
  Clock,
  CalendarRange,
  FileCheck,
  Plus,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEmployees,
  fetchShifts,
  fetchRosters,
  fetchAttendance,
  createShift,
  deleteShift,
  createRoster,
  deleteRoster,
  createAttendance,
} from "@/redux/slices/attendanceSlice";
import {
  fetchLeaves,
  fetchLeaveMasters,
  fetchHolidays,
  createLeave,
  updateLeaveStatus,
  createHoliday,
  deleteHoliday,
  deleteLeave,
  createLeaveMaster,
  deleteLeaveMaster,
} from "@/redux/slices/leaveSlice";
import { fetchDepartments } from "@/redux/slices/recruitmentSlice";
import { toast } from "sonner";

export default function AttendanceLeavePage() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [activeLeaveTab, setActiveLeaveTab] = useState("requests");
  
  const dispatch = useDispatch();

  const {
    employees,
    shifts,
    rosters,
    attendance,
    loading: attLoading
  } = useSelector((state) => state.attendance);

  const {
    leaves,
    leaveMasters,
    holidays,
    loading: leaveLoading
  } = useSelector((state) => state.leave);

  const {
    departments,
    loading: deptLoading
  } = useSelector((state) => state.recruitment);

  const loading = attLoading || leaveLoading || deptLoading;

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchShifts());
    dispatch(fetchRosters());
    dispatch(fetchAttendance());
    dispatch(fetchLeaves());
    dispatch(fetchLeaveMasters());
    dispatch(fetchHolidays());
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Forms states
  const [newShift, setNewShift] = useState({ name: "General Shift", startTime: "09:00", endTime: "17:30" });
  const [newRoster, setNewRoster] = useState({ employeeId: "", shiftId: "", date: "" });
  const [newAtt, setNewAtt] = useState({
    employeeId: "",
    shiftId: "",
    date: new Date().toISOString().split('T')[0],
    checkIn: "09:00",
    checkOut: "17:30",
    otHours: 0,
    isHalfDay: false,
    lateHours: 0,
    earlyGoingHours: 0,
    presentDay: 1.0,
    isSundayPresent: false,
    isFullNightPresent: false,
    isHolidayPresent: false,
    captureMethod: "BIOMETRIC",
    status: "PRESENT",
  });
  const [newLeave, setNewLeave] = useState({ employeeId: "", leaveType: "Casual", startDate: "", endDate: "", reason: "" });
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });
  const [newLeaveMaster, setNewLeaveMaster] = useState({ department: "", fiscalYear: "FY26", casualLeave: 12, sickLeave: 10, earnedLeave: 15, otherLeave: 0, effectiveFrom: new Date().toISOString().split('T')[0] });
  const [balanceEmpId, setBalanceEmpId] = useState("ALL");
  const [formErrors, setFormErrors] = useState({});

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (employees.length > 0 && !newLeave.employeeId) {
      setNewLeave(prev => ({ ...prev, employeeId: employees[0].id }));
      if (balanceEmpId === "ALL") setBalanceEmpId(employees[0].id);
    }
  }, [employees]);

  // --- Validation Helpers ---
  const validateShift = () => {
    const errs = {};
    if (!newShift.name?.trim()) errs.shiftName = "Shift name is required.";
    if (!newShift.startTime) errs.startTime = "Shift start time is required.";
    if (!newShift.endTime) errs.endTime = "Shift end time is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRoster = () => {
    const errs = {};
    if (!newRoster.employeeId) errs.employeeId = "Please select an employee.";
    if (!newRoster.shiftId) errs.shiftId = "Please select a shift.";
    if (!newRoster.date) errs.date = "Roster date is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAttendance = () => {
    const errs = {};
    if (!newAtt.employeeId) errs.employeeId = "Please select an employee.";
    if (!newAtt.shiftId) errs.shiftId = "Please select a shift.";
    if (!newAtt.date) errs.date = "Attendance date is required.";
    if (!newAtt.checkIn) errs.checkIn = "In Time is required.";
    if (!newAtt.checkOut) errs.checkOut = "Out Time is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLeave = () => {
    const errs = {};
    if (!newLeave.employeeId) errs.employeeId = "Please select an employee.";
    if (!newLeave.leaveType) errs.leaveType = "Leave type is required.";
    if (!newLeave.startDate) errs.startDate = "Leave start date is required.";
    if (!newLeave.endDate) errs.endDate = "Leave end date is required.";
    if (newLeave.startDate && newLeave.endDate && new Date(newLeave.endDate) < new Date(newLeave.startDate)) {
      errs.endDate = "End date cannot be before start date.";
    }
    if (!newLeave.reason?.trim()) errs.reason = "Reason for leave is required.";
    else if (newLeave.reason.trim().length < 5) errs.reason = "Reason must be at least 5 characters.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateHoliday = () => {
    const errs = {};
    if (!newHoliday.name?.trim()) errs.holidayName = "Holiday name is required.";
    if (!newHoliday.date) errs.holidayDate = "Holiday date is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLeaveMaster = () => {
    const errs = {};
    if (!newLeaveMaster.department) errs.dept = "Department is required.";
    if (!newLeaveMaster.fiscalYear?.trim()) errs.fiscalYear = "Fiscal year is required (e.g. FY26).";
    if (newLeaveMaster.casualLeave === undefined || newLeaveMaster.casualLeave === null || newLeaveMaster.casualLeave < 0 || newLeaveMaster.casualLeave > 365) errs.casualLeave = "Casual leave days must be between 0 and 365.";
    if (newLeaveMaster.sickLeave === undefined || newLeaveMaster.sickLeave === null || newLeaveMaster.sickLeave < 0 || newLeaveMaster.sickLeave > 365) errs.sickLeave = "Sick leave days must be between 0 and 365.";
    if (newLeaveMaster.earnedLeave === undefined || newLeaveMaster.earnedLeave === null || newLeaveMaster.earnedLeave < 0 || newLeaveMaster.earnedLeave > 365) errs.earnedLeave = "Earned leave days must be between 0 and 365.";
    if (!newLeaveMaster.effectiveFrom) errs.effectiveFrom = "Effective from date is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitLeaveMaster = async (e) => {
    e.preventDefault();
    if (!validateLeaveMaster()) return;
    try {
      await dispatch(createLeaveMaster(newLeaveMaster)).unwrap();
      setNewLeaveMaster({ department: "", fiscalYear: "FY26", casualLeave: 12, sickLeave: 10, earnedLeave: 15, otherLeave: 0, effectiveFrom: new Date().toISOString().split('T')[0] });
      dispatch(fetchLeaveMasters());
      toast.success("Leave Master defined successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create leave master");
    }
  };

  const handleDeleteLeaveMaster = async (id) => {
    try {
      await dispatch(deleteLeaveMaster(id)).unwrap();
      toast.success("Leave Master deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete leave master");
    }
  };

  const handleSubmitShift = async (e) => {
    e.preventDefault();
    if (!validateShift()) return;
    try {
      if (newShift.id) {
        const res = await fetch(`${backendUrl}/staff-hrms/attendance/shifts/${newShift.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newShift.name, startTime: newShift.startTime, endTime: newShift.endTime })
        });
        if (res.ok) {
          dispatch(fetchShifts());
          setNewShift({ name: "General Shift", startTime: "09:00", endTime: "17:30" });
          toast.success("Shift updated successfully");
        } else {
          toast.error("Failed to update shift");
        }
      } else {
        await dispatch(createShift(newShift)).unwrap();
        setNewShift({ name: "General Shift", startTime: "09:00", endTime: "17:30" });
        toast.success("Shift created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(newShift.id ? "Failed to update shift" : "Failed to create shift");
    }
  };

  const handleSubmitRoster = async (e) => {
    e.preventDefault();
    if (!validateRoster()) return;
    try {
      if (newRoster.id) {
        const res = await fetch(`${backendUrl}/staff-hrms/attendance/rosters/${newRoster.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: newRoster.employeeId, shiftId: newRoster.shiftId, date: newRoster.date })
        });
        if (res.ok) {
          dispatch(fetchRosters());
          setNewRoster({ employeeId: "", shiftId: "", date: "" });
          toast.success("Roster updated successfully");
        } else {
          toast.error("Failed to update roster");
        }
      } else {
        await dispatch(createRoster(newRoster)).unwrap();
        setNewRoster({ employeeId: "", shiftId: "", date: "" });
        toast.success("Roster created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(newRoster.id ? "Failed to update roster" : "Failed to create roster");
    }
  };

  const calculateWorkHours = (inTime, outTime) => {
    if (!inTime || !outTime) return 0;
    const [inH, inM] = inTime.split(":").map(Number);
    const [outH, outM] = outTime.split(":").map(Number);
    let totalMin = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMin < 0) totalMin += 24 * 60;
    return (totalMin / 60).toFixed(1);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!validateAttendance()) return;
    try {
      const workHours = calculateWorkHours(newAtt.checkIn, newAtt.checkOut);
      const selectedShift = shifts.find(s => s.id === newAtt.shiftId);
      const payload = {
        employeeId: newAtt.employeeId,
        date: newAtt.date,
        status: newAtt.isHalfDay ? "HALFDAY" : newAtt.status,
        shiftId: newAtt.shiftId,
        shiftName: selectedShift?.name || "General Shift",
        totalWorkHours: Number(workHours),
        otHours: Number(newAtt.otHours || 0),
        lateHours: Number(newAtt.lateHours || 0),
        earlyGoingHours: Number(newAtt.earlyGoingHours || 0),
        presentDay: Number(newAtt.presentDay || 1.0),
        isHalfDay: newAtt.isHalfDay,
        isSundayPresent: newAtt.isSundayPresent,
        isFullNightPresent: newAtt.isFullNightPresent,
        isHolidayPresent: newAtt.isHolidayPresent,
        captureMethod: newAtt.captureMethod,
        checkIn: newAtt.checkIn ? `${newAtt.date}T${newAtt.checkIn}:00.000Z` : null,
        checkOut: newAtt.checkOut ? `${newAtt.date}T${newAtt.checkOut}:00.000Z` : null,
      };

      if (newAtt.id) {
        const res = await fetch(`${backendUrl}/staff-hrms/attendance/attendance/${newAtt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          dispatch(fetchAttendance());
          toast.success("Attendance updated successfully");
        } else {
          toast.error("Failed to update attendance");
        }
      } else {
        await dispatch(createAttendance(payload)).unwrap();
        toast.success("Attendance captured successfully");
      }
      
      setNewAtt({
        employeeId: "",
        shiftId: "",
        date: new Date().toISOString().split('T')[0],
        checkIn: "09:00",
        checkOut: "17:30",
        otHours: 0,
        isHalfDay: false,
        lateHours: 0,
        earlyGoingHours: 0,
        presentDay: 1.0,
        isSundayPresent: false,
        isFullNightPresent: false,
        isHolidayPresent: false,
        captureMethod: "BIOMETRIC",
        status: "PRESENT",
      });
    } catch (err) {
      console.error(err);
      toast.error(newAtt.id ? "Failed to update attendance" : "Failed to capture attendance");
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!validateLeave()) return;
    try {
      if (newLeave.id) {
        const res = await fetch(`${backendUrl}/staff-hrms/leave/leaves/${newLeave.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: newLeave.employeeId,
            leaveType: newLeave.leaveType,
            startDate: newLeave.startDate,
            endDate: newLeave.endDate,
            reason: newLeave.reason
          })
        });
        if (res.ok) {
          dispatch(fetchLeaves());
          setNewLeave({ employeeId: "", leaveType: "Casual", startDate: "", endDate: "", reason: "" });
          toast.success("Leave updated successfully");
        } else {
          toast.error("Failed to update leave");
        }
      } else {
        await dispatch(createLeave(newLeave)).unwrap();
        setNewLeave({ employeeId: "", leaveType: "Casual", startDate: "", endDate: "", reason: "" });
        toast.success("Leave applied successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(newLeave.id ? "Failed to update leave" : "Failed to apply leave");
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await dispatch(updateLeaveStatus({ id, status })).unwrap();
      toast.success(`Leave ${status.toLowerCase()} successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update leave status");
    }
  };

  const handleDeleteLeave = async (id) => {
    try {
      await dispatch(deleteLeave(id)).unwrap();
      toast.success("Leave deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete leave");
    }
  };

  const handleSubmitHoliday = async (e) => {
    e.preventDefault();
    if (!validateHoliday()) return;
    try {
      if (newHoliday.id) {
        const res = await fetch(`${backendUrl}/staff-hrms/leave/holidays/${newHoliday.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newHoliday.name, date: newHoliday.date })
        });
        if (res.ok) {
          dispatch(fetchHolidays());
          setNewHoliday({ name: "", date: "" });
          toast.success("Holiday updated successfully");
        } else {
          toast.error("Failed to update holiday");
        }
      } else {
        await dispatch(createHoliday(newHoliday)).unwrap();
        setNewHoliday({ name: "", date: "" });
        toast.success("Holiday created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(newHoliday.id ? "Failed to update holiday" : "Failed to create holiday");
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      await dispatch(deleteHoliday(id)).unwrap();
      toast.success("Holiday deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete holiday");
    }
  };

  const handleDeleteShift = async (id) => {
    try {
      await dispatch(deleteShift(id)).unwrap();
      toast.success("Shift deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete shift");
    }
  };

  const handleDeleteRoster = async (id) => {
    try {
      await dispatch(deleteRoster(id)).unwrap();
      toast.success("Roster deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete roster");
    }
  };

  const handleDeleteAttendance = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/staff-hrms/attendance/attendance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch(fetchAttendance());
        toast.success("Attendance deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete attendance");
    }
  };



  // Helper function to calculate leave days inclusive of start/end dates
  const getLeaveDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  };

  // Compute remaining balances deducted by APPROVED leaves
  const getComputedBalances = (empId) => {
    let quotas = { Casual: 0, Sick: 0, Earned: 0 };

    // Dynamically calculate quotas based on Leave Masters per department
    if (empId && empId !== "ALL") {
      const selectedEmp = employees.find(e => e.id === empId);
      if (selectedEmp && selectedEmp.department) {
        // Try to find the quota for this department (assuming FY26 as current year)
        const master = leaveMasters.find(lm => lm.department === selectedEmp.department && lm.fiscalYear === "FY26");
        if (master) {
          quotas = { Casual: master.casualLeave, Sick: master.sickLeave, Earned: master.earnedLeave };
        } else {
          quotas = { Casual: 12, Sick: 10, Earned: 15 }; // Default fallback
        }
      } else {
        quotas = { Casual: 12, Sick: 10, Earned: 15 };
      }
    } else {
      // Aggregate for ALL employees
      employees.forEach(emp => {
        const master = leaveMasters.find(lm => lm.department === emp.department && lm.fiscalYear === "FY26");
        if (master) {
          quotas.Casual += master.casualLeave;
          quotas.Sick += master.sickLeave;
          quotas.Earned += master.earnedLeave;
        } else {
          quotas.Casual += 12;
          quotas.Sick += 10;
          quotas.Earned += 15;
        }
      });
      if (employees.length === 0) quotas = { Casual: 12, Sick: 10, Earned: 15 };
    }

    const used = { Casual: 0, Sick: 0, Earned: 0 };

    leaves.forEach((l) => {
      const lEmpId = l.employeeId || l.employee?.id;
      const matchesEmp = !empId || empId === "ALL" || lEmpId === empId;
      if (matchesEmp && l.status === "APPROVED") {
        const days = getLeaveDays(l.startDate, l.endDate);
        const typeKey = l.leaveType?.toLowerCase().includes("casual") ? "Casual"
          : l.leaveType?.toLowerCase().includes("sick") ? "Sick"
          : l.leaveType?.toLowerCase().includes("earned") || l.leaveType?.toLowerCase().includes("privilege") ? "Earned"
          : "Casual";
        if (used[typeKey] !== undefined) {
          used[typeKey] += days;
        }
      }
    });

    return {
      Casual: { total: quotas.Casual, remaining: Math.max(0, quotas.Casual - used.Casual), used: used.Casual },
      Sick: { total: quotas.Sick, remaining: Math.max(0, quotas.Sick - used.Sick), used: used.Sick },
      Earned: { total: quotas.Earned, remaining: Math.max(0, quotas.Earned - used.Earned), used: used.Earned },
    };
  };

  const currentBalances = getComputedBalances(balanceEmpId);

  // DataTable column definitions
  const attendanceColumns = [
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-white text-xs block">
            {new Date(row.date).toLocaleDateString()}
          </span>
          <span className="text-[10px] text-slate-400 font-bold block">{row.shiftName || row.shift?.name || "General Shift"}</span>
        </div>
      ),
    },
    {
      key: "employee.firstName",
      label: "Employee",
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-xs block">
            {row.employee?.firstName} {row.employee?.lastName}
          </span>
          <span className="text-[10px] text-slate-400">{row.employee?.employeeId}</span>
        </div>
      ),
    },
    {
      key: "checkIn",
      label: "In / Out Time",
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="text-slate-700 dark:text-slate-300 block font-mono">
            In: {row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
          </span>
          <span className="text-slate-500 block font-mono">
            Out: {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
          </span>
        </div>
      ),
    },
    {
      key: "totalWorkHours",
      label: "Work Hrs / OT",
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="font-extrabold text-slate-800 dark:text-white block">
            {row.totalWorkHours ? `${row.totalWorkHours} hrs` : `${calculateWorkHours(row.checkIn ? new Date(row.checkIn).toTimeString().slice(0,5) : null, row.checkOut ? new Date(row.checkOut).toTimeString().slice(0,5) : null)} hrs`}
          </span>
          {row.otHours > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded block w-fit">
              +{row.otHours} hrs OT
            </span>
          )}
        </div>
      ),
    },
    {
      key: "lateHours",
      label: "Late / Early",
      render: (row) => (
        <div className="text-[11px] space-y-0.5">
          {row.lateHours > 0 ? (
            <span className="text-amber-600 dark:text-amber-400 font-bold block">Late: {row.lateHours}h</span>
          ) : (
            <span className="text-slate-400 block">—</span>
          )}
          {row.earlyGoingHours > 0 && (
            <span className="text-rose-500 font-bold block">Early: {row.earlyGoingHours}h</span>
          )}
        </div>
      ),
    },
    {
      key: "flags",
      label: "Attendance Flags",
      sortable: false,
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {row.isHalfDay && <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded">Half Day</span>}
          {row.isSundayPresent && <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 px-1.5 py-0.5 rounded">Sunday Pres.</span>}
          {row.isFullNightPresent && <span className="text-[9px] font-black bg-purple-100 dark:bg-purple-500/10 text-purple-800 dark:text-purple-400 px-1.5 py-0.5 rounded">Full Night</span>}
          {row.isHolidayPresent && <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 rounded">Holiday Pres.</span>}
          {!row.isHalfDay && !row.isSundayPresent && !row.isFullNightPresent && !row.isHolidayPresent && (
            <span className="text-[10px] text-slate-400">Regular</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
          row.status === "PRESENT" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
          : row.status === "LATE" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
          : row.status === "HALFDAY" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"
          : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewAtt({
                id: row.id,
                employeeId: row.employeeId,
                shiftId: row.shiftId,
                date: row.date ? new Date(row.date).toISOString().split('T')[0] : "",
                checkIn: row.checkIn ? new Date(row.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "",
                checkOut: row.checkOut ? new Date(row.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "",
                otHours: row.otHours || 0,
                isHalfDay: row.isHalfDay || false,
                lateHours: row.lateHours || 0,
                earlyGoingHours: row.earlyGoingHours || 0,
                presentDay: row.presentDay || 1.0,
                isSundayPresent: row.isSundayPresent || false,
                isFullNightPresent: row.isFullNightPresent || false,
                isHolidayPresent: row.isHolidayPresent || false,
                captureMethod: row.captureMethod || "BIOMETRIC",
                status: row.status || "PRESENT"
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAttendance(row.id)}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const rosterColumns = [
    {
      key: "employee.firstName",
      label: "Employee",
      render: (row) => (
        <span className="font-extrabold text-slate-700 dark:text-slate-200 text-xs">
          {row.employee?.firstName} {row.employee?.lastName}
        </span>
      ),
    },
    {
      key: "shift.name",
      label: "Shift",
      render: (row) => (
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block">{row.shift?.name}</span>
          <span className="text-[10px] text-slate-400">{row.shift?.startTime} - {row.shift?.endTime}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Roster Date",
      render: (row) => (
        <span className="font-black text-sky-500 bg-sky-50 dark:bg-sky-500/10/70 border border-sky-100 dark:border-sky-500/20 px-2.5 py-1 rounded-full text-xs">
          {new Date(row.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewRoster({
                id: row.id,
                employeeId: row.employeeId,
                shiftId: row.shiftId,
                date: row.date ? new Date(row.date).toISOString().split('T')[0] : ""
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteRoster(row.id)}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const shiftColumns = [
    { key: "name", label: "Shift Name" },
    { key: "startTime", label: "Start Time" },
    { key: "endTime", label: "End Time" },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewShift({
                id: row.id,
                name: row.name,
                startTime: row.startTime,
                endTime: row.endTime
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteShift(row.id)}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const leaveColumns = [
    {
      key: "employee.firstName",
      label: "Employee",
      render: (row) => (
        <span className="text-xs font-extrabold text-slate-800 dark:text-white">
          {row.employee?.firstName} {row.employee?.lastName}
        </span>
      ),
    },
    {
      key: "leaveType",
      label: "Type",
      render: (row) => (
        <span className="text-xs font-bold text-sky-500">{row.leaveType}</span>
      ),
    },
    {
      key: "startDate",
      label: "Duration",
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {new Date(row.startDate).toLocaleDateString()} — {new Date(row.endDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (row) => (
        <span className="text-xs text-slate-500 italic max-w-[200px] block truncate">"{row.reason}"</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
          row.status === "APPROVED" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
          : row.status === "REJECTED" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20"
          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex gap-1.5 items-center">
          {row.status === "PENDING" && (
            <>
              <button
                onClick={() => handleUpdateLeaveStatus(row.id, "APPROVED")}
                className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-lg text-[9px] px-2 py-1 cursor-pointer transition-all"
              >
                Approve
              </button>
              <button
                onClick={() => handleUpdateLeaveStatus(row.id, "REJECTED")}
                className="bg-red-50 dark:bg-red-500/100 hover:bg-red-600 text-white font-bold rounded-lg text-[9px] px-2 py-1 cursor-pointer transition-all"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => {
              setNewLeave({
                id: row.id,
                employeeId: row.employeeId,
                leaveType: row.leaveType,
                startDate: row.startDate ? new Date(row.startDate).toISOString().split('T')[0] : "",
                endDate: row.endDate ? new Date(row.endDate).toISOString().split('T')[0] : "",
                reason: row.reason || ""
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteLeave(row.id)}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const leaveMasterColumns = [
    { key: "department", label: "Department", render: (row) => <span className="font-extrabold text-slate-800 dark:text-white">{row.department}</span> },
    { key: "fiscalYear", label: "Fiscal Year", render: (row) => <span className="text-xs font-bold text-sky-500">{row.fiscalYear}</span> },
    { key: "totalLeave", label: "Total Quota", render: (row) => <span className="text-xs font-black">{row.totalLeave} days</span> },
    {
      key: "details",
      label: "Breakdown",
      render: (row) => (
        <div className="text-[10px] text-slate-500 font-medium">
          Casual: {row.casualLeave} | Sick: {row.sickLeave} | Earned: {row.earnedLeave} | Other: {row.otherLeave}
        </div>
      ),
    },
    {
      key: "effectiveFrom",
      label: "Effective From",
      render: (row) => <span className="text-xs text-slate-500">{new Date(row.effectiveFrom).toLocaleDateString()}</span>
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => {
              setNewLeaveMaster({
                id: row.id,
                department: row.department,
                fiscalYear: row.fiscalYear,
                casualLeave: row.casualLeave,
                sickLeave: row.sickLeave,
                earnedLeave: row.earnedLeave,
                otherLeave: row.otherLeave,
                effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom).toISOString().split('T')[0] : ""
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteLeaveMaster(row.id)}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const holidayColumns = [
    { key: "name", label: "Holiday Name" },
    {
      key: "date",
      label: "Date",
      render: (row) => (
        <span className="text-xs font-extrabold text-sky-500">
          {new Date(row.date).toLocaleDateString()}
        </span>
      ),
    },

    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewHoliday({
                id: row.id,
                name: row.name,
                date: row.date ? new Date(row.date).toISOString().split('T')[0] : "",
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteHoliday(row.id)}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto">
        {[
          { id: "attendance", label: "Attendance Logs", icon: Clock },
          { id: "rosters", label: "Shift & Rosters", icon: CalendarRange },
          { id: "leaves", label: "Leave Requests", icon: FileCheck },
          { id: "holidays", label: "Holiday Configuration", icon: CalendarDays },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 font-semibold text-sm cursor-pointer whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-sky-50 dark:border-sky-500/200 text-sky-600 dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Capture Form */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-500" />
                  Capture Attendance
                </h3>
                <form onSubmit={handleSubmitAttendance} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee *</Label>
                    <Select value={newAtt.employeeId} onValueChange={(val) => {
                      setNewAtt({ ...newAtt, employeeId: val });
                      if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
                    }}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName} ({e.employeeId})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.employeeId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.employeeId}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Shift *</Label>
                      <Select value={newAtt.shiftId} onValueChange={(val) => {
                        setNewAtt({ ...newAtt, shiftId: val });
                        if (formErrors.shiftId) setFormErrors({ ...formErrors, shiftId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {shifts.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.startTime}-{s.endTime})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.shiftId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.shiftId}</span>}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Date *</Label>
                      <DateTimePicker type="date" date={newAtt.date} setDate={(val) => {
                        setNewAtt({ ...newAtt, date: val });
                        if (formErrors.date) setFormErrors({ ...formErrors, date: null });
                      }} />
                      {formErrors.date && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.date}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">In Time *</Label>
                      <DateTimePicker type="time" date={newAtt.checkIn} setDate={(val) => {
                        setNewAtt({ ...newAtt, checkIn: val });
                        if (formErrors.checkIn) setFormErrors({ ...formErrors, checkIn: null });
                      }} />
                      {formErrors.checkIn && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.checkIn}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Out Time *</Label>
                      <DateTimePicker type="time" date={newAtt.checkOut} setDate={(val) => {
                        setNewAtt({ ...newAtt, checkOut: val });
                        if (formErrors.checkOut) setFormErrors({ ...formErrors, checkOut: null });
                      }} />
                      {formErrors.checkOut && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.checkOut}</span>}
                    </div>
                  </div>

                  {/* Calculated Work Hours & OT */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <Label className="text-[11px] font-bold text-slate-500 block">Total Work Hour *</Label>
                      <span className="text-base font-black text-sky-600 dark:text-sky-400 block">
                        {calculateWorkHours(newAtt.checkIn, newAtt.checkOut)} hrs
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">OT Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        className="h-8 text-xs rounded-lg"
                        value={newAtt.otHours}
                        onChange={(e) => setNewAtt({ ...newAtt, otHours: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Late Hour & Early Going */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Late Hour</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        className="h-9 text-xs rounded-xl"
                        value={newAtt.lateHours}
                        onChange={(e) => setNewAtt({ ...newAtt, lateHours: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Early Going</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        className="h-9 text-xs rounded-xl"
                        value={newAtt.earlyGoingHours}
                        onChange={(e) => setNewAtt({ ...newAtt, earlyGoingHours: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Present Day (1.0 / 0.5)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="1"
                        className="h-9 text-xs rounded-xl"
                        value={newAtt.presentDay}
                        onChange={(e) => setNewAtt({ ...newAtt, presentDay: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Capture Method</Label>
                      <Select value={newAtt.captureMethod} onValueChange={(val) => setNewAtt({ ...newAtt, captureMethod: val })}>
<SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
<SelectValue placeholder="Select..." />
</SelectTrigger>
<SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

                        <SelectItem value="BIOMETRIC">Biometric Device Sync</SelectItem>
                        <SelectItem value="MOBILE_APP">Mobile App Check-In</SelectItem>
                        <SelectItem value="MANUAL_ADMIN">Manual HR Entry</SelectItem>
                      </SelectContent>
</Select>
                    </div>
                  </div>

                  {/* Special Attendance Checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Attendance Flags</Label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newAtt.isHalfDay}
                          onCheckedChange={(checked) => setNewAtt({ ...newAtt, isHalfDay: checked })}
                          className="mt-0.5"
                        />
                        Half Day
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newAtt.isSundayPresent}
                          onCheckedChange={(checked) => setNewAtt({ ...newAtt, isSundayPresent: checked })}
                          className="mt-0.5"
                        />
                        Sunday Present
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newAtt.isFullNightPresent}
                          onCheckedChange={(checked) => setNewAtt({ ...newAtt, isFullNightPresent: checked })}
                          className="mt-0.5"
                        />
                        Full Night Present
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={newAtt.isHolidayPresent}
                          onCheckedChange={(checked) => setNewAtt({ ...newAtt, isHolidayPresent: checked })}
                          className="mt-0.5"
                        />
                        Holiday Present
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl mt-3 h-10">
                    Save Log
                  </Button>
                </form>
              </div>

              {/* Attendance DataTable */}
              <div className="lg:col-span-2">
                <DataTable
                  title="Daily Attendance Logs"
                  data={attendance}
                  columns={attendanceColumns}
                  searchKeys={["employee.firstName", "employee.lastName", "status", "date"]}
                  emptyMessage="No attendance records logged."
                />
              </div>
            </div>
          )}

          {/* TAB 2: ROSTERS */}
          {activeTab === "rosters" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Forms Column */}
              <div className="space-y-6 h-fit">
                {/* Create Shift Master */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-500" />
                    Define Shift Master
                  </h3>
                  <form onSubmit={handleSubmitShift} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Shift Name</Label>
                      <Input
                        value={newShift.name}
                        onChange={(e) => {
                          setNewShift({ ...newShift, name: e.target.value });
                          if (formErrors.shiftName) setFormErrors({ ...formErrors, shiftName: null });
                        }}
                      />
                      {formErrors.shiftName && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.shiftName}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Start Time</Label>
                          <DateTimePicker type="time" date={newShift.startTime} setDate={(val) => {
                            setNewShift({ ...newShift, startTime: val });
                            if (formErrors.startTime) setFormErrors({ ...formErrors, startTime: null });
                          }} />
                          {formErrors.startTime && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.startTime}</span>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">End Time</Label>
                          <DateTimePicker type="time" date={newShift.endTime} setDate={(val) => {
                            setNewShift({ ...newShift, endTime: val });
                            if (formErrors.endTime) setFormErrors({ ...formErrors, endTime: null });
                          }} />
                          {formErrors.endTime && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.endTime}</span>}
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl mt-2">
                      Create Shift
                    </Button>
                  </form>
                </div>

                {/* Create Shift Roster */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-500" />
                    Assign Shift Roster
                  </h3>
                  <form onSubmit={handleSubmitRoster} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee</Label>
                      <Select value={newRoster.employeeId} onValueChange={(val) => {
                        setNewRoster({ ...newRoster, employeeId: val });
                        if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.employeeId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.employeeId}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Shift</Label>
                      <Select value={newRoster.shiftId} onValueChange={(val) => {
                        setNewRoster({ ...newRoster, shiftId: val });
                        if (formErrors.shiftId) setFormErrors({ ...formErrors, shiftId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {shifts.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.startTime} - {s.endTime})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.shiftId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.shiftId}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Roster Date</Label>
                      <DateTimePicker type="date" date={newRoster.date} setDate={(val) => {
                        setNewRoster({ ...newRoster, date: val });
                        if (formErrors.date) setFormErrors({ ...formErrors, date: null });
                      }} />
                      {formErrors.date && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.date}</span>}
                    </div>
                    <Button type="submit" className="w-full bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl mt-2">
                      Assign Roster
                    </Button>
                  </form>
                </div>
              </div>

              {/* Roster & Shifts DataTables */}
              <div className="lg:col-span-2 space-y-6">
                 <DataTable
                  title="Shift Master List"
                  data={shifts}
                  columns={shiftColumns}
                  emptyMessage="No shifts defined yet."
                />
                <DataTable
                  title="Roster Assignments"
                  data={rosters}
                  columns={rosterColumns}
                  searchKeys={["employee.firstName", "employee.lastName", "shift.name"]}
                  emptyMessage="No active rosters assigned."
                />
               
              </div>
            </div>
          )}

          {/* TAB 3: LEAVES */}
          {activeTab === "leaves" && (
            <div className="space-y-6">
              {/* Leave Sub-Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
                <button
                  onClick={() => setActiveLeaveTab("requests")}
                  className={`pb-2 font-bold text-sm transition-all border-b-2 ${activeLeaveTab === "requests" ? "border-sky-50 dark:border-sky-500/200 text-sky-600 dark:text-sky-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200"}`}
                >
                  Leave Requests & Balances
                </button>
                <button
                  onClick={() => setActiveLeaveTab("master")}
                  className={`pb-2 font-bold text-sm transition-all border-b-2 ${activeLeaveTab === "master" ? "border-sky-50 dark:border-sky-500/200 text-sky-600 dark:text-sky-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200"}`}
                >
                  Department Leave Master
                </button>
              </div>

              {activeLeaveTab === "requests" ? (
                <>
              {/* Employee Filter Header for Leave Balances */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 border dark:border-slate-800 rounded-3xl shadow-sm flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-sky-500" />
                  <span className="font-extrabold text-slate-800 dark:text-white text-sm">
                    Leave Balance Tracking & Quota Summary
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-bold text-slate-500">Filter Employee Balance:</Label>
                  <Select value={balanceEmpId} onValueChange={(val) => setBalanceEmpId(val)}>
<SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
<SelectValue placeholder="Select..." />
</SelectTrigger>
<SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

                    <SelectItem value="ALL">All Employees Aggregate</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.firstName} {e.lastName} ({e.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
</Select>
                </div>
              </div>

              {/* Dynamic Leave Balance Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Casual Leave Balance</span>
                  <div className="text-2xl font-black text-slate-800 dark:text-white">
                    {currentBalances.Casual.remaining} <span className="text-xs font-semibold text-slate-400">/ {currentBalances.Casual.total} days</span>
                  </div>
                  <span className="text-[10px] font-bold block text-emerald-500">
                    {currentBalances.Casual.used > 0 ? `${currentBalances.Casual.used} day(s) deducted from approved leave` : "Full quota available for FY26"}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Sick Leave Balance</span>
                  <div className="text-2xl font-black text-slate-800 dark:text-white">
                    {currentBalances.Sick.remaining} <span className="text-xs font-semibold text-slate-400">/ {currentBalances.Sick.total} days</span>
                  </div>
                  <span className="text-[10px] font-bold block text-emerald-500">
                    {currentBalances.Sick.used > 0 ? `${currentBalances.Sick.used} day(s) deducted from approved leave` : "Medical Certificate required >2 days"}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Earned / Privilege Leave</span>
                  <div className="text-2xl font-black text-slate-800 dark:text-white">
                    {currentBalances.Earned.remaining} <span className="text-xs font-semibold text-slate-400">/ {currentBalances.Earned.total} days</span>
                  </div>
                  <span className="text-[10px] font-bold block text-sky-500">
                    {currentBalances.Earned.used > 0 ? `${currentBalances.Earned.used} day(s) deducted from approved leave` : "Encashable at exit"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Apply Leave Form */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-500" />
                  Apply Leave (Employee behalf)
                </h3>
                <form onSubmit={handleSubmitLeave} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee</Label>
                    <Select value={newLeave.employeeId} onValueChange={(val) => {
                        setNewLeave({ ...newLeave, employeeId: val });
                        if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
                    }}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.employeeId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.employeeId}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Leave Type</Label>
                    <Select value={newLeave.leaveType} onValueChange={(val) => {
                      setNewLeave({ ...newLeave, leaveType: val });
                      if (formErrors.leaveType) setFormErrors({ ...formErrors, leaveType: null });
                    }}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:bg-slate-900">
                        <SelectItem value="Casual">Casual Leave</SelectItem>
                        <SelectItem value="Sick">Sick Leave</SelectItem>
                        <SelectItem value="Earned">Earned Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.leaveType && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.leaveType}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Start Date</Label>
                      <DateTimePicker type="date" date={newLeave.startDate} setDate={(val) => {
                        setNewLeave({ ...newLeave, startDate: val });
                        if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: null });
                      }} />
                      {formErrors.startDate && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.startDate}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">End Date</Label>
                      <DateTimePicker type="date" date={newLeave.endDate} setDate={(val) => {
                        setNewLeave({ ...newLeave, endDate: val });
                        if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: null });
                      }} />
                      {formErrors.endDate && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.endDate}</span>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Reason</Label>
                    <Textarea
                      placeholder="Reason for leave request..."
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:bg-slate-950 h-16"
                      value={newLeave.reason}
                      onChange={(e) => {
                        setNewLeave({ ...newLeave, reason: e.target.value });
                        if (formErrors.reason) setFormErrors({ ...formErrors, reason: null });
                      }}
                    />
                    {formErrors.reason && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.reason}</span>}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl mt-2">
                      {newLeave.id ? "Update Leave" : "Submit Request"}
                    </Button>
                    {newLeave.id && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl font-bold mt-2"
                        onClick={() => {
                          setNewLeave({ employeeId: employees[0]?.id || "", leaveType: "Casual", startDate: "", endDate: "", reason: "" });
                          setFormErrors({});
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              {/* Leave Applications DataTable */}
              <div className="lg:col-span-2">
                <DataTable
                  title="Leave Requests"
                  data={leaves}
                  columns={leaveColumns}
                  searchKeys={["employee.firstName", "employee.lastName", "leaveType", "status", "reason"]}
                  emptyMessage="No leave applications registered."
                />
              </div>
            </div>
                </>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Leave Master Form */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Plus className="w-5 h-5 text-sky-500" />
                      Define Leave Master
                    </h3>
                    <form onSubmit={handleSubmitLeaveMaster} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Department</Label>
                          <Select value={newLeaveMaster.department} onValueChange={(val) => {
                            setNewLeaveMaster({ ...newLeaveMaster, department: val });
                            if (formErrors.dept) setFormErrors({ ...formErrors, dept: null });
                          }}>
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              {departments.map(d => (
                                <SelectItem key={d.id} value={String(d.name)}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.dept && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.dept}</span>}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Fiscal Year</Label>
                          <Select value={newLeaveMaster.fiscalYear} onValueChange={(val) => {
                            setNewLeaveMaster({ ...newLeaveMaster, fiscalYear: val });
                            if (formErrors.fiscalYear) setFormErrors({ ...formErrors, fiscalYear: null });
                          }}>
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              <SelectItem value="FY24">FY24</SelectItem>
                              <SelectItem value="FY25">FY25</SelectItem>
                              <SelectItem value="FY26">FY26</SelectItem>
                              <SelectItem value="FY27">FY27</SelectItem>
                              <SelectItem value="FY28">FY28</SelectItem>
                            </SelectContent>
                          </Select>
                          {formErrors.fiscalYear && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.fiscalYear}</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Casual Leave</Label>
                          <Input type="number" value={newLeaveMaster.casualLeave} onChange={(e) => {
                            setNewLeaveMaster({ ...newLeaveMaster, casualLeave: Number(e.target.value) });
                            if (formErrors.casualLeave) setFormErrors({ ...formErrors, casualLeave: null });
                          }} />
                          {formErrors.casualLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.casualLeave}</span>}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Sick Leave</Label>
                          <Input type="number" value={newLeaveMaster.sickLeave} onChange={(e) => {
                            setNewLeaveMaster({ ...newLeaveMaster, sickLeave: Number(e.target.value) });
                            if (formErrors.sickLeave) setFormErrors({ ...formErrors, sickLeave: null });
                          }} />
                          {formErrors.sickLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.sickLeave}</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Earned Leave</Label>
                          <Input type="number" value={newLeaveMaster.earnedLeave} onChange={(e) => {
                            setNewLeaveMaster({ ...newLeaveMaster, earnedLeave: Number(e.target.value) });
                            if (formErrors.earnedLeave) setFormErrors({ ...formErrors, earnedLeave: null });
                          }} />
                          {formErrors.earnedLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.earnedLeave}</span>}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Other Leave</Label>
                          <Input type="number" value={newLeaveMaster.otherLeave} onChange={(e) => setNewLeaveMaster({ ...newLeaveMaster, otherLeave: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Effective From</Label>
                        <DateTimePicker type="date" date={newLeaveMaster.effectiveFrom} setDate={(val) => {
                          setNewLeaveMaster({ ...newLeaveMaster, effectiveFrom: val });
                          if (formErrors.effectiveFrom) setFormErrors({ ...formErrors, effectiveFrom: null });
                        }} />
                        {formErrors.effectiveFrom && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.effectiveFrom}</span>}
                      </div>
                      <Button type="submit" className="w-full bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl mt-2">Save Master</Button>
                    </form>
                  </div>
                  {/* Leave Master DataTable */}
                  <div className="lg:col-span-2">
                    <DataTable
                      title="Department Leave Master"
                      data={leaveMasters}
                      columns={leaveMasterColumns}
                      searchKeys={["department", "fiscalYear"]}
                      emptyMessage="No leave master configured."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HOLIDAYS */}
          {activeTab === "holidays" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-500" />
                  Configure Holiday
                </h3>
                <form onSubmit={handleSubmitHoliday} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Holiday Name</Label>
                    <Input
                      placeholder="e.g. Christmas Day"
                      value={newHoliday.name}
                      onChange={(e) => {
                        setNewHoliday({ ...newHoliday, name: e.target.value });
                        if (formErrors.holidayName) setFormErrors({ ...formErrors, holidayName: null });
                      }}
                    />
                    {formErrors.holidayName && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.holidayName}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Date</Label>
                    <DateTimePicker type="date" date={newHoliday.date} setDate={(val) => {
                      setNewHoliday({ ...newHoliday, date: val });
                      if (formErrors.holidayDate) setFormErrors({ ...formErrors, holidayDate: null });
                    }} />
                    {formErrors.holidayDate && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.holidayDate}</span>}
                  </div>
                  <Button type="submit" className="w-full bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl mt-2">
                    Save Holiday
                  </Button>
                </form>
              </div>

              {/* Holiday DataTable */}
              <div className="lg:col-span-2">
                <DataTable
                  title="Corporate Holiday Calendar"
                  data={holidays}
                  columns={holidayColumns}
                  searchKeys={["name"]}
                  emptyMessage="No holidays configured."
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
