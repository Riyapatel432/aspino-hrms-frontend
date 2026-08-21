"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarRange,
  Clock,
  Users,
  Building,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  History,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Info,
  Layers,
  RotateCcw,
  Download,
  Coffee,
  Sun,
  Moon,
  CheckCheck,
  FileSpreadsheet,
  HelpCircle,
  Briefcase,
  UserCheck,
  ShieldAlert,
  UserX,
  Repeat,
  FileText,
  Zap,
  Activity,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  fetchShifts,
  fetchRosters,
  createShift,
  updateShift,
  deleteShift,
  createRoster,
  updateRoster,
  deleteRoster,
  bulkAssignRosters,
  changeEmployeeShift,
  fetchShiftAuditLogs,
} from "@/store/slices/attendanceSlice";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { id: 1, label: "Mon", full: "Monday" },
  { id: 2, label: "Tue", full: "Tuesday" },
  { id: 3, label: "Wed", full: "Wednesday" },
  { id: 4, label: "Thu", full: "Thursday" },
  { id: 5, label: "Fri", full: "Friday" },
  { id: 6, label: "Sat", full: "Saturday" },
  { id: 0, label: "Sun", full: "Sunday" },
];

const PRESET_COLORS = [
  "#0284c7", // Sky blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#64748b", // Slate
];

const formatDateDDMMYYYY = (dateVal) => {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function HodShiftScheduleHub({
  employees = [],
  departments = [],
  currentUser = null,
}) {
  const dispatch = useDispatch();

  const {
    shifts = [],
    totalShifts = 0,
    rosters = [],
    totalRosters = 0,
    shiftAuditLogs = [],
    totalShiftAuditLogs = 0,
    loading: attLoading,
    auditLoading,
  } = useSelector((state) => state.attendance);

  // Sub tab state: "planner" | "calendar" | "matrix" | "rosters" | "history" | "masters"
  const [subTab, setSubTab] = useState("planner");

  // Global & Department Scoping
  const [selectedDeptId, setSelectedDeptId] = useState("ALL");

  // Delete Confirm Dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ----------------------------------------------------
  // 1. SCHEDULE PLANNER & BULK WIZARD STATE
  // ----------------------------------------------------
  const [plannerDeptId, setPlannerDeptId] = useState("ALL");
  const [plannerEmployeeIds, setPlannerEmployeeIds] = useState([]);
  const [plannerEmpSearch, setPlannerEmpSearch] = useState("");
  const [plannerStartDate, setPlannerStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [plannerEndDate, setPlannerEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  });
  const [plannerShiftId, setPlannerShiftId] = useState("");
  const [plannerDaysOfWeek, setPlannerDaysOfWeek] = useState([1, 2, 3, 4, 5]); // Mon-Fri default
  const [plannerReason, setPlannerReason] = useState("Weekly Department Shift Schedule");
  const [plannerSubmitting, setPlannerSubmitting] = useState(false);

  // ----------------------------------------------------
  // 2. SINGLE SHIFT CHANGE MODAL STATE
  // ----------------------------------------------------
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedRosterToChange, setSelectedRosterToChange] = useState(null);
  const [changeTargetShiftId, setChangeTargetShiftId] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [changeSubmitting, setChangeSubmitting] = useState(false);

  // Quick Direct Assign Single Modal (from calendar empty cell)
  const [showDirectAssignModal, setShowDirectAssignModal] = useState(false);
  const [directAssignEmpId, setDirectAssignEmpId] = useState("");
  const [directAssignDate, setDirectAssignDate] = useState("");
  const [directAssignShiftId, setDirectAssignShiftId] = useState("");
  const [directAssignReason, setDirectAssignReason] = useState("");

  // ----------------------------------------------------
  // 3. CALENDAR VIEW STATE
  // ----------------------------------------------------
  const [calDate, setCalDate] = useState(new Date());
  const [calDeptFilter, setCalDeptFilter] = useState("ALL");
  const [calEmpFilter, setCalEmpFilter] = useState("ALL");

  // ----------------------------------------------------
  // 4. MATRIX VIEW STATE
  // ----------------------------------------------------
  const [matrixMonth, setMatrixMonth] = useState((new Date().getMonth() + 1).toString());
  const [matrixYear, setMatrixYear] = useState(new Date().getFullYear().toString());
  const [matrixDeptFilter, setMatrixDeptFilter] = useState("ALL");
  const [matrixEmpSearch, setMatrixEmpSearch] = useState("");

  // ----------------------------------------------------
  // 5. SHIFT MASTER FORM STATE
  // ----------------------------------------------------
  const [shiftForm, setShiftForm] = useState({
    id: null,
    name: "",
    startTime: "09:00",
    endTime: "17:30",
    graceTimeMinutes: 15,
    breakDurationMinutes: 60,
    breakRules: "45 min Lunch + 15 min Tea break",
    isNightShift: false,
    color: "#0284c7",
    description: "",
  });
  const [shiftFormErrors, setShiftFormErrors] = useState({});

  // ----------------------------------------------------
  // 6. PAGINATION & SEARCH STATES
  // ----------------------------------------------------
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterRows, setRosterRows] = useState(10);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterSortBy, setRosterSortBy] = useState("date");
  const [rosterSortOrder, setRosterSortOrder] = useState("desc");

  const [shiftPage, setShiftPage] = useState(1);
  const [shiftRows, setShiftRows] = useState(10);
  const [shiftSearch, setShiftSearch] = useState("");

  const [auditPage, setAuditPage] = useState(1);
  const [auditRows, setAuditRows] = useState(10);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditDeptFilter, setAuditDeptFilter] = useState("ALL");
  const [auditEmpFilter, setAuditEmpFilter] = useState("ALL");

  // ----------------------------------------------------
  // 7. PHARMA CONTINUOUS SHIFT HANDOVER STATE
  // ----------------------------------------------------
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverRecords, setHandoverRecords] = useState([
    {
      id: "HO-2026-0801",
      date: "2026-08-21",
      productionLine: "Sterile Vial Filling Line 1 (Cleanroom B)",
      outgoingEmpName: "Ananya Sharma (ASP-001)",
      outgoingShift: "Evening Shift (14:00 - 22:30)",
      scheduledRelieverName: "Bhavin Patel (ASP-002)",
      mode: "OVERTIME_EXTENSION",
      overtimeHours: "8.5 hrs (Full Night Double Shift)",
      substituteName: "Self (Ananya Sharma)",
      gmpChecklist: "BMR Signed, Line Clearance OK, Yield Reconciled",
      hodRemarks: "Night shift reliever no-show. Continuous sterile batch operation preserved without line stoppage.",
      status: "COMPLIANT_GMP_AUDITED",
    },
    {
      id: "HO-2026-0802",
      date: "2026-08-20",
      productionLine: "Granulation Suite 3 (Oral Solid Dosage)",
      outgoingEmpName: "Chintan Parmar (ASP-003)",
      outgoingShift: "Evening Shift (14:00 - 22:30)",
      scheduledRelieverName: "Deepak Joshi (ASP-004)",
      mode: "EMERGENCY_SUBSTITUTE",
      overtimeHours: "0.5 hr Handover Overlap",
      substituteName: "Gaurav Mehta (ASP-005) [Standby Operator]",
      gmpChecklist: "Batch Logbook Handover, Machine Parameters OK",
      hodRemarks: "Reliever delayed due to transport issue. Emergency Standby Operator deployed immediately.",
      status: "COMPLIANT_GMP_AUDITED",
    },
  ]);

  const [handoverForm, setHandoverForm] = useState({
    productionLine: "Sterile Vial Filling Line 1",
    date: new Date().toISOString().split("T")[0],
    outgoingEmpId: "",
    outgoingShiftId: "",
    scheduledRelieverEmpId: "",
    incomingShiftId: "",
    mode: "OVERTIME_EXTENSION", // "OVERTIME_EXTENSION" | "EMERGENCY_SUBSTITUTE"
    overtimeHours: "8.5",
    substituteEmpId: "",
    bmrSigned: true,
    lineClearanceVerified: true,
    materialReconciled: true,
    safetyCleanroomGowned: true,
    supervisorName: "Production HOD / Shift In-Charge",
    remarks: "Reliever absent at shift transition. Continuous manufacturing handover executed under GMP Schedule M.",
  });

  // Sub-tab scoped data fetching: Only call API when corresponding subTab is active

  // 1. Shift Master Config (when subTab === "masters" or initial load for planner)
  useEffect(() => {
    if (subTab === "masters") {
      dispatch(fetchShifts({ page: shiftPage, limit: shiftRows, search: shiftSearch }));
    } else if (shifts.length === 0 || subTab === "planner" || subTab === "calendar" || subTab === "matrix") {
      dispatch(fetchShifts({ limit: 100 }));
    }
  }, [dispatch, subTab, shiftPage, shiftRows, shiftSearch]);

  // 2. Rosters (when subTab === "rosters" with server-side pagination/search, or planner/calendar/matrix)
  useEffect(() => {
    if (subTab === "rosters") {
      dispatch(
        fetchRosters({
          page: rosterPage,
          limit: rosterRows,
          search: rosterSearch,
          sortBy: rosterSortBy,
          sortOrder: rosterSortOrder,
          departmentId: selectedDeptId !== "ALL" ? selectedDeptId : undefined,
        })
      );
    } else if (subTab === "planner" || subTab === "calendar" || subTab === "matrix") {
      dispatch(fetchRosters({ limit: 1000 }));
    }
  }, [dispatch, subTab, rosterPage, rosterRows, rosterSearch, rosterSortBy, rosterSortOrder, selectedDeptId]);

  // 3. Shift Change History & Audit Logs (ONLY when subTab === "history")
  useEffect(() => {
    if (subTab === "history") {
      dispatch(
        fetchShiftAuditLogs({
          page: auditPage,
          limit: auditRows,
          search: auditSearch,
          departmentId: auditDeptFilter !== "ALL" ? auditDeptFilter : undefined,
          employeeId: auditEmpFilter !== "ALL" ? auditEmpFilter : undefined,
        })
      );
    }
  }, [dispatch, subTab, auditPage, auditRows, auditSearch, auditDeptFilter, auditEmpFilter]);

  // Set default target shift when shifts load
  useEffect(() => {
    if (shifts.length > 0 && !plannerShiftId) {
      setPlannerShiftId(String(shifts[0].id));
    }
  }, [shifts, plannerShiftId]);

  // Filtered Employees based on Department selection
  const deptEmployees = useMemo(() => {
    const list = Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : []);
    if (plannerDeptId === "ALL") return list;
    return list.filter((e) => {
      const dId = String(e.departmentId || e.department?.id || e.department || "");
      const dName = String(e.department?.name || "");
      return dId === String(plannerDeptId) || dName.toLowerCase() === String(plannerDeptId).toLowerCase();
    });
  }, [employees, plannerDeptId]);

  // Employee count mapping per department
  const deptEmployeeCounts = useMemo(() => {
    const empList = Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : []);
    const counts = { ALL: empList.length };
    (Array.isArray(departments) ? departments : []).forEach((d) => {
      counts[String(d.id)] = empList.filter((e) => {
        const dId = String(e.departmentId || e.department?.id || e.department || "");
        const dName = String(e.department?.name || "");
        return dId === String(d.id) || dName.toLowerCase() === String(d.name).toLowerCase();
      }).length;
    });
    return counts;
  }, [departments, employees]);

  // Automatically select all available employees when department or list changes
  useEffect(() => {
    if (deptEmployees.length > 0) {
      setPlannerEmployeeIds(deptEmployees.map((e) => String(e.id)));
    } else {
      setPlannerEmployeeIds([]);
    }
  }, [deptEmployees]);

  // Handle Select All / Deselect All employees in planner
  const handleSelectAllDeptEmployees = () => {
    if (plannerEmployeeIds.length === deptEmployees.length) {
      setPlannerEmployeeIds([]);
    } else {
      setPlannerEmployeeIds(deptEmployees.map((e) => String(e.id)));
    }
  };

  const handleTogglePlannerEmployee = (empId) => {
    setPlannerEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Quick Preset Date Helpers
  const handleSetPresetDates = (preset) => {
    const today = new Date();
    if (preset === "next7") {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      setPlannerStartDate(today.toISOString().split("T")[0]);
      setPlannerEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "next14") {
      const end = new Date(today);
      end.setDate(end.getDate() + 13);
      setPlannerStartDate(today.toISOString().split("T")[0]);
      setPlannerEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "thisMonth") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setPlannerStartDate(start.toISOString().split("T")[0]);
      setPlannerEndDate(end.toISOString().split("T")[0]);
    } else if (preset === "nextMonth") {
      const start = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      setPlannerStartDate(start.toISOString().split("T")[0]);
      setPlannerEndDate(end.toISOString().split("T")[0]);
    }
  };

  // Build Live Preview of Shift Schedule before submitting
  const livePlannerPreview = useMemo(() => {
    if (!plannerStartDate || !plannerEndDate || plannerEmployeeIds.length === 0 || !plannerShiftId) {
      return [];
    }

    const start = new Date(plannerStartDate);
    const end = new Date(plannerEndDate);
    if (start > end) return [];

    const targetShift = shifts.find((s) => String(s.id) === String(plannerShiftId));
    const selectedEmps = employees.filter((e) => plannerEmployeeIds.includes(String(e.id)));

    // Map existing rosters for fast lookup: `${empId}_${YYYY-MM-DD}`
    const existingRosterMap = new Map();
    rosters.forEach((r) => {
      const dateStr = typeof r.date === "string" ? r.date.split("T")[0] : new Date(r.date).toISOString().split("T")[0];
      existingRosterMap.set(`${r.employeeId}_${dateStr}`, r);
    });

    const previewList = [];
    const cur = new Date(start);

    while (cur <= end && previewList.length < 500) {
      const dayOfWeek = cur.getUTCDay();
      if (plannerDaysOfWeek.length === 0 || plannerDaysOfWeek.includes(dayOfWeek)) {
        const dateStr = cur.toISOString().split("T")[0];
        const dayName = DAYS_OF_WEEK.find((d) => d.id === dayOfWeek)?.full || "";

        selectedEmps.forEach((emp) => {
          const currentRoster = existingRosterMap.get(`${emp.id}_${dateStr}`);
          const currentShiftObj = currentRoster?.shift || (currentRoster ? shifts.find((s) => s.id === currentRoster.shiftId) : null);
          const currentShiftName = currentShiftObj ? currentShiftObj.name : "Unassigned";

          previewList.push({
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            employeeCode: emp.employeeId,
            departmentName: emp.department?.name || "General",
            date: dateStr,
            day: dayName,
            currentShift: currentShiftName,
            currentShiftObj,
            newShift: targetShift?.name || "Selected Shift",
            newShiftObj: targetShift,
            isChange: currentShiftName !== "Unassigned" && currentShiftName !== (targetShift?.name || ""),
            isNew: currentShiftName === "Unassigned",
          });
        });
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return previewList;
  }, [plannerStartDate, plannerEndDate, plannerEmployeeIds, plannerShiftId, plannerDaysOfWeek, shifts, employees, rosters]);

  // Execute Bulk Schedule Assignment
  const handleExecuteBulkAssignment = async () => {
    if (plannerEmployeeIds.length === 0) {
      toast.error("Please select at least one employee.");
      return;
    }
    if (!plannerShiftId) {
      toast.error("Please select a target shift.");
      return;
    }
    if (!plannerStartDate || !plannerEndDate) {
      toast.error("Please select start and end dates.");
      return;
    }

    setPlannerSubmitting(true);
    try {
      const payload = {
        departmentId: plannerDeptId !== "ALL" ? plannerDeptId : undefined,
        employeeIds: plannerEmployeeIds,
        shiftId: plannerShiftId,
        startDate: plannerStartDate,
        endDate: plannerEndDate,
        daysOfWeek: plannerDaysOfWeek.length > 0 ? plannerDaysOfWeek : undefined,
        reason: plannerReason || "Department shift schedule allocation",
        managedByHod: currentUser?.name || "Department HOD",
      };

      const res = await dispatch(bulkAssignRosters(payload)).unwrap();
      toast.success(res.message || "Shifts successfully scheduled!");
      
      // Refresh rosters & audit logs
      dispatch(fetchRosters({ limit: 1000 }));
      dispatch(fetchShiftAuditLogs({ page: 1, limit: auditRows }));

      // Switch to calendar or matrix view to see results
      setSubTab("calendar");
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to execute shift schedule allocation.");
    } finally {
      setPlannerSubmitting(false);
    }
  };

  // Open Single Shift Change Modal
  const handleOpenChangeModal = (rosterEntry) => {
    setSelectedRosterToChange(rosterEntry);
    setChangeTargetShiftId(rosterEntry.shiftId || "");
    setChangeReason(rosterEntry.reason || "");
    setShowChangeModal(true);
  };

  // Execute Single Shift Change
  const handleExecuteShiftChange = async (e) => {
    e.preventDefault();
    if (!selectedRosterToChange || !changeTargetShiftId) {
      toast.error("Please select a new shift.");
      return;
    }
    if (!changeReason || changeReason.trim().length < 3) {
      toast.error("Please provide a reason for the shift change.");
      return;
    }

    setChangeSubmitting(true);
    try {
      await dispatch(
        changeEmployeeShift({
          rosterId: selectedRosterToChange.id,
          data: {
            newShiftId: changeTargetShiftId,
            reason: changeReason,
            changedByName: currentUser?.name || "Department HOD",
            changedByRole: currentUser?.role?.toUpperCase() || "HOD",
          },
        })
      ).unwrap();

      toast.success("Shift changed & audit trail recorded successfully!");
      setShowChangeModal(false);
      setSelectedRosterToChange(null);
      dispatch(fetchRosters({ limit: 1000 }));
      dispatch(fetchShiftAuditLogs({ page: 1, limit: auditRows }));
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to change shift.");
    } finally {
      setChangeSubmitting(false);
    }
  };

  // Execute Direct Assign Modal (e.g. from clicking an empty day cell in calendar)
  const handleExecuteDirectAssign = async (e) => {
    e.preventDefault();
    if (!directAssignEmpId || !directAssignShiftId || !directAssignDate) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      await dispatch(
        createRoster({
          employeeId: directAssignEmpId,
          shiftId: directAssignShiftId,
          date: directAssignDate,
          reason: directAssignReason || "Direct assignment by HOD",
          managedByHod: currentUser?.name || "Department HOD",
        })
      ).unwrap();

      toast.success("Shift allocated successfully!");
      setShowDirectAssignModal(false);
      dispatch(fetchRosters({ limit: 1000 }));
      dispatch(fetchShiftAuditLogs({ page: 1, limit: auditRows }));
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to allocate shift.");
    }
  };

  // Shift Master Form Submit (Create / Edit)
  const validateShiftForm = () => {
    const errs = {};
    if (!shiftForm.name.trim()) errs.name = "Shift name is required";
    if (!shiftForm.startTime) errs.startTime = "Start time is required";
    if (!shiftForm.endTime) errs.endTime = "End time is required";
    setShiftFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitShiftForm = async (e) => {
    e.preventDefault();
    if (!validateShiftForm()) return;

    try {
      const payload = {
        name: shiftForm.name,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        graceTimeMinutes: Number(shiftForm.graceTimeMinutes || 0),
        breakDurationMinutes: Number(shiftForm.breakDurationMinutes || 0),
        breakRules: shiftForm.breakRules,
        isNightShift: Boolean(shiftForm.isNightShift),
        color: shiftForm.color || "#0284c7",
        description: shiftForm.description,
      };

      if (shiftForm.id) {
        await dispatch(updateShift({ id: shiftForm.id, data: payload })).unwrap();
        toast.success("Shift master updated successfully!");
      } else {
        await dispatch(createShift(payload)).unwrap();
        toast.success("New shift master defined successfully!");
      }

      setShiftForm({
        id: null,
        name: "",
        startTime: "09:00",
        endTime: "17:30",
        graceTimeMinutes: 15,
        breakDurationMinutes: 60,
        breakRules: "45 min Lunch + 15 min Tea break",
        isNightShift: false,
        color: "#0284c7",
        description: "",
      });
      dispatch(fetchShifts({ limit: 100 }));
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to save shift master.");
    }
  };

  // ----------------------------------------------------
  // CALENDAR COMPUTATIONS
  // ----------------------------------------------------
  const calendarDays = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun
    const totalDaysInMonth = lastDay.getDate();

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding to complete 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [calDate]);

  // Filtered rosters for Calendar
  const calRosterMap = useMemo(() => {
    const map = new Map();
    rosters.forEach((r) => {
      if (!r.date) return;
      const dateStr = typeof r.date === "string" ? r.date.split("T")[0] : new Date(r.date).toISOString().split("T")[0];
      const emp = r.employee || employees.find((e) => String(e.id) === String(r.employeeId));

      // Filter by department & employee
      if (calDeptFilter !== "ALL" && String(emp?.departmentId || r.departmentId) !== String(calDeptFilter)) {
        return;
      }
      if (calEmpFilter !== "ALL" && String(r.employeeId) !== String(calEmpFilter)) {
        return;
      }

      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr).push(r);
    });
    return map;
  }, [rosters, employees, calDeptFilter, calEmpFilter]);

  // ----------------------------------------------------
  // MATRIX VIEW COMPUTATIONS
  // ----------------------------------------------------
  const matrixDaysCount = useMemo(() => {
    const y = Number(matrixYear);
    const m = Number(matrixMonth);
    return new Date(y, m, 0).getDate();
  }, [matrixYear, matrixMonth]);

  const matrixEmployees = useMemo(() => {
    let list = employees;
    if (matrixDeptFilter !== "ALL") {
      list = list.filter((e) => String(e.departmentId || e.department?.id) === String(matrixDeptFilter));
    }
    if (matrixEmpSearch && matrixEmpSearch.trim()) {
      const q = matrixEmpSearch.toLowerCase();
      list = list.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          (e.employeeId && e.employeeId.toLowerCase().includes(q))
      );
    }
    return list;
  }, [employees, matrixDeptFilter, matrixEmpSearch]);

  const matrixRosterLookup = useMemo(() => {
    const map = new Map();
    const targetY = Number(matrixYear);
    const targetM = Number(matrixMonth);

    rosters.forEach((r) => {
      if (!r.date) return;
      const d = new Date(r.date);
      if (d.getFullYear() === targetY && d.getMonth() + 1 === targetM) {
        const day = d.getDate();
        map.set(`${r.employeeId}_${day}`, r);
      }
    });
    return map;
  }, [rosters, matrixYear, matrixMonth]);

  // Export Audit Trail to CSV
  const handleExportAuditCsv = () => {
    if (shiftAuditLogs.length === 0) {
      toast.error("No shift change audit logs to export.");
      return;
    }

    const headers = "Employee Code,Employee Name,Department,Roster Date,Old Shift,New Shift,Changed By,Changed By Role,Date Changed,Reason\n";
    const rows = shiftAuditLogs
      .map((log) => {
        const emp = log.employee || employees.find((e) => e.id === log.employeeId);
        const name = emp ? `${emp.firstName} ${emp.lastName}` : "";
        const code = emp?.employeeId || "";
        const dept = emp?.department?.name || "";
        const rosterDate = log.rosterDate ? formatDateDDMMYYYY(log.rosterDate) : "";
        const changedAt = log.createdAt ? new Date(log.createdAt).toLocaleString() : "";
        return `"${code}","${name}","${dept}","${rosterDate}","${log.oldShiftName || 'Unassigned'}","${log.newShiftName}","${log.changedByName}","${log.changedByRole}","${changedAt}","${log.reason || ''}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shift_change_audit_trail_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Shift audit logs exported to CSV.");
  };

  // ----------------------------------------------------
  // DATATABLE COLUMNS
  // ----------------------------------------------------
  const rosterColumns = [
    {
      key: "employee.firstName",
      label: "Employee",
      render: (row) => {
        const emp = row.employee || employees.find((e) => String(e.id) === String(row.employeeId));
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-300 dark:border-sky-700 flex items-center justify-center font-bold text-xs text-sky-700 dark:text-sky-300">
              {emp?.firstName?.[0] || "E"}
            </div>
            <div>
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs block">
                {emp ? `${emp.firstName} ${emp.lastName}` : row.employeeId || "-"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{emp?.employeeId || ""}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "department.name",
      label: "Department",
      render: (row) => {
        const emp = row.employee || employees.find((e) => String(e.id) === String(row.employeeId));
        const deptName = row.department?.name || emp?.department?.name || "General";
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {deptName}
          </span>
        );
      },
    },
    {
      key: "shift.name",
      label: "Assigned Shift",
      render: (row) => {
        const shiftObj = row.shift || shifts.find((s) => String(s.id) === String(row.shiftId));
        const shiftColor = shiftObj?.color || "#0284c7";
        return (
          <div className="space-y-1">
            <span
              className="font-black text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 border"
              style={{
                backgroundColor: `${shiftColor}15`,
                color: shiftColor,
                borderColor: `${shiftColor}40`,
              }}
            >
              {shiftObj?.isNightShift && <Moon className="w-3 h-3 text-indigo-400" />}
              {shiftObj?.name || row.shiftId || "General"}
            </span>
            {shiftObj?.startTime && shiftObj?.endTime && (
              <span className="text-[10px] text-slate-400 block font-mono">
                {shiftObj.startTime} - {shiftObj.endTime} (Grace: {shiftObj.graceTimeMinutes || 15}m)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "date",
      label: "Roster Date",
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
            {formatDateDDMMYYYY(row.date)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {new Date(row.date).toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        </div>
      ),
    },
    {
      key: "reason",
      label: "Shift Reason",
      render: (row) => (
        <span className="text-[11px] text-slate-500 italic max-w-xs truncate block" title={row.reason || "Standard allocation"}>
          {row.reason || "Standard allocation"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChangeModal(row)}
            className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50"
            title="Change Shift with Reason"
          >
            <RotateCcw className="w-3 h-3 text-sky-500" />
            Change Shift
          </Button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: `roster on ${formatDateDDMMYYYY(row.date)}`, type: "roster", label: "Shift Roster" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
            title="Delete Roster"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const shiftMasterColumns = [
    {
      key: "name",
      label: "Shift Name",
      render: (row) => {
        const color = row.color || "#0284c7";
        return (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 border"
              style={{ backgroundColor: color, borderColor: `${color}80` }}
            />
            <div>
              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs block flex items-center gap-1.5">
                {row.name}
                {row.isNightShift && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-indigo-400 text-indigo-500 gap-0.5">
                    <Moon className="w-2.5 h-2.5" /> Night
                  </Badge>
                )}
              </span>
              {row.description && <span className="text-[10px] text-slate-400">{row.description}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: "startTime",
      label: "Timing",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
          {row.startTime} - {row.endTime}
        </span>
      ),
    },
    {
      key: "graceTimeMinutes",
      label: "Grace Time",
      render: (row) => (
        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          {row.graceTimeMinutes || 15} mins
        </span>
      ),
    },
    {
      key: "breakRules",
      label: "Break Rules & Duration",
      render: (row) => (
        <div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
            <Coffee className="w-3 h-3 text-amber-500" />
            {row.breakDurationMinutes || 60} mins total
          </span>
          <span className="text-[10px] text-slate-400">{row.breakRules || "Standard 1hr lunch break"}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setShiftForm({
                id: row.id,
                name: row.name,
                startTime: row.startTime,
                endTime: row.endTime,
                graceTimeMinutes: row.graceTimeMinutes || 15,
                breakDurationMinutes: row.breakDurationMinutes || 60,
                breakRules: row.breakRules || "45 min Lunch + 15 min Tea break",
                isNightShift: !!row.isNightShift,
                color: row.color || "#0284c7",
                description: row.description || "",
              });
              setSubTab("masters");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-all"
            title="Edit Shift"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: `shift "${row.name}"`, type: "shift", label: "Shift Master" })}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
            title="Delete Shift"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const auditColumns = [
    {
      key: "employee.firstName",
      label: "Employee",
      render: (row) => {
        const emp = row.employee || employees.find((e) => String(e.id) === String(row.employeeId));
        return (
          <div>
            <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs block">
              {emp ? `${emp.firstName} ${emp.lastName}` : row.employeeId || "-"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{emp?.employeeId || ""}</span>
          </div>
        );
      },
    },
    {
      key: "rosterDate",
      label: "Roster Date",
      render: (row) => (
        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
          {formatDateDDMMYYYY(row.rosterDate)}
        </span>
      ),
    },
    {
      key: "oldShiftName",
      label: "Shift Transition",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 line-through">
            {row.oldShiftName || "Unassigned"}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {row.newShiftName}
          </span>
        </div>
      ),
    },
    {
      key: "changedByName",
      label: "Changed By (HOD)",
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-sky-500" />
            {row.changedByName}
          </span>
          <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            {row.changedByRole || "HOD"}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Timestamp",
      render: (row) => (
        <span className="text-[10.5px] text-slate-400 font-mono">
          {new Date(row.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "reason",
      label: "Reason for Change",
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 italic bg-amber-50/60 dark:bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40 block max-w-xs">
          "{row.reason || "Shift reallocated"}"
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOP HEADER & STATS BANNER */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5 text-sky-200" />
              <span>HOD & Department Shift Workspace</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Shift Schedule Management</h2>
            <p className="text-sky-100 text-xs mt-1 max-w-xl">
              Control department rosters, bulk schedule weekly & monthly rotations, explore interactive calendar, and track every shift change in the audit trail.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setSubTab("planner")}
              className={`rounded-2xl font-bold text-xs h-10 px-4 gap-1.5 shadow-sm transition-all ${
                subTab === "planner" ? "bg-white text-sky-700 hover:bg-sky-50" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Schedule Planner
            </Button>
            <Button
              type="button"
              onClick={() => setSubTab("history")}
              className={`rounded-2xl font-bold text-xs h-10 px-4 gap-1.5 shadow-sm transition-all ${
                subTab === "history" ? "bg-white text-sky-700 hover:bg-sky-50" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <History className="w-4 h-4" />
              Audit Trail ({totalShiftAuditLogs})
            </Button>
          </div>
        </div>

        {/* STATS TILES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
            <span className="text-[11px] text-sky-200 font-bold block">Defined Shifts</span>
            <span className="text-xl font-black">{totalShifts}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
            <span className="text-[11px] text-sky-200 font-bold block">Active Roster Entries</span>
            <span className="text-xl font-black">{totalRosters}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
            <span className="text-[11px] text-sky-200 font-bold block">Total Employees</span>
            <span className="text-xl font-black">{employees.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
            <span className="text-[11px] text-sky-200 font-bold block">Shift Change Audits</span>
            <span className="text-xl font-black">{totalShiftAuditLogs}</span>
          </div>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto shadow-sm">
        {[
          { id: "planner", label: "HOD Schedule Planner", icon: Sparkles },
          { id: "calendar", label: "Interactive Calendar", icon: CalendarIcon },
          { id: "matrix", label: "Department Shift Matrix", icon: Layers },
          { id: "handover", label: "Pharma Continuous Handover & Reliever", icon: ShieldAlert, badge: "GMP Critical" },
          { id: "rosters", label: "All Rosters Table", icon: CalendarRange },
          { id: "history", label: "Shift Change History & Audit", icon: History },
          { id: "masters", label: "Shift Master Config", icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${isActive ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUB-VIEW 1: HOD SCHEDULE PLANNER & BULK WIZARD      */}
      {/* ---------------------------------------------------- */}
      {subTab === "planner" && (
        <div className="space-y-6">
          {/* TOP STEP CONFIGURATION ROW (2 BALANCED COLUMNS) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* STEP 1: SCOPE & EMPLOYEE SELECTION */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      1
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-white text-sm">Select Scope & Employees</h3>
                      <p className="text-[11px] text-slate-400">Choose department and select target personnel</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800">
                    {plannerEmployeeIds.length} of {deptEmployees.length} Selected
                  </Badge>
                </div>

                {/* Department Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-sky-500" />
                    Target Department
                  </Label>
                  <Select
                    value={plannerDeptId}
                    onValueChange={(val) => {
                      setPlannerDeptId(val);
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="ALL">
                        All Departments (Organization-wide) ({deptEmployeeCounts["ALL"] || 0} employees)
                      </SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name} ({deptEmployeeCounts[String(d.id)] || 0} employees)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee Selection List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Department Employees</Label>
                    <button
                      type="button"
                      onClick={handleSelectAllDeptEmployees}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      {plannerEmployeeIds.length === deptEmployees.length && deptEmployees.length > 0 ? "Deselect All" : "Select All Department"}
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
                    <Input
                      placeholder="Search employees by name or code..."
                      value={plannerEmpSearch}
                      onChange={(e) => setPlannerEmpSearch(e.target.value)}
                      className="h-9 pl-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1 p-1.5 border rounded-2xl dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    {deptEmployees
                      .filter((e) =>
                        `${e.firstName || ""} ${e.lastName || ""}`.toLowerCase().includes(plannerEmpSearch.toLowerCase()) ||
                        (e.employeeId && String(e.employeeId).toLowerCase().includes(plannerEmpSearch.toLowerCase()))
                      )
                      .map((emp) => {
                        const isSelected = plannerEmployeeIds.includes(String(emp.id));
                        return (
                          <div
                            key={emp.id}
                            onClick={() => handleTogglePlannerEmployee(String(emp.id))}
                            className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-all ${
                              isSelected
                                ? "bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 font-bold text-sky-900 dark:text-sky-200 shadow-xs"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <Checkbox checked={isSelected} onCheckedChange={() => handleTogglePlannerEmployee(String(emp.id))} />
                            <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 flex items-center justify-center font-extrabold text-[10px]">
                              {(emp.firstName || "E")[0]}
                            </div>
                            <div className="truncate flex-1">
                              <span className="block truncate font-bold text-slate-800 dark:text-slate-200">
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {emp.employeeId} {emp.department?.name ? `• ${emp.department.name}` : ""}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    {deptEmployees.length === 0 && (
                      <div className="text-center py-6 px-3 space-y-2">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          No employees assigned to this department.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Click below to show all active employees:
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPlannerDeptId("ALL")}
                          className="h-8 text-xs font-bold rounded-xl border-sky-300 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950 mt-1 cursor-pointer"
                        >
                          Switch to All Departments ({deptEmployeeCounts["ALL"] || 0} employees)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: DATES, PATTERN & SHIFT ASSIGNMENT */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 dark:text-white text-sm">Date Range & Shift Assignment</h3>
                      <p className="text-[11px] text-slate-400">Define effective schedule timeframe & target shift</p>
                    </div>
                  </div>
                </div>

                {/* Date Presets */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetPresetDates("next7")}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-950/80 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Next 7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDates("next14")}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-950/80 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Next 14 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDates("thisMonth")}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-950/80 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPresetDates("nextMonth")}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-950/80 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Next Month
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">From Date</Label>
                    <DateTimePicker type="date" date={plannerStartDate} setDate={(val) => setPlannerStartDate(val)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">To Date</Label>
                    <DateTimePicker type="date" date={plannerEndDate} setDate={(val) => setPlannerEndDate(val)} />
                  </div>
                </div>

                {/* Day of Week Filter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Days of Week</Label>
                    <span className="text-[10px] text-slate-400 font-medium">Click to include/exclude</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((d) => {
                      const isChecked = plannerDaysOfWeek.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setPlannerDaysOfWeek((prev) =>
                              prev.includes(d.id) ? prev.filter((id) => id !== d.id) : [...prev, d.id]
                            );
                          }}
                          className={`h-9 rounded-xl font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer ${
                            isChecked
                              ? "bg-sky-500 text-white shadow-sm ring-2 ring-sky-300 dark:ring-sky-700"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Shift Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    Target Shift Master
                  </Label>
                  <Select value={plannerShiftId} onValueChange={(val) => setPlannerShiftId(val)}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Select Target Shift" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {shifts.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color || "#0284c7" }} />
                            <span className="font-bold">{s.name}</span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              ({s.startTime} - {s.endTime})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shift Change Reason */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Reason for Allocation / Change
                  </Label>
                  <Input
                    placeholder="e.g. Regular monthly schedule, Project ramp-up, Rotational shift"
                    value={plannerReason}
                    onChange={(e) => setPlannerReason(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: LIVE SCHEDULE PREVIEW & ALLOCATION MATRIX */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  3
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Live Schedule Preview & Verification
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review shift assignments and verify old schedule overwrites before committing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-xs font-bold px-3 py-1">
                  {livePlannerPreview.length} Total Shift Slots
                </Badge>

                <Button
                  type="button"
                  onClick={handleExecuteBulkAssignment}
                  disabled={plannerSubmitting || plannerEmployeeIds.length === 0 || !plannerShiftId || livePlannerPreview.length === 0}
                  className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl h-10 px-5 shadow-md gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {plannerSubmitting ? "Allocating Shifts..." : `Confirm & Allocate Shifts (${livePlannerPreview.length} slots)`}
                </Button>
              </div>
            </div>

            {livePlannerPreview.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-3xl dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                  <CalendarRange className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No Shift Preview Generated</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Select one or more employees in <strong>Step 1</strong> and configure your date range & target shift in <strong>Step 2</strong> above to preview the generated roster table.
                </p>
              </div>
            ) : (
              <div className="border rounded-2xl dark:border-slate-800 overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b dark:border-slate-800 z-10">
                      <tr>
                        <th className="p-3 font-extrabold text-slate-600 dark:text-slate-300">Employee</th>
                        <th className="p-3 font-extrabold text-slate-600 dark:text-slate-300">Roster Date</th>
                        <th className="p-3 font-extrabold text-slate-600 dark:text-slate-300">Current Assigned Shift</th>
                        <th className="p-3 font-extrabold text-slate-600 dark:text-slate-300">New Target Shift</th>
                        <th className="p-3 font-extrabold text-slate-600 dark:text-slate-300">Action Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {livePlannerPreview.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{row.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{row.employeeCode} ({row.departmentName})</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block">{formatDateDDMMYYYY(row.date)}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{row.day}</span>
                          </td>
                          <td className="p-3">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                              row.currentShift === "Unassigned"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 line-through"
                            }`}>
                              {row.currentShift}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5"
                              style={{
                                backgroundColor: `${row.newShiftObj?.color || "#0284c7"}15`,
                                color: row.newShiftObj?.color || "#0284c7",
                                borderColor: `${row.newShiftObj?.color || "#0284c7"}40`,
                              }}
                            >
                              {row.newShiftObj?.isNightShift && <Moon className="w-3 h-3 text-indigo-400" />}
                              {row.newShift}
                            </span>
                          </td>
                          <td className="p-3">
                            {row.isChange ? (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 text-[10px]">
                                Shift Change
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 text-[10px]">
                                New Assignment
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {livePlannerPreview.length > 100 && (
                  <p className="text-center py-2.5 text-xs bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-medium border-t dark:border-slate-800">
                    Showing first 100 of {livePlannerPreview.length} slots. All will be assigned upon confirmation.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-VIEW 2: INTERACTIVE SHIFT CALENDAR               */}
      {/* ---------------------------------------------------- */}
      {subTab === "calendar" && (
        <div className="space-y-4">
          {/* Calendar Header Controls */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                  className="h-8 w-8 p-0 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-extrabold text-sm px-3 text-slate-800 dark:text-white">
                  {calDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                  className="h-8 w-8 p-0 rounded-xl"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCalDate(new Date())}
                className="rounded-xl h-8 text-xs font-bold"
              >
                Today
              </Button>
            </div>

            {/* Department & Employee Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-slate-500">Dept:</Label>
                <Select value={calDeptFilter} onValueChange={setCalDeptFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl w-44 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-slate-500">Employee:</Label>
                <Select value={calEmpFilter} onValueChange={setCalEmpFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl w-48 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-56">
                    <SelectItem value="ALL">All Employees</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.firstName} {e.lastName} ({e.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-4 shadow-sm overflow-hidden">
            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <div key={day} className="text-center font-extrabold text-xs text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((item, index) => {
                const dateKey = item.date.toISOString().split("T")[0];
                const dayRosters = calRosterMap.get(dateKey) || [];
                const isToday = new Date().toISOString().split("T")[0] === dateKey;

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] rounded-2xl p-2 border transition-all flex flex-col justify-between ${
                      item.isCurrentMonth
                        ? isToday
                          ? "bg-sky-50/50 dark:bg-sky-950/30 border-sky-400 dark:border-sky-600 shadow-sm"
                          : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                        : "bg-slate-100/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/40 opacity-40"
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? "bg-sky-500 text-white shadow-sm"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {item.date.getDate()}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDirectAssignDate(dateKey);
                          setDirectAssignShiftId(shifts[0]?.id || "");
                          setDirectAssignEmpId(employees[0]?.id || "");
                          setShowDirectAssignModal(true);
                        }}
                        className="text-slate-300 hover:text-sky-500 p-0.5 rounded transition-colors"
                        title="Add Shift"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Assigned Shifts Badges */}
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-24 pr-1">
                      {dayRosters.slice(0, 4).map((r) => {
                        const shiftObj = r.shift || shifts.find((s) => String(s.id) === String(r.shiftId));
                        const emp = r.employee || employees.find((e) => String(e.id) === String(r.employeeId));
                        const shiftColor = shiftObj?.color || "#0284c7";

                        return (
                          <div
                            key={r.id}
                            onClick={() => handleOpenChangeModal(r)}
                            className="p-1 rounded-lg text-[10px] font-bold flex items-center justify-between gap-1 cursor-pointer transition-transform hover:scale-[1.02] border"
                            style={{
                              backgroundColor: `${shiftColor}15`,
                              color: shiftColor,
                              borderColor: `${shiftColor}40`,
                            }}
                            title={`Click to Change Shift: ${emp?.firstName} ${emp?.lastName} -> ${shiftObj?.name || 'General'}`}
                          >
                            <span className="truncate flex-1">
                              {emp?.firstName?.[0]}. {emp?.lastName}
                            </span>
                            <span className="text-[9px] opacity-80 shrink-0 font-mono">
                              {shiftObj?.name?.substring(0, 3) || "GEN"}
                            </span>
                          </div>
                        );
                      })}
                      {dayRosters.length > 4 && (
                        <span className="text-[9px] text-slate-400 font-bold block text-center">
                          +{dayRosters.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-VIEW 3: DEPARTMENT SHIFT MATRIX                  */}
      {/* ---------------------------------------------------- */}
      {subTab === "matrix" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Monthly Department Shift Matrix</h3>
              <p className="text-xs text-slate-400">Inline employee-by-day shift allocation matrix with quick change support.</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-slate-500">Dept:</Label>
                <Select value={matrixDeptFilter} onValueChange={setMatrixDeptFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl w-44 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="ALL">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-slate-500">Month:</Label>
                <Select value={matrixMonth} onValueChange={setMatrixMonth}>
                  <SelectTrigger className="h-8 text-xs rounded-xl w-32 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-slate-500">Year:</Label>
                <Select value={matrixYear} onValueChange={setMatrixYear}>
                  <SelectTrigger className="h-8 text-xs rounded-xl w-24 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
                  <th className="p-2.5 font-bold text-slate-600 dark:text-slate-300 text-left sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 w-48">
                    Employee ({matrixEmployees.length})
                  </th>
                  {Array.from({ length: matrixDaysCount }, (_, i) => i + 1).map((day) => (
                    <th key={day} className="p-1.5 font-bold text-slate-500 text-center min-w-[34px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {matrixEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r dark:border-slate-800">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100 block truncate">
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {emp.employeeId} {emp.department?.name ? `• ${emp.department.name}` : ""}
                      </span>
                    </td>
                    {Array.from({ length: matrixDaysCount }, (_, i) => i + 1).map((day) => {
                      const rosterEntry = matrixRosterLookup.get(`${emp.id}_${day}`);
                      const shiftObj = rosterEntry?.shift || (rosterEntry ? shifts.find((s) => s.id === rosterEntry.shiftId) : null);
                      const shiftColor = shiftObj?.color || "#0284c7";
                      const dateStr = `${matrixYear}-${String(matrixMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                      return (
                        <td key={day} className="p-1 text-center">
                          {rosterEntry ? (
                            <button
                              type="button"
                              onClick={() => handleOpenChangeModal(rosterEntry)}
                              className="w-7 h-7 rounded-lg font-black text-[10px] flex items-center justify-center mx-auto transition-transform hover:scale-110 shadow-xs border"
                              style={{
                                backgroundColor: `${shiftColor}20`,
                                color: shiftColor,
                                borderColor: `${shiftColor}60`,
                              }}
                              title={`${emp.firstName} ${emp.lastName} - ${shiftObj?.name || 'General'}\nClick to change shift`}
                            >
                              {shiftObj?.name?.[0] || "G"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setDirectAssignDate(dateStr);
                                setDirectAssignEmpId(emp.id);
                                setDirectAssignShiftId(shifts[0]?.id || "");
                                setShowDirectAssignModal(true);
                              }}
                              className="w-7 h-7 rounded-lg text-slate-300 dark:text-slate-700 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center justify-center mx-auto text-xs"
                              title={`Assign shift on ${dateStr}`}
                            >
                              -
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-VIEW 4: ALL ROSTERS TABLE                        */}
      {/* ---------------------------------------------------- */}
      {subTab === "rosters" && (
        <div className="space-y-4">
          <DataTable
            title="Shift Roster Allocations (HOD Managed)"
            lazy
            value={
              selectedDeptId === "ALL"
                ? rosters
                : rosters.filter((r) => {
                    const emp = r.employee || employees.find((e) => String(e.id) === String(r.employeeId));
                    return String(r.departmentId || emp?.departmentId) === String(selectedDeptId);
                  })
            }
            totalRecords={totalRosters}
            page={rosterPage}
            rows={rosterRows}
            loading={attLoading}
            search={rosterSearch}
            sortBy={rosterSortBy}
            sortOrder={rosterSortOrder}
            onPageChange={setRosterPage}
            onRowsChange={(r) => {
              setRosterRows(r);
              setRosterPage(1);
            }}
            onSortChange={(k, dir) => {
              setRosterSortBy(k);
              setRosterSortOrder(dir);
              setRosterPage(1);
            }}
            onSearchChange={(s) => {
              setRosterSearch(s);
              setRosterPage(1);
            }}
            columns={rosterColumns}
            emptyMessage="No shift rosters found."
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-VIEW: PHARMA CONTINUOUS SHIFT HANDOVER           */}
      {/* ---------------------------------------------------- */}
      {subTab === "handover" && (
        <div className="space-y-6">
          {/* GMP COMPLIANCE BANNER */}
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 border border-rose-800/40 rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase px-2.5 py-1">
                  Pharma GMP Protocol • Schedule M / USFDA
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2.5 py-1">
                  Continuous Line Assurance
                </Badge>
              </div>
              <h3 className="text-xl font-black tracking-tight">
                Pharma Continuous Shift Handover & Emergency Reliever Hub
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                In continuous pharmaceutical manufacturing (Cleanrooms, Sterile Vials, Solid Dosage & Packaging), <strong className="text-white">a machine or station can NEVER be left unattended</strong>. If the incoming Night Shift reliever is absent or delayed, this module instantly logs <span className="text-amber-300 font-bold">Holdover Overtime (OT Extension)</span> or initiates an <span className="text-sky-300 font-bold">Emergency Standby Reliever Swap</span> with mandatory GMP digital sign-off and audit trails.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => {
                const list = Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : []);
                setHandoverForm({
                  ...handoverForm,
                  outgoingEmpId: list[0] ? String(list[0].id) : "",
                  outgoingShiftId: shifts[1] ? String(shifts[1].id) : (shifts[0] ? String(shifts[0].id) : ""),
                  scheduledRelieverEmpId: list[1] ? String(list[1].id) : "",
                  incomingShiftId: shifts[2] ? String(shifts[2].id) : (shifts[0] ? String(shifts[0].id) : ""),
                  substituteEmpId: list[2] ? String(list[2].id) : "",
                });
                setShowHandoverModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-12 px-6 font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              + Execute Continuous Handover / Swap
            </Button>
          </div>

          {/* TWO CORE PHARMA PATHWAYS INFO TILES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pathway 1: Holdover OT */}
            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Pathway A: Holdover Shift Extension (OT)</h4>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">2nd Shift Operator Stays on Line</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                When no standby operator is available, the outgoing operator continues operating into the next shift. The system automatically credits continuous Overtime (OT 2× rate) and Night Allowance upon check-out without attendance distortion.
              </p>
            </div>

            {/* Pathway 2: Emergency Standby Substitution */}
            <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Pathway B: Emergency Standby Substitution</h4>
                  <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">Deploy Standby Operator from Pool</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                HOD assigns a qualified standby operator from the reserve pool or general shift. The system auto-updates the roster, completes the digital BMR handover checklist, and allows the 2nd shift employee to punch out cleanly.
              </p>
            </div>
          </div>

          {/* LOGBOOK & RECENT CONTINUOUS HANDOVER LOGS */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  GMP Shift Handover & Emergency Reliever Logbook
                </h4>
                <p className="text-xs text-slate-400">
                  Recorded incidents and electronic handover logs verified by HOD Production
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const headers = "Incident ID,Date,Production Line,Outgoing Operator,Outgoing Shift,Scheduled Reliever,Resolution Mode,Reliever / OT Details,GMP Checklist,HOD Remarks,Status\n";
                  const rows = handoverRecords
                    .map((r) => `"${r.id}","${r.date}","${r.productionLine}","${r.outgoingEmpName}","${r.outgoingShift}","${r.scheduledRelieverName}","${r.mode}","${r.overtimeHours} | ${r.substituteName}","${r.gmpChecklist}","${r.hodRemarks}","${r.status}"`)
                    .join("\n");
                  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `pharma_gmp_shift_handover_logbook_${new Date().toISOString().split("T")[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success("GMP Handover Logbook exported successfully.");
                }}
                className="rounded-xl h-9 text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export GMP Logbook (.CSV)
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                  <tr>
                    <th className="p-3">Incident Ref</th>
                    <th className="p-3">Date & Production Line</th>
                    <th className="p-3">Outgoing Operator</th>
                    <th className="p-3">Scheduled Reliever</th>
                    <th className="p-3">Resolution Action</th>
                    <th className="p-3">Reliever / OT Log</th>
                    <th className="p-3">HOD Sign-Off & Remarks</th>
                    <th className="p-3 text-right">GMP Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {handoverRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-sky-600 dark:text-sky-400">{r.id}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-white block">{r.productionLine}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{formatDateDDMMYYYY(r.date)}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block">{r.outgoingEmpName}</span>
                        <span className="text-[10px] text-slate-400">{r.outgoingShift}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          {r.scheduledRelieverName}
                        </span>
                        <span className="text-[10px] text-rose-500 font-medium">No-Show / Delayed</span>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={r.mode === "OVERTIME_EXTENSION" ? "outline" : "secondary"}
                          className={`text-[10px] font-bold ${
                            r.mode === "OVERTIME_EXTENSION"
                              ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300"
                          }`}
                        >
                          {r.mode === "OVERTIME_EXTENSION" ? "Holdover OT Extension" : "Emergency Standby Swap"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{r.overtimeHours}</span>
                        <span className="text-[10px] text-slate-500">{r.substituteName}</span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{r.hodRemarks}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
                          ✓ {r.gmpChecklist}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3" /> GMP Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* HANDOVER MODAL DIALOG (LANDSCAPE FORMAT) */}
          <Dialog open={showHandoverModal} onOpenChange={setShowHandoverModal}>
            <DialogContent className="w-[95vw] sm:max-w-6xl max-w-6xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
              <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 shrink-0">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        Pharma Continuous Shift Handover Protocol
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                        Electronic Line Handover, Reliever Substitution & GMP Audit Form
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-extrabold uppercase px-2.5 py-1">
                      GMP Schedule M Compliant
                    </Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-1">
                      Landscape Workflow
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const empList = Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : []);
                  const outgoingEmp = empList.find((x) => String(x.id) === String(handoverForm.outgoingEmpId));
                  const scheduledReliever = empList.find((x) => String(x.id) === String(handoverForm.scheduledRelieverEmpId));
                  const substituteEmp = empList.find((x) => String(x.id) === String(handoverForm.substituteEmpId));
                  const outShift = shifts.find((s) => String(s.id) === String(handoverForm.outgoingShiftId));

                  const newEntry = {
                    id: `HO-${new Date().getFullYear()}-${String(handoverRecords.length + 1).padStart(4, "0")}`,
                    date: handoverForm.date,
                    productionLine: handoverForm.productionLine,
                    outgoingEmpName: outgoingEmp ? `${outgoingEmp.firstName} ${outgoingEmp.lastName} (${outgoingEmp.employeeId})` : "Outgoing Operator",
                    outgoingShift: outShift ? outShift.name : "Evening Shift",
                    scheduledRelieverName: scheduledReliever ? `${scheduledReliever.firstName} ${scheduledReliever.lastName} (${scheduledReliever.employeeId})` : "Scheduled Reliever",
                    mode: handoverForm.mode,
                    overtimeHours: handoverForm.mode === "OVERTIME_EXTENSION" ? `${handoverForm.overtimeHours} hrs (Holdover OT)` : "0.5 hr Handover Overlap",
                    substituteName: handoverForm.mode === "OVERTIME_EXTENSION" ? (outgoingEmp ? `${outgoingEmp.firstName} ${outgoingEmp.lastName}` : "Self") : (substituteEmp ? `${substituteEmp.firstName} ${substituteEmp.lastName} [Standby]` : "Standby Operator"),
                    gmpChecklist: "BMR Signed, Line Clearance OK, Yield Reconciled",
                    hodRemarks: handoverForm.remarks || "Continuous Shift Handover executed under GMP Schedule M.",
                    status: "COMPLIANT_GMP_AUDITED",
                  };

                  setHandoverRecords([newEntry, ...handoverRecords]);

                  // If emergency substitute selected, update roster in system
                  if (handoverForm.mode === "EMERGENCY_SUBSTITUTE" && handoverForm.substituteEmpId && handoverForm.incomingShiftId) {
                    dispatch(
                      createRoster({
                        employeeId: handoverForm.substituteEmpId,
                        shiftId: handoverForm.incomingShiftId,
                        date: handoverForm.date,
                        notes: `GMP Continuous Handover: Substitute deployed for line ${handoverForm.productionLine}`,
                      })
                    );
                  }

                  setShowHandoverModal(false);
                  toast.success("Continuous Pharma Shift Handover logged with GMP Audit Record!");
                }}
                className="mt-4"
              >
                {/* 2-COLUMN LANDSCAPE LAYOUT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN: Line, Operators, Resolution Mode */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* 1. Production Line & Date Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                      <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-sky-500" /> Manufacturing Line / Area *
                        </Label>
                        <Select
                          value={handoverForm.productionLine}
                          onValueChange={(val) => setHandoverForm({ ...handoverForm, productionLine: val })}
                        >
                          <SelectTrigger className="h-11 text-xs font-semibold rounded-xl mt-1.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <SelectItem value="Sterile Vial Filling Line 1">Sterile Vial Filling Line 1 (Cleanroom A)</SelectItem>
                            <SelectItem value="Granulation Suite 3">Granulation Suite 3 (Oral Solid Dosage)</SelectItem>
                            <SelectItem value="Blister Packaging Line 2">Blister Packaging Line 2</SelectItem>
                            <SelectItem value="Compression Machine B">Compression Machine B</SelectItem>
                            <SelectItem value="QC Analytical HPLC Lab">QC Analytical HPLC Lab</SelectItem>
                            <SelectItem value="Warehouse Cold Chain Room">Warehouse Cold Chain Room</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-sky-500" /> Handover Date *
                        </Label>
                        <div className="mt-1.5">
                          <DateTimePicker
                            type="date"
                            date={handoverForm.date}
                            setDate={(val) => setHandoverForm({ ...handoverForm, date: val })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Outgoing Operator (2nd Shift) & Absent Reliever (3rd Shift) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Outgoing Operator Card */}
                      <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-extrabold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-sky-600" /> 1. Outgoing Operator *
                          </Label>
                          <span className="text-[9px] font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded">
                            2nd Shift (22:30)
                          </span>
                        </div>
                        <SearchableSelect
                          options={(Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : [])).map((e) => ({
                            value: String(e.id),
                            label: `${e.firstName} ${e.lastName} (${e.employeeId})`,
                            subLabel: e.department?.name ? `Department: ${e.department.name}` : undefined
                          }))}
                          value={handoverForm.outgoingEmpId}
                          onValueChange={(val) => setHandoverForm({ ...handoverForm, outgoingEmpId: val })}
                          placeholder="Search outgoing operator..."
                          searchPlaceholder="Type operator name, code, or department..."
                        />
                      </div>

                      {/* Scheduled Reliever Card */}
                      <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-extrabold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                            <UserX className="w-4 h-4 text-rose-600" /> 2. Scheduled Reliever *
                          </Label>
                          <span className="text-[9px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded">
                            No-Show / Delayed
                          </span>
                        </div>
                        <SearchableSelect
                          options={(Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : [])).map((e) => ({
                            value: String(e.id),
                            label: `${e.firstName} ${e.lastName} (${e.employeeId})`,
                            subLabel: e.department?.name ? `Department: ${e.department.name}` : undefined
                          }))}
                          value={handoverForm.scheduledRelieverEmpId}
                          onValueChange={(val) => setHandoverForm({ ...handoverForm, scheduledRelieverEmpId: val })}
                          placeholder="Search scheduled reliever..."
                          searchPlaceholder="Type reliever name, code, or department..."
                        />
                      </div>
                    </div>

                    {/* 3. Decision Strategy: Holdover OT vs Standby Reliever Swap */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                          3. Resolution Pathway (Select Option)
                        </Label>
                        <span className="text-[10px] text-slate-400 font-medium">GMP Approved Method</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Option A Card */}
                        <button
                          type="button"
                          onClick={() => setHandoverForm({ ...handoverForm, mode: "OVERTIME_EXTENSION" })}
                          className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                            handoverForm.mode === "OVERTIME_EXTENSION"
                              ? "bg-amber-50/60 dark:bg-amber-950/40 border-amber-500 shadow-md"
                              : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-500" />
                              Mode A: Holdover OT
                            </div>
                            {handoverForm.mode === "OVERTIME_EXTENSION" && (
                              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            2nd Shift operator stays back to run line with credited Overtime (OT 2×).
                          </p>
                        </button>

                        {/* Option B Card */}
                        <button
                          type="button"
                          onClick={() => setHandoverForm({ ...handoverForm, mode: "EMERGENCY_SUBSTITUTE" })}
                          className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                            handoverForm.mode === "EMERGENCY_SUBSTITUTE"
                              ? "bg-sky-50/60 dark:bg-sky-950/40 border-sky-500 shadow-md"
                              : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-black text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                              <Repeat className="w-4 h-4 text-sky-500" />
                              Mode B: Standby Swap
                            </div>
                            {handoverForm.mode === "EMERGENCY_SUBSTITUTE" && (
                              <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px] font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            Deploy qualified standby operator from reserve pool.
                          </p>
                        </button>
                      </div>

                      {/* Mode Specific Inputs */}
                      {handoverForm.mode === "OVERTIME_EXTENSION" ? (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Holdover Overtime Duration
                            </Label>
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              Auto 2× OT Wage + Full Night Present Flag
                            </span>
                          </div>
                          <Select
                            value={handoverForm.overtimeHours}
                            onValueChange={(val) => setHandoverForm({ ...handoverForm, overtimeHours: val })}
                          >
                            <SelectTrigger className="h-11 text-xs font-medium rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              <SelectItem value="2.0">2.0 Hours (Partial Holdover until 00:30 AM)</SelectItem>
                              <SelectItem value="4.0">4.0 Hours (Half-Shift Holdover until 02:30 AM)</SelectItem>
                              <SelectItem value="8.5">8.5 Hours (Full Double Shift until 07:00 AM)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Select Standby Reliever (To Take Over Line) *
                            </Label>
                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                              Auto-swaps roster & logs audit trail
                            </span>
                          </div>
                          <SearchableSelect
                            options={(Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : [])).map((e) => ({
                              value: String(e.id),
                              label: `${e.firstName} ${e.lastName} (${e.employeeId})`,
                              subLabel: `${e.department?.name || "General"} • Qualified Standby Pool`
                            }))}
                            value={handoverForm.substituteEmpId}
                            onValueChange={(val) => setHandoverForm({ ...handoverForm, substituteEmpId: val })}
                            placeholder="Search & choose qualified standby operator..."
                            searchPlaceholder="Type operator name, code, or department..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Mandatory GMP Checklist, Remarks & Sign-off Actions */}
                  <div className="lg:col-span-5 space-y-4">
                    
                    {/* 4. Mandatory GMP Handover Checklist */}
                    <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          Mandatory GMP Digital Verification
                        </Label>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                          FDA Required
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800/40 cursor-pointer hover:bg-emerald-50/50">
                          <Checkbox
                            checked={handoverForm.bmrSigned}
                            onCheckedChange={(c) => setHandoverForm({ ...handoverForm, bmrSigned: !!c })}
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Batch Record (BMR) Logbook Signed</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800/40 cursor-pointer hover:bg-emerald-50/50">
                          <Checkbox
                            checked={handoverForm.lineClearanceVerified}
                            onCheckedChange={(c) => setHandoverForm({ ...handoverForm, lineClearanceVerified: !!c })}
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Line Clearance & Cleanliness Verified</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800/40 cursor-pointer hover:bg-emerald-50/50">
                          <Checkbox
                            checked={handoverForm.materialReconciled}
                            onCheckedChange={(c) => setHandoverForm({ ...handoverForm, materialReconciled: !!c })}
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Material Yield Reconciled</span>
                        </label>

                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800/40 cursor-pointer hover:bg-emerald-50/50">
                          <Checkbox
                            checked={handoverForm.safetyCleanroomGowned}
                            onCheckedChange={(c) => setHandoverForm({ ...handoverForm, safetyCleanroomGowned: !!c })}
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Cleanroom Gowning Protocol Followed</span>
                        </label>
                      </div>
                    </div>

                    {/* 5. Remarks */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">HOD Remarks / Handover Reason *</Label>
                      <Textarea
                        value={handoverForm.remarks}
                        onChange={(e) => setHandoverForm({ ...handoverForm, remarks: e.target.value })}
                        rows={3}
                        className="text-xs rounded-xl mt-1.5 bg-white dark:bg-slate-900"
                        placeholder="Enter reason for shift extension or reliever substitution..."
                      />
                    </div>

                    {/* Digital Execution Box */}
                    <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 space-y-3">
                      <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        <span>HOD Sign-Off Status:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" /> Ready for Signature
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-rose-200/50 dark:border-rose-800/50">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowHandoverModal(false)}
                          className="rounded-xl h-11 px-5 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 px-6 text-xs font-black shadow-lg shadow-rose-600/30 cursor-pointer"
                        >
                          Sign & Execute GMP Handover
                        </Button>
                      </div>
                    </div>

                  </div>

                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-VIEW 5: SHIFT CHANGE HISTORY & AUDIT TRAIL       */}
      {/* ---------------------------------------------------- */}
      {subTab === "history" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-sky-500" />
                  Shift Change Audit Trail
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive audit logs tracking: <span className="font-bold text-slate-600 dark:text-slate-300">Changed by HOD → Old Shift → New Shift → Date/Time → Reason</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportAuditCsv}
                  className="rounded-xl border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 h-9 font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Audit CSV
                </Button>
              </div>
            </div>
          </div>

          <DataTable
            title="Shift Change Audit History"
            lazy
            value={shiftAuditLogs}
            totalRecords={totalShiftAuditLogs}
            page={auditPage}
            rows={auditRows}
            loading={auditLoading}
            search={auditSearch}
            onPageChange={setAuditPage}
            onRowsChange={(r) => {
              setAuditRows(r);
              setAuditPage(1);
            }}
            onSearchChange={(s) => {
              setAuditSearch(s);
              setAuditPage(1);
            }}
            columns={auditColumns}
            emptyMessage="No shift change audit logs recorded yet."
          />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-VIEW 6: SHIFT MASTER CONFIGURATION               */}
      {/* ---------------------------------------------------- */}
      {subTab === "masters" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shift Master Form */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" />
              {shiftForm.id ? "Edit Shift Master" : "Define Shift Master"}
            </h3>
            <form onSubmit={handleSubmitShiftForm} className="space-y-3.5" noValidate>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Shift Name</Label>
                <Input
                  placeholder="e.g. Morning Shift, Night Shift, General Shift"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
                {shiftFormErrors.name && <span className="text-rose-500 text-[10.5px] font-bold">{shiftFormErrors.name}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Start Time</Label>
                  <DateTimePicker type="time" date={shiftForm.startTime} setDate={(val) => setShiftForm({ ...shiftForm, startTime: val })} />
                  {shiftFormErrors.startTime && <span className="text-rose-500 text-[10.5px] font-bold">{shiftFormErrors.startTime}</span>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">End Time</Label>
                  <DateTimePicker type="time" date={shiftForm.endTime} setDate={(val) => setShiftForm({ ...shiftForm, endTime: val })} />
                  {shiftFormErrors.endTime && <span className="text-rose-500 text-[10.5px] font-bold">{shiftFormErrors.endTime}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Grace Time (mins)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="15"
                    value={shiftForm.graceTimeMinutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, graceTimeMinutes: Number(e.target.value) })}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Break Duration (mins)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="60"
                    value={shiftForm.breakDurationMinutes}
                    onChange={(e) => setShiftForm({ ...shiftForm, breakDurationMinutes: Number(e.target.value) })}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Break Rules</Label>
                <Input
                  placeholder="e.g. 45 min Lunch + 15 min Tea break"
                  value={shiftForm.breakRules}
                  onChange={(e) => setShiftForm({ ...shiftForm, breakRules: e.target.value })}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Color Tag Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Calendar Color Tag</Label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setShiftForm({ ...shiftForm, color: c })}
                      className={`w-6 h-6 rounded-full border transition-transform ${
                        shiftForm.color === c ? "scale-125 ring-2 ring-sky-500 ring-offset-2" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Night Shift Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="nightShiftCheck"
                  checked={shiftForm.isNightShift}
                  onCheckedChange={(checked) => setShiftForm({ ...shiftForm, isNightShift: !!checked })}
                />
                <Label htmlFor="nightShiftCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  Is Full Night Shift
                </Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-10">
                  {shiftForm.id ? "Update Shift" : "Save Shift Master"}
                </Button>
                {shiftForm.id && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setShiftForm({
                        id: null,
                        name: "",
                        startTime: "09:00",
                        endTime: "17:30",
                        graceTimeMinutes: 15,
                        breakDurationMinutes: 60,
                        breakRules: "45 min Lunch + 15 min Tea break",
                        isNightShift: false,
                        color: "#0284c7",
                        description: "",
                      })
                    }
                    className="rounded-xl h-10"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Shift Master DataTable */}
          <div className="lg:col-span-2 space-y-4">
            <DataTable
              title="Shift Master Catalog"
              lazy
              value={shifts}
              totalRecords={totalShifts}
              page={shiftPage}
              rows={shiftRows}
              loading={attLoading}
              search={shiftSearch}
              onPageChange={setShiftPage}
              onRowsChange={(r) => {
                setShiftRows(r);
                setShiftPage(1);
              }}
              onSearchChange={(s) => {
                setShiftSearch(s);
                setShiftPage(1);
              }}
              columns={shiftMasterColumns}
              emptyMessage="No shift masters defined yet."
            />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SINGLE SHIFT CHANGE MODAL                            */}
      {/* ---------------------------------------------------- */}
      <Dialog open={showChangeModal} onOpenChange={setShowChangeModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-sky-500" />
              Change Employee Shift
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provide the new shift and mandatory HOD reason for audit trail tracking.
            </DialogDescription>
          </DialogHeader>

          {selectedRosterToChange && (
            <form onSubmit={handleExecuteShiftChange} className="space-y-4 mt-2">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employee Details</span>
                <span className="font-extrabold text-sm text-slate-800 dark:text-white block">
                  {selectedRosterToChange.employee?.firstName} {selectedRosterToChange.employee?.lastName}
                </span>
                <span className="text-xs text-slate-500 font-mono block">
                  {selectedRosterToChange.employee?.employeeId} • Date: {formatDateDDMMYYYY(selectedRosterToChange.date)}
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Target New Shift</Label>
                <Select value={changeTargetShiftId} onValueChange={setChangeTargetShiftId}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectValue placeholder="Select new shift" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {shifts.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Reason for Shift Change <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  placeholder="e.g. Covering for emergency night shift, Medical request, Project requirement"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="text-xs rounded-xl min-h-[80px]"
                  required
                />
              </div>

              <DialogFooter className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowChangeModal(false)} className="rounded-xl h-10">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changeSubmitting || !changeTargetShiftId || !changeReason}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-10 gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {changeSubmitting ? "Updating..." : "Confirm Shift Change"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* DIRECT ASSIGN MODAL (FROM CALENDAR/MATRIX)           */}
      {/* ---------------------------------------------------- */}
      <Dialog open={showDirectAssignModal} onOpenChange={setShowDirectAssignModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" />
              Assign Shift for Date
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Quickly allocate a shift for an individual employee on a specific date.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteDirectAssign} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee</Label>
              <Select value={directAssignEmpId} onValueChange={setDirectAssignEmpId}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-56">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.firstName} {e.lastName} ({e.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Date</Label>
              <DateTimePicker type="date" date={directAssignDate} setDate={setDirectAssignDate} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Shift</Label>
              <Select value={directAssignShiftId} onValueChange={setDirectAssignShiftId}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Shift" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {shifts.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Reason / Notes</Label>
              <Input
                placeholder="Direct assignment by HOD"
                value={directAssignReason}
                onChange={(e) => setDirectAssignReason(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDirectAssignModal(false)} className="rounded-xl h-10">
                Cancel
              </Button>
              <Button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-10">
                Save Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            if (deleteTarget.type === "shift") {
              await dispatch(deleteShift(deleteTarget.id)).unwrap();
              toast.success("Shift master deleted successfully.");
              dispatch(fetchShifts({ limit: 100 }));
            } else if (deleteTarget.type === "roster") {
              await dispatch(deleteRoster(deleteTarget.id)).unwrap();
              toast.success("Roster entry deleted successfully.");
              dispatch(fetchRosters({ limit: 1000 }));
            }
          } catch (e) {
            console.error(e);
            toast.error("Failed to delete record.");
          } finally {
            setDeleteTarget(null);
          }
        }}
        itemName={deleteTarget?.name || "Record"}
        label={deleteTarget?.label || "Entry"}
      />
    </div>
  );
}
