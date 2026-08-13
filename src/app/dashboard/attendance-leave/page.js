"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui/data-table";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock,
  CalendarRange,
  FileCheck,
  Plus,
  Loader2,
  Trash2,
  Edit,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  X,
  Grid,
  List,
  Search,
  RefreshCw,
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
  bulkImportAttendance,
} from "@/features/attendance/store/attendanceSlice";
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
} from "@/features/leave/store/leaveSlice";
import { fetchDepartments } from "@/features/recruitment/store/recruitmentSlice";
import { toast } from "sonner";

export default function AttendanceLeavePage() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [activeLeaveTab, setActiveLeaveTab] = useState("requests");
  
  const dispatch = useDispatch();

  const {
    employees,
    shifts,
    totalShifts = 0,
    rosters,
    totalRosters = 0,
    attendance,
    totalAttendance = 0,
    loading: attLoading
  } = useSelector((state) => state.attendance);

  const {
    leaves,
    totalLeaves = 0,
    leaveMasters,
    totalLeaveMasters = 0,
    holidays,
    totalHolidays = 0,
    loading: leaveLoading
  } = useSelector((state) => state.leave);

  const {
    departments,
    loading: deptLoading
  } = useSelector((state) => state.recruitment);

  // Per-table loading — prevents cross-table loading interference
  const attTableLoading = attLoading;
  const leaveTableLoading = leaveLoading;
  const loading = attLoading || leaveLoading || deptLoading;

  // Pagination states
  const [attPage, setAttPage] = useState(1);
  const [attRows, setAttRows] = useState(10);
  const [attSearch, setAttSearch] = useState("");
  const [attSortBy, setAttSortBy] = useState("date");
  const [attSortOrder, setAttSortOrder] = useState("desc");

  const [shiftPage, setShiftPage] = useState(1);
  const [shiftRows, setShiftRows] = useState(10);
  const [shiftSearch, setShiftSearch] = useState("");
  const [shiftSortBy, setShiftSortBy] = useState("name");
  const [shiftSortOrder, setShiftSortOrder] = useState("asc");

  const [rosterPage, setRosterPage] = useState(1);
  const [rosterRows, setRosterRows] = useState(10);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterSortBy, setRosterSortBy] = useState("date");
  const [rosterSortOrder, setRosterSortOrder] = useState("desc");

  const [leavePage, setLeavePage] = useState(1);
  const [leaveRows, setLeaveRows] = useState(10);
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveSortBy, setLeaveSortBy] = useState("startDate");
  const [leaveSortOrder, setLeaveSortOrder] = useState("desc");

  const [holidayPage, setHolidayPage] = useState(1);
  const [holidayRows, setHolidayRows] = useState(10);
  const [holidaySearch, setHolidaySearch] = useState("");
  const [holidaySortBy, setHolidaySortBy] = useState("date");
  const [holidaySortOrder, setHolidaySortOrder] = useState("asc");

  // Year & Month filter states for Attendance
  const [attMonth, setAttMonth] = useState((new Date().getMonth() + 1).toString());
  const [attYear, setAttYear] = useState(new Date().getFullYear().toString());
  const [attViewMode, setAttViewMode] = useState("matrix"); // "matrix" | "list"
  const [showManualAttModal, setShowManualAttModal] = useState(false);
  const [matrixSearch, setMatrixSearch] = useState("");

  const handleExportAttendanceCsv = () => {
    const attList = Array.isArray(attendance?.data) ? attendance.data : (Array.isArray(attendance) ? attendance : []);
    if (attList.length === 0) {
      toast.error("No attendance records to export.");
      return;
    }
    const formatHHMM = (val) => {
      if (!val) return "";
      const str = String(val).trim();
      if (str.includes("T")) {
        const timePart = str.split("T")[1];
        return timePart ? timePart.substring(0, 5) : "";
      }
      return str.substring(0, 5);
    };

    const headers = "Employee Code,Employee Name,Date,Check In,Check Out,Status,OT Hours,Late Hours,Early Going Hours,Present Day\n";
    const rows = attList.map(rec => {
      const name = rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : "";
      const code = rec.employee?.employeeId || rec.employeeId || "";
      const date = rec.date ? rec.date.split('T')[0] : "";
      const checkInStr = formatHHMM(rec.checkIn);
      const checkOutStr = formatHHMM(rec.checkOut);
      return `"${code}","${name}","${date}","${checkInStr}","${checkOutStr}","${rec.status || 'PRESENT'}","${rec.otHours || 0}","${rec.lateHours || 0}","${rec.earlyGoingHours || 0}","${rec.presentDay || 1.0}"`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_export_${attYear}_${attMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Attendance exported to CSV.");
  };

  const constructMatrixData = () => {
    const targetYear = Number(attYear) || new Date().getFullYear();
    const targetMonth = attMonth === "ALL" ? (new Date().getMonth() + 1) : Number(attMonth);
    const totalDays = new Date(targetYear, targetMonth, 0).getDate();

    const empList = Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : []);
    const attList = Array.isArray(attendance?.data) ? attendance.data : (Array.isArray(attendance) ? attendance : []);

    const attMap = new Map();
    attList.forEach((rec) => {
      if (!rec.date) return;
      const dateStr = typeof rec.date === "string" ? rec.date.split("T")[0] : new Date(rec.date).toISOString().split("T")[0];
      const parts = dateStr.split("-");
      if (parts.length >= 3) {
        const recYear = parseInt(parts[0], 10);
        const recMonth = parseInt(parts[1], 10);
        const recDay = parseInt(parts[2], 10);

        if (recYear === targetYear && recMonth === targetMonth) {
          const empIdKey = rec.employeeId || rec.employee?.id;
          const empCodeKey = rec.employee?.employeeId;
          const normCode = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
          if (empIdKey) {
            attMap.set(`${empIdKey}_${recDay}`, rec);
            attMap.set(`${empIdKey.toLowerCase()}_${recDay}`, rec);
          }
          if (empCodeKey) {
            attMap.set(`${empCodeKey}_${recDay}`, rec);
            attMap.set(`${empCodeKey.toLowerCase()}_${recDay}`, rec);
            attMap.set(`${normCode(empCodeKey)}_${recDay}`, rec);
          }
        }
      }
    });

    let filteredEmpList = empList;
    if (matrixSearch && matrixSearch.trim()) {
      const q = matrixSearch.trim().toLowerCase();
      filteredEmpList = empList.filter(emp => 
        (emp.firstName && emp.firstName.toLowerCase().includes(q)) ||
        (emp.lastName && emp.lastName.toLowerCase().includes(q)) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(q)) ||
        (emp.id && emp.id.toLowerCase().includes(q))
      );
    }

    const rows = filteredEmpList.map((emp) => {
      const empCodeKey = emp.employeeId || emp.id || "";
      const normCode = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
      let totalPresent = 0;

      const daysData = {};
      for (let day = 1; day <= totalDays; day++) {
        const rec = attMap.get(`${emp.id}_${day}`) ||
                    attMap.get(`${emp.id.toLowerCase()}_${day}`) ||
                    (emp.employeeId ? attMap.get(`${emp.employeeId}_${day}`) : null) ||
                    (emp.employeeId ? attMap.get(`${emp.employeeId.toLowerCase()}_${day}`) : null) ||
                    (emp.employeeId ? attMap.get(`${normCode(emp.employeeId)}_${day}`) : null);
        if (rec) {
          const status = (rec.status || "PRESENT").toUpperCase();
          if (status === "PRESENT" || rec.isSundayPresent || rec.isHolidayPresent) {
            totalPresent += 1;
          } else if (status === "HALFDAY" || rec.isHalfDay) {
            totalPresent += 0.5;
          }
          daysData[day] = rec;
        } else {
          daysData[day] = null;
        }
      }

      return {
        employee: emp,
        employeeId: empCodeKey,
        name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || empCodeKey,
        cardNo: emp.employeeId || (emp.id ? emp.id.substring(0, 8) : "—"),
        daysData,
        totalPresent,
      };
    });

    return { totalDays, rows, targetMonthName: new Date(targetYear, targetMonth - 1, 1).toLocaleString("default", { month: "long" }) };
  };

  // Bulk Attendance Import States
  const [showBulkAttModal, setShowBulkAttModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [parsedAttRecords, setParsedAttRecords] = useState([]);
  const [importingAtt, setImportingAtt] = useState(false);
  const [importResult, setImportResult] = useState(null);


  const handleParseCsv = (text) => {
    setBulkCsvText(text);
    if (!text || !text.trim()) {
      setParsedAttRecords([]);
      return;
    }
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setParsedAttRecords([]);
      return;
    }
    
    // Dynamically inspect header line to detect column positions
    const headerCols = lines[0].split(",").map(c => c.trim().toLowerCase().replace(/^"(.*)"$/, "$1"));
    
    let codeIdx = headerCols.findIndex(h => h.includes("code") || h.includes("employee id") || h.includes("card") || h === "id");
    let dateIdx = headerCols.findIndex(h => h.includes("date"));
    let inIdx = headerCols.findIndex(h => h.includes("check in") || h.includes("in time") || h === "checkin" || h === "in");
    let outIdx = headerCols.findIndex(h => h.includes("check out") || h.includes("out time") || h === "checkout" || h === "out");
    let statusIdx = headerCols.findIndex(h => h.includes("status"));
    let otIdx = headerCols.findIndex(h => h.includes("ot"));
    let lateIdx = headerCols.findIndex(h => h.includes("late"));
    let earlyIdx = headerCols.findIndex(h => h.includes("early"));
    let presentDayIdx = headerCols.findIndex(h => h.includes("present day"));

    // Fallbacks if header matching didn't trigger
    if (codeIdx === -1) codeIdx = 0;
    if (dateIdx === -1) dateIdx = 1;
    if (inIdx === -1) inIdx = 2;
    if (outIdx === -1) outIdx = 3;
    if (statusIdx === -1) statusIdx = 4;

    // Special handling for exported CSVs where Column 1 is "Employee Name"
    if (dateIdx === 1 && (headerCols[1]?.includes("name") || headerCols[1]?.includes("employee name"))) {
      dateIdx = 2;
      inIdx = 3;
      outIdx = 4;
      statusIdx = 5;
    }

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;
      const cols = rawLine.split(",").map(c => c.trim().replace(/^"(.*)"$/, "$1"));
      if (cols.length === 0) continue;
      
      const formatTimeHHMM = (val) => {
        if (!val) return "";
        const str = String(val).trim();
        if (str.includes("T")) {
          const timePart = str.split("T")[1];
          return timePart ? timePart.substring(0, 5) : str;
        }
        return str.substring(0, 5);
      };

      const code = cols[codeIdx] || "";
      const date = cols[dateIdx] || "";
      const checkIn = formatTimeHHMM(cols[inIdx]);
      const checkOut = formatTimeHHMM(cols[outIdx]);
      const status = cols[statusIdx] || "PRESENT";
      const otHours = otIdx !== -1 && cols[otIdx] ? parseFloat(cols[otIdx]) : 0;
      const lateHours = lateIdx !== -1 && cols[lateIdx] ? parseFloat(cols[lateIdx]) : 0;
      const earlyGoingHours = earlyIdx !== -1 && cols[earlyIdx] ? parseFloat(cols[earlyIdx]) : 0;
      const presentDay = presentDayIdx !== -1 && cols[presentDayIdx] ? parseFloat(cols[presentDayIdx]) : 1.0;
      
      records.push({
        employeeCodeOrId: code,
        date,
        checkIn,
        checkOut,
        status,
        otHours: isNaN(otHours) ? 0 : otHours,
        lateHours: isNaN(lateHours) ? 0 : lateHours,
        earlyGoingHours: isNaN(earlyGoingHours) ? 0 : earlyGoingHours,
        presentDay: isNaN(presentDay) ? 1.0 : presentDay
      });
    }
    setParsedAttRecords(records);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        handleParseCsv(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkImport = async () => {
    if (parsedAttRecords.length === 0) {
      toast.error("No records found to import. Please select a valid CSV file or paste data.");
      return;
    }
    setImportingAtt(true);
    setImportResult(null);
    try {
      const res = await dispatch(bulkImportAttendance(parsedAttRecords)).unwrap();
      setImportResult(res);
      if (res.successCount > 0) {
        toast.success(`Successfully imported ${res.successCount} attendance records!`);
        let targetMonth = attMonth;
        let targetYear = attYear;
        if (parsedAttRecords.length > 0 && parsedAttRecords[0].date) {
          const rawDate = parsedAttRecords[0].date.trim();
          const dateOnly = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
          const parts = dateOnly.split(/[\/\-\s]/);
          if (parts.length === 3) {
            const p0 = parseInt(parts[0], 10);
            const p1 = parseInt(parts[1], 10);
            const p2 = parseInt(parts[2], 10);
            if (p0 > 1000) {
              targetYear = String(p0);
              targetMonth = String(p1);
            } else if (p2 > 1000 || p2 < 100) {
              targetYear = String(p2 < 100 ? 2000 + p2 : p2);
              if (p1 <= 12 && p0 <= 31) {
                targetMonth = String(p1);
              } else {
                targetMonth = String(p0);
              }
            }
          }
          setAttMonth(targetMonth);
          setAttYear(targetYear);
        }
        await dispatch(fetchAttendance({
          page: attPage,
          limit: attViewMode === "matrix" ? 1000 : attRows,
          search: attSearch,
          sortBy: attSortBy,
          sortOrder: attSortOrder,
          month: targetMonth !== "ALL" ? targetMonth : undefined,
          year: targetYear
        })).unwrap();
      }
      if (res.failureCount > 0) {
        toast.warning(`${res.failureCount} rows could not be imported. Check error report.`);
      } else {
        setShowBulkAttModal(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Bulk import failed");
    } finally {
      setImportingAtt(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/attendance/template`);
      if (!res.ok) throw new Error("Failed to fetch template");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "attendance_import_template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Attendance template downloaded successfully.");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Failed to download attendance template.");
    }
  };

  const handleDownloadAttendanceErrorReport = () => {
    if (!importResult || !importResult.errors || importResult.errors.length === 0) return;
    const headers = "Row Number,Employee ID / Code,Error Details\n";
    const rows = importResult.errors
      .map(e => `"${e.row}","${(e.employeeCodeOrId || "").replace(/"/g, '""')}","${(e.error || "").replace(/"/g, '""')}"`)
      .join("\n");
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Attendance error report sheet downloaded.");
  };

  const [dropdownShifts, setDropdownShifts] = useState([]);
  const [fiscalYearOptions, setFiscalYearOptions] = useState([]);

  useEffect(() => {
    dispatch(fetchShifts({ page: shiftPage, limit: shiftRows, search: shiftSearch, sortBy: shiftSortBy, sortOrder: shiftSortOrder }));
  }, [dispatch, shiftPage, shiftRows, shiftSearch, shiftSortBy, shiftSortOrder]);

  useEffect(() => {
    dispatch(
      fetchAttendance({
        page: attPage,
        limit: attViewMode === "matrix" ? 1000 : attRows,
        search: attSearch,
        sortBy: attSortBy,
        sortOrder: attSortOrder,
        month: attMonth !== "ALL" ? attMonth : undefined,
        year: attYear,
      })
    );
  }, [dispatch, attPage, attRows, attSearch, attSortBy, attSortOrder, attMonth, attYear, attViewMode]);

  useEffect(() => {
    dispatch(fetchRosters({ page: rosterPage, limit: rosterRows, search: rosterSearch, sortBy: rosterSortBy, sortOrder: rosterSortOrder }));
  }, [dispatch, rosterPage, rosterRows, rosterSearch, rosterSortBy, rosterSortOrder]);

  useEffect(() => {
    dispatch(fetchLeaves({ page: leavePage, limit: leaveRows, search: leaveSearch, sortBy: leaveSortBy, sortOrder: leaveSortOrder }));
  }, [dispatch, leavePage, leaveRows, leaveSearch, leaveSortBy, leaveSortOrder]);

  useEffect(() => {
    dispatch(fetchHolidays({ page: holidayPage, limit: holidayRows, search: holidaySearch, sortBy: holidaySortBy, sortOrder: holidaySortOrder }));
  }, [dispatch, holidayPage, holidayRows, holidaySearch, holidaySortBy, holidaySortOrder]);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchLeaveMasters());
    dispatch(fetchDepartments());

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${backendUrl}/staff-hrms/attendance/shifts`)
      .then(res => res.json())
      .then(data => setDropdownShifts(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch dropdown shifts:", err));

    apiFetch(`${backendUrl}/staff-hrms/recruitment/fiscal-years`)
      .then(res => res.json())
      .then(data => setFiscalYearOptions(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch fiscal years:", err));

    apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions`)
      .then(res => res.json())
      .then(data => setRequisitions(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch requisitions:", err));
  }, [dispatch]);

  const [requisitions, setRequisitions] = useState([]);

  // Forms states
  const [newShift, setNewShift] = useState({ name: "", startTime: "", endTime: "" });
  const [newRoster, setNewRoster] = useState({ employeeId: "", shiftId: "", date: "" });
  const [newAtt, setNewAtt] = useState({
    employeeId: "",
    shiftId: "",
    date: "",
    checkIn: "",
    checkOut: "",
    otHours: "",
    isHalfDay: false,
    lateHours: "",
    earlyGoingHours: "",
    presentDay: "1",
    isSundayPresent: false,
    isFullNightPresent: false,
    isHolidayPresent: false,
    captureMethod: "MANUAL_ADMIN",
    status: "PRESENT",
  });
  const [newLeave, setNewLeave] = useState({ employeeId: "", leaveType: "", startDate: "", endDate: "", reason: "" });
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });
  const [newLeaveMaster, setNewLeaveMaster] = useState({ id: null, department: "", fiscalYear: "", casualLeave: "", sickLeave: "", earnedLeave: "", otherLeave: "", effectiveFrom: "" });

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, type, label, name }
  const [deleting, setDeleting] = useState(false);
  const [balanceEmpId, setBalanceEmpId] = useState("ALL");
  const [formErrors, setFormErrors] = useState({});

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";



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
    // shiftId is optional — employee may not have an assigned shift
    if (!newAtt.date) errs.date = "Attendance date is required.";
    if (!newAtt.checkIn) errs.checkIn = "In Time is required.";
    if (!newAtt.checkOut) errs.checkOut = "Out Time is required.";
    const pd = newAtt.presentDay === "" || newAtt.presentDay == null ? NaN : Number(newAtt.presentDay);
    if (isNaN(pd) || pd < 0 || pd > 1.0) {
      errs.presentDay = "Present day must be between 0 and 1.0 (e.g. 1.0 or 0.5).";
    }
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
    if (newLeaveMaster.casualLeave === "" || newLeaveMaster.casualLeave === undefined || newLeaveMaster.casualLeave === null || Number(newLeaveMaster.casualLeave) < 0 || Number(newLeaveMaster.casualLeave) > 365) errs.casualLeave = "Casual leave is required (0-365).";
    if (newLeaveMaster.sickLeave === "" || newLeaveMaster.sickLeave === undefined || newLeaveMaster.sickLeave === null || Number(newLeaveMaster.sickLeave) < 0 || Number(newLeaveMaster.sickLeave) > 365) errs.sickLeave = "Sick leave is required (0-365).";
    if (newLeaveMaster.earnedLeave === "" || newLeaveMaster.earnedLeave === undefined || newLeaveMaster.earnedLeave === null || Number(newLeaveMaster.earnedLeave) < 0 || Number(newLeaveMaster.earnedLeave) > 365) errs.earnedLeave = "Earned leave is required (0-365).";
    if (!newLeaveMaster.effectiveFrom) errs.effectiveFrom = "Effective from date is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitLeaveMaster = async (e) => {
    e.preventDefault();
    if (!validateLeaveMaster()) return;
    try {
      await dispatch(createLeaveMaster(newLeaveMaster)).unwrap();
      setNewLeaveMaster({ department: "", fiscalYear: "", casualLeave: "", sickLeave: "", earnedLeave: "", otherLeave: "", effectiveFrom: "" });
      dispatch(fetchLeaveMasters());
      toast.success("Leave Master defined successfully");
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to create leave master");
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
        const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/shifts/${newShift.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newShift.name, startTime: newShift.startTime, endTime: newShift.endTime })
        });
        if (res.ok) {
          dispatch(fetchShifts());
          setNewShift({ name: "", startTime: "", endTime: "" });
          toast.success("Shift updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update shift");
          toast.error(msg);
        }
      } else {
        await dispatch(createShift(newShift)).unwrap();
        setNewShift({ name: "", startTime: "", endTime: "" });
        toast.success("Shift created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newShift.id ? "Failed to update shift" : "Failed to create shift"));
    }
  };

  const handleSubmitRoster = async (e) => {
    e.preventDefault();
    if (!validateRoster()) return;
    try {
      if (newRoster.id) {
        const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/rosters/${newRoster.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId: newRoster.employeeId, shiftId: newRoster.shiftId, date: newRoster.date })
        });
        if (res.ok) {
          dispatch(fetchRosters({ page: rosterPage, limit: rosterRows, search: rosterSearch, sortBy: rosterSortBy, sortOrder: rosterSortOrder }));
          setNewRoster({ employeeId: "", shiftId: "", date: "" });
          toast.success("Roster updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update roster");
          toast.error(msg);
        }
      } else {
        await dispatch(createRoster(newRoster)).unwrap();
        dispatch(fetchRosters({ page: rosterPage, limit: rosterRows, search: rosterSearch, sortBy: rosterSortBy, sortOrder: rosterSortOrder }));
        setNewRoster({ employeeId: "", shiftId: "", date: "" });
        toast.success("Roster created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newRoster.id ? "Failed to update roster" : "Failed to create roster"));
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
      // Find shift from all available shifts (dropdownShifts or Redux shifts)
      const allShifts = dropdownShifts.length > 0 ? dropdownShifts : (Array.isArray(shifts) ? shifts : []);
      const selectedShift = allShifts.find(s => String(s.id) === String(newAtt.shiftId));
      const effectiveStatus = newAtt.isHalfDay ? "HALFDAY" : (newAtt.status || "PRESENT");
      const payload = {
        employeeId: newAtt.employeeId,
        date: newAtt.date,
        status: effectiveStatus,
        shiftId: newAtt.shiftId || undefined,
        shiftName: selectedShift?.name || "General Shift",
        totalWorkHours: Number(workHours),
        otHours: Number(newAtt.otHours || 0),
        lateHours: Number(newAtt.lateHours || 0),
        earlyGoingHours: Number(newAtt.earlyGoingHours || 0),
        presentDay: newAtt.presentDay === "" || newAtt.presentDay == null ? 1.0 : Number(newAtt.presentDay),
        isHalfDay: Boolean(newAtt.isHalfDay),
        isSundayPresent: Boolean(newAtt.isSundayPresent),
        isFullNightPresent: Boolean(newAtt.isFullNightPresent),
        isHolidayPresent: Boolean(newAtt.isHolidayPresent),
        captureMethod: newAtt.captureMethod || "MANUAL_ADMIN",
        checkIn: newAtt.checkIn ? `${newAtt.date}T${newAtt.checkIn}:00.000Z` : null,
        checkOut: newAtt.checkOut ? `${newAtt.date}T${newAtt.checkOut}:00.000Z` : null,
      };

      if (newAtt.date) {
        const dObj = new Date(newAtt.date);
        if (!isNaN(dObj.getTime())) {
          setAttMonth((dObj.getMonth() + 1).toString());
          setAttYear(dObj.getFullYear().toString());
        }
      }

      if (newAtt.id) {
        const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/attendance/${newAtt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          dispatch(fetchAttendance({ page: attPage, limit: attViewMode === "matrix" ? 1000 : attRows, search: attSearch, sortBy: attSortBy, sortOrder: attSortOrder, month: (new Date(newAtt.date).getMonth() + 1).toString(), year: new Date(newAtt.date).getFullYear().toString() }));
          toast.success("Attendance updated successfully");
          setShowManualAttModal(false);
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData?.message || "Failed to update attendance");
          return;
        }
      } else {
        await dispatch(createAttendance(payload)).unwrap();
        dispatch(fetchAttendance({ page: attPage, limit: attViewMode === "matrix" ? 1000 : attRows, search: attSearch, sortBy: attSortBy, sortOrder: attSortOrder, month: (new Date(newAtt.date).getMonth() + 1).toString(), year: new Date(newAtt.date).getFullYear().toString() }));
        toast.success("Attendance captured successfully");
        setShowManualAttModal(false);
      }
      
      setNewAtt({
        employeeId: "",
        shiftId: "",
        date: "",
        checkIn: "",
        checkOut: "",
        otHours: "",
        isHalfDay: false,
        lateHours: "",
        earlyGoingHours: "",
        presentDay: "1",
        isSundayPresent: false,
        isFullNightPresent: false,
        isHolidayPresent: false,
        captureMethod: "MANUAL_ADMIN",
        status: "PRESENT",
      });
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newAtt.id ? "Failed to update attendance" : "Failed to capture attendance"));
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!validateLeave()) return;
    try {
      if (newLeave.id) {
        const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leaves/${newLeave.id}`, {
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
          dispatch(fetchLeaves({ page: leavePage, limit: leaveRows, search: leaveSearch, sortBy: leaveSortBy, sortOrder: leaveSortOrder }));
          setNewLeave({ employeeId: "", leaveType: "", startDate: "", endDate: "", reason: "" });
          toast.success("Leave updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update leave");
          toast.error(msg);
        }
      } else {
        await dispatch(createLeave(newLeave)).unwrap();
        dispatch(fetchLeaves({ page: leavePage, limit: leaveRows, search: leaveSearch, sortBy: leaveSortBy, sortOrder: leaveSortOrder }));
        setNewLeave({ employeeId: "", leaveType: "", startDate: "", endDate: "", reason: "" });
        toast.success("Leave applied successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newLeave.id ? "Failed to update leave" : "Failed to apply leave"));
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
        const res = await apiFetch(`${backendUrl}/staff-hrms/leave/holidays/${newHoliday.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newHoliday.name, date: newHoliday.date })
        });
        if (res.ok) {
          dispatch(fetchHolidays());
          setNewHoliday({ name: "", date: "" });
          toast.success("Holiday updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update holiday");
          toast.error(msg);
        }
      } else {
        await dispatch(createHoliday(newHoliday)).unwrap();
        setNewHoliday({ name: "", date: "" });
        toast.success("Holiday created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newHoliday.id ? "Failed to update holiday" : "Failed to create holiday"));
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
      const res = await apiFetch(`${backendUrl}/staff-hrms/attendance/attendance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch(fetchAttendance());
        toast.success("Attendance deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete attendance");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "attendance") {
        await handleDeleteAttendance(deleteTarget.id);
        if (newAtt.id === deleteTarget.id) {
          setNewAtt({
            employeeId: "", shiftId: "", date: "", checkIn: "", checkOut: "", otHours: "", isHalfDay: false, lateHours: "", earlyGoingHours: "", presentDay: "", isSundayPresent: false, isFullNightPresent: false, isHolidayPresent: false, captureMethod: "BIOMETRIC", status: ""
          });
        }
      } else if (deleteTarget.type === "roster") {
        await handleDeleteRoster(deleteTarget.id);
        if (newRoster.id === deleteTarget.id) setNewRoster({ employeeId: "", shiftId: "", date: "" });
      } else if (deleteTarget.type === "shift") {
        await handleDeleteShift(deleteTarget.id);
        if (newShift.id === deleteTarget.id) setNewShift({ name: "", startTime: "", endTime: "" });
      } else if (deleteTarget.type === "leave") {
        await handleDeleteLeave(deleteTarget.id);
        if (newLeave.id === deleteTarget.id) setNewLeave({ employeeId: "", leaveType: "", startDate: "", endDate: "", reason: "" });
      } else if (deleteTarget.type === "holiday") {
        await handleDeleteHoliday(deleteTarget.id);
        if (newHoliday.id === deleteTarget.id) setNewHoliday({ name: "", date: "" });
      } else if (deleteTarget.type === "leaveMaster") {
        await handleDeleteLeaveMaster(deleteTarget.id);
        if (newLeaveMaster.id === deleteTarget.id) setNewLeaveMaster({ id: null, department: "", fiscalYear: "", casualLeave: "", sickLeave: "", earnedLeave: "", otherLeave: "", effectiveFrom: "" });
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
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
                isHalfDay: !!row.isHalfDay,
                lateHours: row.lateHours || 0,
                earlyGoingHours: row.earlyGoingHours || 0,
                presentDay: row.presentDay || 1.0,
                isSundayPresent: !!row.isSundayPresent,
                isFullNightPresent: !!row.isFullNightPresent,
                isHolidayPresent: !!row.isHolidayPresent,
                captureMethod: row.captureMethod || "BIOMETRIC",
                status: row.status || "PRESENT"
              });
              setShowManualAttModal(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: `attendance record for ${row.employee?.firstName || 'employee'} on ${new Date(row.date).toLocaleDateString()}`, type: "attendance", label: "Attendance Record" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
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
      render: (row) => {
        const emp = row.employee || employees.find(e => String(e.id) === String(row.employeeId));
        return (
          <span className="font-extrabold text-slate-700 dark:text-slate-200 text-xs">
            {emp ? `${emp.firstName} ${emp.lastName}` : (row.employeeId || "-")}
          </span>
        );
      },
    },
    {
      key: "shift.name",
      label: "Shift",
      render: (row) => {
        const shiftObj = row.shift || (dropdownShifts.length > 0 ? dropdownShifts : shifts).find(s => String(s.id) === String(row.shiftId));
        return (
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block">{shiftObj?.name || (row.shiftId || "-")}</span>
            {shiftObj?.startTime && shiftObj?.endTime && (
              <span className="text-[10px] text-slate-400">{shiftObj.startTime} - {shiftObj.endTime}</span>
            )}
          </div>
        );
      },
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
            onClick={() => setDeleteTarget({ id: row.id, name: `roster for ${row.employee?.firstName || 'employee'} on ${new Date(row.date).toLocaleDateString()}`, type: "roster", label: "Shift Roster" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
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
            onClick={() => setDeleteTarget({ id: row.id, name: `shift "${row.name}"`, type: "shift", label: "Work Shift" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
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
      render: (row) => {
        const emp = row.employee || employees.find(e => String(e.id) === String(row.employeeId));
        return (
          <span className="text-xs font-extrabold text-slate-800 dark:text-white">
            {emp ? `${emp.firstName} ${emp.lastName}` : row.employeeId || "-"}
          </span>
        );
      },
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
        <span className="text-xs text-slate-500 italic max-w-[200px] block truncate">&quot;{row.reason}&quot;</span>
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
        className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-[9px] px-2 py-1 transition-all"
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
            onClick={() => setDeleteTarget({ id: row.id, name: `${row.leaveType} leave for ${row.employee?.firstName || 'employee'}`, type: "leave", label: "Leave Application" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const leaveMasterColumns = [
    { 
      key: "department", 
      label: "Department", 
      render: (row) => {
        const deptVal = typeof row.department === 'object' && row.department ? row.department.name : row.department;
        const deptId = typeof row.department === 'object' && row.department ? row.department.id : row.department;
        const deptObj = departments.find((d) => String(d.id) === String(deptId) || String(d.name).toLowerCase() === String(deptVal).toLowerCase());
        return <span className="font-extrabold text-slate-800 dark:text-white">{deptObj ? deptObj.name : deptVal}</span>;
      } 
    },
    { 
      key: "fiscalYear", 
      label: "Fiscal Year", 
      render: (row) => {
        const fyVal = typeof row.fiscalYear === 'object' && row.fiscalYear ? row.fiscalYear.name : row.fiscalYear;
        const fyId = typeof row.fiscalYear === 'object' && row.fiscalYear ? row.fiscalYear.id : row.fiscalYear;
        const fyObj = fiscalYearOptions.find((f) => String(f.id) === String(fyId) || String(f.code) === String(fyVal) || String(f.name).toLowerCase() === String(fyVal).toLowerCase());
        return <span className="text-xs font-bold text-sky-500">{fyObj ? fyObj.name : fyVal}</span>;
      } 
    },
    {
      key: "requisitions",
      label: "Active Requisitions",
      sortable: false,
      render: (row) => {
        const deptVal = typeof row.department === 'object' && row.department ? row.department.name : row.department;
        const deptId = typeof row.department === 'object' && row.department ? row.department.id : row.department;
        const count = requisitions.filter((r) => 
          String(r.departmentId) === String(deptId) ||
          r.department?.id === deptId ||
          (r.department?.name && String(r.department.name).toLowerCase() === String(deptVal).toLowerCase()) ||
          (typeof r.department === "string" && String(r.department).toLowerCase() === String(deptVal).toLowerCase())
        ).length;
        return (
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 px-2.5 py-1 rounded-full">
            {count}
          </span>
        );
      },
    },
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
              const deptId = typeof row.department === 'object' && row.department ? row.department.id : row.department;
              const fyId = typeof row.fiscalYear === 'object' && row.fiscalYear ? row.fiscalYear.id : row.fiscalYear;
              setNewLeaveMaster({
                id: row.id,
                department: deptId,
                fiscalYear: fyId,
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
            onClick={() => {
              const deptName = typeof row.department === 'object' && row.department ? row.department.name : row.department;
              const fyName = typeof row.fiscalYear === 'object' && row.fiscalYear ? row.fiscalYear.name : row.fiscalYear;
              setDeleteTarget({ id: row.id, name: `leave master for ${deptName} (${fyName})`, type: "leaveMaster", label: "Leave Master" });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
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
            onClick={() => setDeleteTarget({ id: row.id, name: `holiday "${row.name}"`, type: "holiday", label: "Holiday Entry" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
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

{
      loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              {/* Header Action & Filter Bar */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-sky-500" />
                      Daily Attendance Management
                    </h2>
                    <p className="text-xs text-slate-500">
                      Manage employee attendance logs, view monthly matrix grid, or perform bulk CSV imports.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher Toggle */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAttViewMode("matrix")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          attViewMode === "matrix"
                            ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                        Monthly Matrix
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttViewMode("list")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          attViewMode === "list"
                            ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        Detailed Logs Table
                      </button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowBulkAttModal(true);
                        setImportResult(null);
                      }}
                      className="border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-2xl h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-500" />
                      Bulk Excel / CSV Import
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleExportAttendanceCsv}
                      className="rounded-2xl h-9 text-xs font-semibold gap-1.5 cursor-pointer border-slate-200 dark:border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-500" />
                      Export CSV
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setShowManualAttModal(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl h-9 px-4 text-xs gap-1.5 shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                       Add Daily Attendance
                    </Button>
                  </div>
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Year Dropdown */}
                    <div className="w-28">
                      <Select value={attYear} onValueChange={(val) => { setAttYear(val); setAttPage(1); }}>
                        <SelectTrigger className="h-9 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {["2024", "2025", "2026", "2027", "2028"].map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month Dropdown */}
                    <div className="w-36">
                      <Select value={attMonth} onValueChange={(val) => { setAttMonth(val); setAttPage(1); }}>
                        <SelectTrigger className="h-9 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="ALL">All Months</SelectItem>
                          {[
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                          ].map((mName, idx) => (
                            <SelectItem key={idx + 1} value={String(idx + 1)}>{mName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Search Input for Matrix */}
                    {/* {attViewMode === "matrix" && (
                      <div className="relative w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <Input
                          placeholder="Search employee name or code..."
                          value={matrixSearch}
                          onChange={(e) => setMatrixSearch(e.target.value)}
                          className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    )} */}
                  </div>

                  {/* Status Legend Bar for Matrix */}
                  {attViewMode === "matrix" && (
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="size-4 bg-emerald-500 text-white font-bold text-[9px] rounded flex items-center justify-center">P</span> Present
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-4 bg-rose-500 text-white font-bold text-[9px] rounded flex items-center justify-center">A</span> Absent
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-4 bg-amber-500 text-white font-bold text-[9px] rounded flex items-center justify-center">HD</span> Half Day
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-4 bg-indigo-500 text-white font-bold text-[9px] rounded flex items-center justify-center">CL</span> Leave
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-4 bg-teal-600 text-white font-bold text-[9px] rounded flex items-center justify-center">SP</span> Special
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* DETAILED DATATABLE VIEW */}
              {attViewMode === "list" && (
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-sm overflow-hidden">
                  <DataTable
                    title="Daily Attendance Logs"
                    lazy={true}
                    columns={attendanceColumns}
                    data={Array.isArray(attendance) ? attendance : (attendance?.data || [])}
                    totalRecords={totalAttendance}
                    page={attPage}
                    rows={attRows}
                    loading={attTableLoading}
                    search={attSearch}
                    sortBy={attSortBy}
                    sortOrder={attSortOrder}
                    onPageChange={(p) => setAttPage(p)}
                    onRowsChange={(r) => { setAttRows(r); setAttPage(1); }}
                    onSortChange={(k, dir) => { setAttSortBy(k); setAttSortOrder(dir); setAttPage(1); }}
                    onSearchChange={(s) => { setAttSearch(s); setAttPage(1); }}
                    emptyMessage="No attendance records logged."
                  />
                </div>
              )}

              {/* MONTHLY MATRIX GRID VIEW USING DATATABLE */}
              {attViewMode === "matrix" && (() => {
                const matrix = constructMatrixData();
                const matrixColumns = [
                  {
                    key: "employee",
                    label: "Employee",
                    render: (row) => (
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{row.name}</span>
                        <span className="text-[10px] font-normal text-slate-400 block">{row.employee?.department?.name || "General"}</span>
                      </div>
                    )
                  },
                  {
                    key: "cardNo",
                    label: "Card No.",
                    render: (row) => <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 font-semibold">{row.cardNo}</span>
                  },
                  ...Array.from({ length: matrix.totalDays }, (_, i) => {
                    const d = i + 1;
                    return {
                      key: `day_${d}`,
                      label: String(d),
                      render: (row) => {
                        const rec = row.daysData[d];
                        if (!rec) return <span className="font-bold text-slate-300 dark:text-slate-600 text-xs text-center block">-</span>;
                        const st = (rec.status || "PRESENT").toUpperCase();
                        let badgeColor = "bg-emerald-500 text-white";
                        let label = "P";

                        if (st === "ABSENT") {
                          badgeColor = "bg-rose-500 text-white";
                          label = "A";
                        } else if (st === "HALFDAY" || rec.isHalfDay) {
                          badgeColor = "bg-amber-500 text-white";
                          label = "HD";
                        } else if (st === "LEAVE" || st === "CASUAL_LEAVE" || st === "SICK_LEAVE") {
                          badgeColor = "bg-indigo-500 text-white";
                          label = "CL";
                        } else if (rec.isSundayPresent || rec.isHolidayPresent || rec.isFullNightPresent) {
                          badgeColor = "bg-teal-600 text-white";
                          label = "SP";
                        }

                        return (
                          <span
                            title={`${rec.date ? rec.date.split('T')[0] : ''} | Status: ${st} ${rec.checkIn ? '| In: ' + rec.checkIn : ''}`}
                            className={`size-6 rounded-md font-bold text-[10px] flex items-center justify-center mx-auto shadow-sm cursor-pointer ${badgeColor}`}
                          >
                            {label}
                          </span>
                        );
                      }
                    };
                  }),
                  {
                    key: "totalPresent",
                    label: "Total",
                    render: (row) => (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold block text-center">
                        {row.totalPresent}
                      </span>
                    )
                  }
                ];

                return (
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-sm overflow-hidden">
                    <DataTable
                      title={`Monthly Attendance Matrix (${matrix.targetMonthName} ${attYear})`}
                      columns={matrixColumns}
                      data={matrix.rows}
                      pageSize={10}
                      emptyMessage="No employee attendance records found for this period."
                    />
                  </div>
                );
              })()}
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
                    {newShift.id ? "Edit Shift Master" : "Define Shift Master"}
                  </h3>
                  <form onSubmit={handleSubmitShift} className="space-y-3" noValidate>
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
                    <div className="flex gap-2 mt-2">
                      <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl h-10">
                        {newShift.id ? "Update Shift" : "Create Shift"}
                      </Button>
                      {newShift.id && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewShift({ name: "", startTime: "", endTime: "" })}
                          className="rounded-xl border-slate-200 dark:border-slate-700 h-10"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Create/Edit Shift Roster */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-500" />
                    {newRoster.id ? "Edit Shift Roster" : "Assign Shift Roster"}
                  </h3>
                  <form onSubmit={handleSubmitRoster} className="space-y-3" noValidate>
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
                          {(dropdownShifts.length > 0 ? dropdownShifts : shifts).map((s) => (
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
                    <div className="flex gap-2 mt-2">
                      <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl h-10">
                        {newRoster.id ? "Update Roster" : "Assign Roster"}
                      </Button>
                      {newRoster.id && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewRoster({ employeeId: "", shiftId: "", date: "" })}
                          className="rounded-xl border-slate-200 dark:border-slate-700 h-10"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Roster & Shifts DataTables */}
              <div className="lg:col-span-2 space-y-6">
                 <DataTable
                  title="Shift Master List"
                  lazy
                  value={shifts}
                  totalRecords={totalShifts}
                  page={shiftPage}
                  rows={shiftRows}
                  loading={attTableLoading}
                  search={shiftSearch}
                  sortBy={shiftSortBy}
                  sortOrder={shiftSortOrder}
                  onPageChange={(p) => setShiftPage(p)}
                  onRowsChange={(r) => { setShiftRows(r); setShiftPage(1); }}
                  onSortChange={(k, dir) => { setShiftSortBy(k); setShiftSortOrder(dir); setShiftPage(1); }}
                  onSearchChange={(s) => { setShiftSearch(s); setShiftPage(1); }}
                  columns={shiftColumns}
                  emptyMessage="No shifts defined yet."
                />
                <DataTable
                  title="Roster Assignments"
                  lazy
                  value={rosters}
                  totalRecords={totalRosters}
                  page={rosterPage}
                  rows={rosterRows}
                  loading={attTableLoading}
                  search={rosterSearch}
                  sortBy={rosterSortBy}
                  sortOrder={rosterSortOrder}
                  onPageChange={(p) => setRosterPage(p)}
                  onRowsChange={(r) => { setRosterRows(r); setRosterPage(1); }}
                  onSortChange={(k, dir) => { setRosterSortBy(k); setRosterSortOrder(dir); setRosterPage(1); }}
                  onSearchChange={(s) => { setRosterSearch(s); setRosterPage(1); }}
                  columns={rosterColumns}
                  emptyMessage="No active rosters assigned."
                />
               
              </div>
            </div>
          )}

          {/* TAB 3: LEAVES */}
          {activeTab === "leaves" && (
            <div className="space-y-6">

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
                <form onSubmit={handleSubmitLeave} className="space-y-3" noValidate>
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
                  lazy
                  value={leaves}
                  totalRecords={totalLeaves}
                  page={leavePage}
                  rows={leaveRows}
                  loading={leaveTableLoading}
                  search={leaveSearch}
                  sortBy={leaveSortBy}
                  sortOrder={leaveSortOrder}
                  onPageChange={(p) => setLeavePage(p)}
                  onRowsChange={(r) => { setLeaveRows(r); setLeavePage(1); }}
                  onSortChange={(k, dir) => { setLeaveSortBy(k); setLeaveSortOrder(dir); setLeavePage(1); }}
                  onSearchChange={(s) => { setLeaveSearch(s); setLeavePage(1); }}
                  columns={leaveColumns}
                  emptyMessage="No leave applications registered."
                />
              </div>
            </div>

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
                <form onSubmit={handleSubmitHoliday} className="space-y-3" noValidate>
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
                  lazy
                  value={holidays}
                  totalRecords={totalHolidays}
                  page={holidayPage}
                  rows={holidayRows}
                  loading={leaveTableLoading}
                  search={holidaySearch}
                  sortBy={holidaySortBy}
                  sortOrder={holidaySortOrder}
                  onPageChange={(p) => setHolidayPage(p)}
                  onRowsChange={(r) => { setHolidayRows(r); setHolidayPage(1); }}
                  onSortChange={(k, dir) => { setHolidaySortBy(k); setHolidaySortOrder(dir); setHolidayPage(1); }}
                  onSearchChange={(s) => { setHolidaySearch(s); setHolidayPage(1); }}
                  columns={holidayColumns}
                  emptyMessage="No holidays configured."
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* BULK ATTENDANCE IMPORT DIALOG */}
      <Dialog open={showBulkAttModal} onOpenChange={setShowBulkAttModal}>
        <DialogContent className="max-w-4xl sm:max-w-4xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                  <FileSpreadsheet className="size-5" />
                </span>
                <DialogTitle className="text-xl font-extrabold tracking-tight">Bulk Attendance Excel / CSV Import</DialogTitle>
              </div>
              <DialogDescription className="text-slate-300 text-xs mt-1.5">
                Upload an Excel/CSV file or paste CSV data to import attendance records for multiple employees at once.
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Download Template Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Need the standard import format template?
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadTemplate}
                className="h-9 text-xs font-bold rounded-xl border-slate-300 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-500" />
                Download CSV Sample Template
              </Button>
            </div>

            {/* Input Options: File Upload or Raw Paste */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  Option A: Choose CSV File
                </Label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Option B: Paste CSV Data
                </Label>
                <Textarea
                  placeholder="Employee Code,Date (YYYY-MM-DD),Check In,Check Out,Status,OT Hours..."
                  rows={3}
                  value={bulkCsvText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  className="text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Preview Table */}
            {parsedAttRecords.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Parsed Records Preview ({parsedAttRecords.length} rows ready)
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Header row excluded automatically
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300">#</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300">Employee ID / Code</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300">Date</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300">Check In</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300">Check Out</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300">OT Hrs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedAttRecords.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="font-mono text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="font-bold text-slate-800 dark:text-slate-200">{row.employeeCodeOrId || "—"}</TableCell>
                          <TableCell>{row.date || "—"}</TableCell>
                          <TableCell>{row.checkIn || "—"}</TableCell>
                          <TableCell>{row.checkOut || "—"}</TableCell>
                          <TableCell>
                            <Badge className="text-[10px] uppercase font-bold" variant={row.status === "PRESENT" ? "outline" : "secondary"}>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.otHours || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Results Report */}
            {importResult && (
              <div className={`p-4 rounded-2xl border space-y-2 ${importResult.failureCount > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"}`}>
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Import Execution Summary
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Total: {importResult.total} | Success: <span className="text-emerald-600 dark:text-emerald-400">{importResult.successCount}</span> | Failed: <span className="text-rose-600 dark:text-rose-400">{importResult.failureCount}</span>
                  </span>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800/40">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-800 dark:text-amber-300 text-xs">Row Errors Detected:</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDownloadAttendanceErrorReport}
                        className="h-7 text-[11px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Error Sheet (.CSV)
                      </Button>
                    </div>
                    <div className="space-y-1 text-[11px] max-h-28 overflow-y-auto bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl border border-amber-200/50">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="text-rose-600 dark:text-rose-400 font-mono">
                          Row {err.row} ({err.employeeCodeOrId}): {err.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBulkAttModal(false)}
                className="rounded-xl h-11 px-6 text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleExecuteBulkImport}
                disabled={importingAtt || parsedAttRecords.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-11 px-8 cursor-pointer shadow-lg"
              >
                {importingAtt ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing Import...
                  </>
                ) : (
                  `Import & Upsert ${parsedAttRecords.length} Records`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MANUAL 1-BY-1 ATTENDANCE CAPTURE MODAL */}
      <Dialog open={showManualAttModal} onOpenChange={setShowManualAttModal}>
        <DialogContent className="max-w-3xl sm:max-w-3xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-6 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-sky-500/20 rounded-xl text-sky-400">
                  <Clock className="size-5" />
                </span>
                <DialogTitle className="text-xl font-extrabold tracking-tight">Capture Daily Attendance Log</DialogTitle>
              </div>
              <DialogDescription className="text-slate-300 text-xs mt-1.5">
                Log manual attendance entry for an individual employee with shift, hours, OT, and status flags.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmitAttendance} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto" noValidate>

            {/* Card 1: Employee & Shift Setup */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <UserCheck className="size-4 text-sky-500" /> Employee & Shift Selection
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Employee *</Label>
                  <Select value={newAtt.employeeId} onValueChange={(val) => {
                    setNewAtt({ ...newAtt, employeeId: val });
                    if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
                  }}>
                    <SelectTrigger className="rounded-xl mt-1.5 h-11"><SelectValue placeholder="Choose an employee" /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {(Array.isArray(employees?.data) ? employees.data : (Array.isArray(employees) ? employees : [])).map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName} ({e.employeeId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.employeeId && <span className="text-rose-500 text-[11px] font-bold block mt-1 pl-1">{formErrors.employeeId}</span>}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Shift *</Label>
                  <Select value={newAtt.shiftId || undefined} onValueChange={(val) => {
                    setNewAtt({ ...newAtt, shiftId: val });
                    if (formErrors.shiftId) setFormErrors({ ...formErrors, shiftId: null });
                  }}>
                    <SelectTrigger className="rounded-xl mt-1.5 h-11"><SelectValue placeholder="Choose a shift" /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {dropdownShifts.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.startTime}-{s.endTime})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.shiftId && <span className="text-rose-500 text-[11px] font-bold block mt-1 pl-1">{formErrors.shiftId}</span>}
                </div>
              </div>
            </div>

            {/* Card 2: Date & Logged Hours */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="size-4 text-emerald-500" /> Date & Logged Hours
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Attendance Date *</Label>
                  <div className="mt-1.5">
                    <DateTimePicker type="date" date={newAtt.date} setDate={(val) => {
                      setNewAtt({ ...newAtt, date: val });
                      if (formErrors.date) setFormErrors({ ...formErrors, date: null });
                    }} />
                  </div>
                  {formErrors.date && <span className="text-rose-500 text-[11px] font-bold block mt-1 pl-1">{formErrors.date}</span>}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Check In Time *</Label>
                  <div className="mt-1.5">
                    <DateTimePicker type="time" date={newAtt.checkIn} setDate={(val) => {
                      setNewAtt({ ...newAtt, checkIn: val });
                      if (formErrors.checkIn) setFormErrors({ ...formErrors, checkIn: null });
                    }} />
                  </div>
                  {formErrors.checkIn && <span className="text-rose-500 text-[11px] font-bold block mt-1 pl-1">{formErrors.checkIn}</span>}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Check Out Time *</Label>
                  <div className="mt-1.5">
                    <DateTimePicker type="time" date={newAtt.checkOut} setDate={(val) => {
                      setNewAtt({ ...newAtt, checkOut: val });
                      if (formErrors.checkOut) setFormErrors({ ...formErrors, checkOut: null });
                    }} />
                  </div>
                  {formErrors.checkOut && <span className="text-rose-500 text-[11px] font-bold block mt-1 pl-1">{formErrors.checkOut}</span>}
                </div>
              </div>

              {/* Work Hours Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase block">Total Work Hours</Label>
                  <span className="text-lg font-black text-sky-600 dark:text-sky-400 block">
                    {calculateWorkHours(newAtt.checkIn, newAtt.checkOut)} hrs
                  </span>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">OT Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    className="rounded-xl mt-1 h-10"
                    value={newAtt.otHours}
                    onChange={(e) => {
                      setNewAtt({ ...newAtt, otHours: e.target.value });
                      if (formErrors.otHours) setFormErrors({ ...formErrors, otHours: null });
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Late Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    className="rounded-xl mt-1 h-10"
                    value={newAtt.lateHours}
                    onChange={(e) => {
                      setNewAtt({ ...newAtt, lateHours: e.target.value });
                      if (formErrors.lateHours) setFormErrors({ ...formErrors, lateHours: null });
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Early Going</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    className="rounded-xl mt-1 h-10"
                    value={newAtt.earlyGoingHours}
                    onChange={(e) => {
                      setNewAtt({ ...newAtt, earlyGoingHours: e.target.value });
                      if (formErrors.earlyGoingHours) setFormErrors({ ...formErrors, earlyGoingHours: null });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Attendance Status & Special Flags */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-indigo-500" /> Attendance Status & Flags
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Attendance Status *</Label>
                  <Select value={newAtt.status || "PRESENT"} onValueChange={(val) => {
                    const isHalf = val === "HALFDAY";
                    setNewAtt({ ...newAtt, status: val, isHalfDay: isHalf, presentDay: isHalf ? "0.5" : "1" });
                  }}>
                    <SelectTrigger className="rounded-xl mt-1.5 h-11"><SelectValue placeholder="Select Status..." /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="PRESENT">✅ Present</SelectItem>
                      <SelectItem value="ABSENT">❌ Absent</SelectItem>
                      <SelectItem value="HALFDAY">🌗 Half Day</SelectItem>
                      <SelectItem value="LATE">🕐 Late</SelectItem>
                      <SelectItem value="ON_LEAVE">🏖️ On Leave</SelectItem>
                      <SelectItem value="HOLIDAY">🎉 Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Present Day Credit (1.0 / 0.5)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="1"
                    className="rounded-xl mt-1.5 h-11"
                    value={newAtt.presentDay}
                    onChange={(e) => {
                      setNewAtt({ ...newAtt, presentDay: e.target.value });
                      if (formErrors.presentDay) setFormErrors({ ...formErrors, presentDay: null });
                    }}
                  />
                  {formErrors.presentDay && <span className="text-rose-500 text-[11px] font-bold block mt-1 pl-1">{formErrors.presentDay}</span>}
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Capture Method</Label>
                  <Select value={newAtt.captureMethod || "MANUAL_ADMIN"} onValueChange={(val) => setNewAtt({ ...newAtt, captureMethod: val })}>
                    <SelectTrigger className="rounded-xl mt-1.5 h-11"><SelectValue placeholder="Select Method..." /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectItem value="BIOMETRIC">Biometric Device Sync</SelectItem>
                      <SelectItem value="MOBILE_APP">Mobile App Check-In</SelectItem>
                      <SelectItem value="MANUAL_ADMIN">Manual HR Entry</SelectItem>
                      <SelectItem value="EXCEL_IMPORT">Excel / CSV Bulk Import</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="pt-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">Attendance Override Flags</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newAtt.isHalfDay}
                      onCheckedChange={(checked) => setNewAtt({ ...newAtt, isHalfDay: checked })}
                    />
                    Half Day
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newAtt.isSundayPresent}
                      onCheckedChange={(checked) => setNewAtt({ ...newAtt, isSundayPresent: checked })}
                    />
                    Sunday Present
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newAtt.isFullNightPresent}
                      onCheckedChange={(checked) => setNewAtt({ ...newAtt, isFullNightPresent: checked })}
                    />
                    Full Night Present
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newAtt.isHolidayPresent}
                      onCheckedChange={(checked) => setNewAtt({ ...newAtt, isHolidayPresent: checked })}
                    />
                    Holiday Present
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end items-center gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowManualAttModal(false)} className="rounded-xl h-11 px-6 text-xs font-semibold cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl h-11 px-8 shadow-lg cursor-pointer">
                Save Attendance Log
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={deleteTarget ? `Delete ${deleteTarget.label}` : "Delete Confirmation"}
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}? This cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
