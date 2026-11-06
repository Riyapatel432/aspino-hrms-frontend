"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useDispatch, useSelector } from "react-redux";
import { usePermissions } from "@/context/PermissionContext";
import {
  fetchPayrollEmployees,
  fetchSalaryStructures,
  fetchActiveFinancialYear,
} from "@/features/payroll/store/payrollSlice";

import {
  buildSalaryReportData,
  exportSalaryReportToExcel,
  exportSalaryReportToCsv,
  exportMultiMonthSalaryReportToExcel,
} from "@/features/payroll/utils/salaryReportExport";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import {
  Banknote,
  Building2,
  Calculator,
  Download,
  FileSpreadsheet,
  Landmark,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  Users,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const MONTHS = [
  { num: 1, name: "January", short: "Jan" },
  { num: 2, name: "February", short: "Feb" },
  { num: 3, name: "March", short: "Mar" },
  { num: 4, name: "April", short: "Apr" },
  { num: 5, name: "May", short: "May" },
  { num: 6, name: "June", short: "Jun" },
  { num: 7, name: "July", short: "Jul" },
  { num: 8, name: "August", short: "Aug" },
  { num: 9, name: "September", short: "Sep" },
  { num: 10, name: "October", short: "Oct" },
  { num: 11, name: "November", short: "Nov" },
  { num: 12, name: "December", short: "Dec" },
];

export default function SalaryReportsPage() {
  const { isEmployee, user, can } = usePermissions();
  const dispatch = useDispatch();

  const canExportReports =
    can("export", "reports") ||
    can("read", "reports") ||
    can("read", "payroll") ||
    can("export", "payroll");

  const {
    employees = [],
    salaryStructures = [],
    loading = false,
  } = useSelector((state) => state.payroll || {});

  // Date states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Master Data
  const [allEmployees, setAllEmployees] = useState([]);
  const [allStructures, setAllStructures] = useState([]);
  const [banks, setBanks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("ALL"); // "ALL" | "SALARY" | "BANK"

  // UI state
  const [showMaskedAccount, setShowMaskedAccount] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);
  const [exportingMonthExcel, setExportingMonthExcel] = useState(false);
  const [exportingAnnualExcel, setExportingAnnualExcel] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const rawEmpList = useMemo(
    () => (Array.isArray(employees?.data) ? employees.data : Array.isArray(employees) ? employees : []),
    [employees]
  );

  const currentMonthObj = useMemo(
    () => MONTHS.find((m) => m.num === selectedMonth) || MONTHS[9],
    [selectedMonth]
  );

  // Fetch Banks
  useEffect(() => {
    async function fetchBanks() {
      try {
        let res = await apiFetch("/staff-hrms/payroll/banks");
        if (!res.ok) {
          res = await apiFetch("/staff-hrms/onboarding/banks");
        }
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          if (Array.isArray(list) && list.length > 0) setBanks(list);
        }
      } catch (err) {
        console.error("Error fetching banks:", err);
      }
    }
    fetchBanks();
  }, []);

  // Fetch Departments
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await apiFetch("/staff-hrms/recruitment/departments?limit=100");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          setDepartments(list);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    }
    fetchDepartments();
  }, []);

  // Fetch report dataset based on selected month & year
  const fetchMonthReportData = useCallback(async () => {
    setLoadingData(true);
    try {
      // 1. Fetch month-specific salary structures
      let structs = [];
      try {
        const res = await apiFetch(
          `/staff-hrms/payroll/salary-structure/all?limit=2000&month=${selectedMonth}&year=${selectedYear}`
        );
        if (res.ok) {
          const data = await res.json();
          structs = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        }
      } catch (e) {
        console.warn("Month query failed:", e);
      }

      // If empty for this specific month, fetch base structures
      if (structs.length === 0) {
        try {
          const allRes = await apiFetch(`/staff-hrms/payroll/salary-structure/all?limit=2000`);
          if (allRes.ok) {
            const allData = await allRes.json();
            structs = Array.isArray(allData?.data) ? allData.data : Array.isArray(allData) ? allData : [];
          }
        } catch (e) {
          console.warn("All structures query failed:", e);
        }
      }

      // 2. Fetch full employees roster
      let emps = [];
      try {
        const empRes = await apiFetch("/staff-hrms/onboarding/employees?page=1&limit=2000");
        if (empRes.ok) {
          const data = await empRes.json();
          emps = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        }
      } catch (e) {}

      if (emps.length === 0) {
        try {
          const pRes = await apiFetch("/staff-hrms/payroll/employees");
          if (pRes.ok) {
            const pData = await pRes.json();
            emps = Array.isArray(pData?.data) ? pData.data : Array.isArray(pData) ? pData : [];
          }
        } catch (e) {}
      }

      setAllEmployees(emps);
      setAllStructures(structs);
    } catch (err) {
      console.error("Failed to load month report:", err);
      toast.error("Unable to load latest payroll data for selected month.");
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMonthReportData();
    dispatch(fetchPayrollEmployees());
    dispatch(fetchActiveFinancialYear());
  }, [fetchMonthReportData, dispatch]);

  // Build report dataset for currently selected month
  const reportData = useMemo(() => {
    return buildSalaryReportData({
      salaryStructures: allStructures.length > 0 ? allStructures : salaryStructures,
      employees: allEmployees.length > 0 ? allEmployees : rawEmpList,
      banks,
      departments,
      selectedMonth,
      selectedYear,
    });
  }, [allStructures, salaryStructures, allEmployees, rawEmpList, banks, departments, selectedMonth, selectedYear]);

  // Filter items based on user search, department, and status
  const filteredItems = useMemo(() => {
    let list = reportData.items || [];

    if (departmentFilter !== "ALL") {
      list = list.filter(
        (item) => String(item.department).toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter(
        (item) => String(item.status).toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        return (
          item.fullName.toLowerCase().includes(q) ||
          item.employeeId.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q) ||
          item.designation.toLowerCase().includes(q) ||
          item.bankName.toLowerCase().includes(q) ||
          item.accountNumber.toLowerCase().includes(q) ||
          item.ifscCode.toLowerCase().includes(q) ||
          item.panNumber.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [reportData.items, departmentFilter, statusFilter, searchQuery]);

  // Export for Selected Month (.XLSX)
  const handleExportMonthExcel = async () => {
    if (!canExportReports) {
      toast.error("You do not have permission to export salary reports.");
      return;
    }
    setExportingMonthExcel(true);
    try {
      const dataToExport = {
        items: filteredItems.length > 0 ? filteredItems : reportData.items,
        summary: reportData.summary,
      };

      exportSalaryReportToExcel(dataToExport, {
        monthName: currentMonthObj.name,
        year: selectedYear,
        filename: `Aspino_Employee_Salary_Report_${selectedYear}_${currentMonthObj.name}.xlsx`,
      });

      toast.success(
        `Excel Salary Report downloaded for ${dataToExport.items.length} employees (${currentMonthObj.name} ${selectedYear}).`
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to export month Excel report.");
    } finally {
      setExportingMonthExcel(false);
    }
  };

  // Export Multi-Month / Annual Excel Workbook (Each Month on a Different Sheet)
  const handleExportAnnualMultiMonthExcel = async () => {
    if (!canExportReports) {
      toast.error("You do not have permission to export salary reports.");
      return;
    }
    setExportingAnnualExcel(true);
    try {
      toast.info(`Compiling all 12 monthly sheets for year ${selectedYear}...`);

      // Query month by month to build exact data for each sheet
      const monthsData = [];
      for (const m of MONTHS) {
        let mStructs = [];
        try {
          const res = await apiFetch(
            `/staff-hrms/payroll/salary-structure/all?limit=2000&month=${m.num}&year=${selectedYear}`
          );
          if (res.ok) {
            const data = await res.json();
            mStructs = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
          }
        } catch (e) {}

        const mReport = buildSalaryReportData({
          salaryStructures: mStructs.length > 0 ? mStructs : (allStructures.length > 0 ? allStructures : salaryStructures),
          employees: allEmployees.length > 0 ? allEmployees : rawEmpList,
          banks,
          departments,
          selectedMonth: m.num,
          selectedYear,
        });

        monthsData.push({
          month: m.num,
          monthName: `${m.name} ${selectedYear}`,
          items: mReport.items,
          summary: mReport.summary,
        });
      }

      exportMultiMonthSalaryReportToExcel({
        monthsData,
        year: selectedYear,
        filename: `Aspino_All_Months_Salary_and_Bank_Report_${selectedYear}.xlsx`,
      });

      toast.success(`Full 12-month multi-sheet Excel report exported successfully!`);
    } catch (err) {
      console.error("Multi-month export error:", err);
      toast.error("Failed to export multi-month Excel report.");
    } finally {
      setExportingAnnualExcel(false);
    }
  };

  // Export Selected Month CSV
  const handleExportCsv = async () => {
    if (!canExportReports) {
      toast.error("You do not have permission to export salary reports.");
      return;
    }
    setExportingCsv(true);
    try {
      const dataToExport = {
        items: filteredItems.length > 0 ? filteredItems : reportData.items,
        summary: reportData.summary,
      };

      exportSalaryReportToCsv(dataToExport, {
        monthName: currentMonthObj.name,
        year: selectedYear,
        filename: `Aspino_Employee_Salary_Report_${selectedYear}_${currentMonthObj.name}.csv`,
      });

      toast.success(`CSV report exported for ${currentMonthObj.name} ${selectedYear}.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export CSV report.");
    } finally {
      setExportingCsv(false);
    }
  };

  const handleCopyAccount = (accNum) => {
    if (!accNum || accNum === "—") return;
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(accNum);
    toast.success("Account number copied!");
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Table Columns
  const tableColumns = useMemo(() => {
    const cols = [
      {
        key: "employee",
        label: "Employee",
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
              {row.firstName?.[0] || row.fullName?.[0] || "E"}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                {row.fullName}
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {row.employeeId}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-500">
                {row.designation} • {row.department}
              </div>
            </div>
          </div>
        ),
      },
    ];

    if (viewMode === "ALL" || viewMode === "SALARY") {
      cols.push(
        {
          key: "basicSalary",
          label: "Basic Salary",
          render: (row) => (
            <span className="font-medium text-slate-900 dark:text-slate-100">
              ₹{row.basicSalary?.toLocaleString() || "0"}
            </span>
          ),
        },
        {
          key: "hraAmount",
          label: "HRA",
          render: (row) => (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ₹{row.hraAmount?.toLocaleString() || "0"}
            </span>
          ),
        },
        {
          key: "allowances",
          label: "DA & Allowances",
          render: (row) => {
            const allowances =
              (row.da || 0) +
              (row.conveyance || 0) +
              (row.specialAllowance || 0) +
              (row.statutoryBonus || 0) +
              (row.reimbursements || 0);
            return <span className="text-xs text-slate-600 dark:text-slate-300">₹{allowances.toLocaleString()}</span>;
          },
        },
        {
          key: "grossSalary",
          label: "Gross Monthly",
          render: (row) => (
            <span className="font-extrabold text-sky-600 dark:text-sky-400">
              ₹{row.grossSalary?.toLocaleString() || "0"}
            </span>
          ),
        },
        {
          key: "deductions",
          label: "Deductions (PF/ESI/PT)",
          render: (row) => (
            <div className="text-xs">
              <span className="text-rose-600 font-semibold">₹{row.totalDeductions?.toLocaleString() || "0"}</span>
              <span className="text-[10px] text-slate-400 block">
                PF: ₹{row.pfAmount} | PT: ₹{row.ptAmount}
              </span>
            </div>
          ),
        },
        {
          key: "netSalary",
          label: "Net In-Hand",
          render: (row) => (
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              ₹{row.netSalary?.toLocaleString() || "0"}
            </span>
          ),
        }
      );
    }

    if (viewMode === "ALL" || viewMode === "BANK") {
      cols.push(
        {
          key: "bankDetails",
          label: "Bank Account & IFSC",
          render: (row) => {
            const hasBank = row.accountNumber && row.accountNumber !== "—";
            const masked = hasBank
              ? showMaskedAccount
                ? `•••• •••• ${row.accountNumber.slice(-4)}`
                : row.accountNumber
              : "Not Configured";

            return (
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Landmark className="size-3 text-sky-500" />
                  <span>{row.bankName}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  <span>{masked}</span>
                  {hasBank && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAccount(row.accountNumber);
                      }}
                      className="text-slate-400 hover:text-sky-500 cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedAccount === row.accountNumber ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  IFSC: <span className="font-semibold text-slate-600 dark:text-slate-300">{row.ifscCode}</span>
                </div>
              </div>
            );
          },
        },
        {
          key: "kycDetails",
          label: "PAN & Statutory IDs",
          render: (row) => (
            <div className="text-xs space-y-0.5 font-mono">
              <div className="text-slate-700 dark:text-slate-300">
                PAN: <span className="font-bold">{row.panNumber}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                UAN: {row.uanNumber !== "—" ? row.uanNumber : "N/A"}
              </div>
            </div>
          ),
        }
      );
    }

    cols.push({
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedEmployeeDetail(row)}
            className="h-8 px-2.5 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-xl gap-1 cursor-pointer"
          >
            <Eye className="size-3.5" /> Details
          </Button>
        </div>
      ),
    });

    return cols;
  }, [viewMode, showMaskedAccount, copiedAccount]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Calendar className="size-4" />
              <span>Monthly Salary Structure & Bank Disbursement Reports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Monthly Employee Salary Report
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Export employee salary structures, earnings, deductions, and verified bank accounts in Excel (.xlsx)
              based on any chosen month, or generate a full multi-month workbook with each month on a separate sheet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Export Selected Month Excel Button */}
            <Button
              onClick={handleExportMonthExcel}
              disabled={!canExportReports || exportingMonthExcel || loadingData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-11 px-5 font-bold shadow-lg shadow-emerald-950/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {exportingMonthExcel ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-4" />
              )}
              Export {currentMonthObj.name} (.XLSX)
            </Button>

            {/* Export Full Year (Each Month in Different Sheet) */}
            <Button
              onClick={handleExportAnnualMultiMonthExcel}
              disabled={!canExportReports || exportingAnnualExcel || loadingData}
              variant="outline"
              className="border-indigo-400/40 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-200 rounded-xl gap-2 h-11 px-4 text-xs font-semibold cursor-pointer shadow-md"
              title="Download Excel workbook with 12 separate sheets (one sheet per month)"
            >
              {exportingAnnualExcel ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Layers className="size-3.5 text-indigo-400" />
              )}
              Export All 12 Months (Separate Sheets)
            </Button>

            <Button
              onClick={handleExportCsv}
              variant="outline"
              disabled={!canExportReports || exportingCsv || loadingData}
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl gap-1.5 h-11 px-3.5 text-xs font-semibold cursor-pointer"
            >
              {exportingCsv ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              CSV
            </Button>

            <Button
              onClick={fetchMonthReportData}
              variant="ghost"
              disabled={loadingData}
              className="text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-11 w-11 p-0 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`size-4 ${loadingData ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Month Selection Bar (Interactive 12 Month Pills) */}
      <Card className="border rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Select Month to Export:
            </span>
            <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold text-xs">
              {currentMonthObj.name} {selectedYear}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Year:</span>
            <div className="w-28">
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900">
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 12 Quick Month Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
          {MONTHS.map((m) => {
            const isSelected = selectedMonth === m.num;
            return (
              <button
                key={m.num}
                onClick={() => setSelectedMonth(m.num)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? "bg-gradient-to-b from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 scale-[1.03]"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                <span>{m.short}</span>
                <span className={`text-[9px] ${isSelected ? "text-sky-100" : "text-slate-400"}`}>
                  {String(m.num).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* KPI Summary Cards for Selected Month */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-2xl">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Staff in {currentMonthObj.short}</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {reportData.summary.totalEmployees}
              </h3>
              <p className="text-[10px] text-slate-400">
                {filteredItems.length} matching filter
              </p>
            </div>
          </div>
        </Card>

        <Card className="border rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Banknote className="size-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Gross Salary ({currentMonthObj.short})</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                ₹{reportData.summary.totalGrossSalary?.toLocaleString() || "0"}
              </h3>
              <p className="text-[10px] text-emerald-600 font-medium">
                Annual CTC: ₹{(reportData.summary.totalAnnualCtc / 100000)?.toFixed(1)}L
              </p>
            </div>
          </div>
        </Card>

        <Card className="border rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <DollarSign className="size-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Net Payout ({currentMonthObj.short})</p>
              <h3 className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                ₹{reportData.summary.totalNetSalary?.toLocaleString() || "0"}
              </h3>
              <p className="text-[10px] text-slate-400">
                Deductions: ₹{reportData.summary.totalDeductions?.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Landmark className="size-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Bank Accounts Status</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {reportData.summary.bankConfiguredCount}/{reportData.summary.totalEmployees}
              </h3>
              <p className="text-[10px] text-amber-600 font-medium">
                {reportData.summary.bankMissingCount > 0
                  ? `${reportData.summary.bankMissingCount} pending setup`
                  : "All accounts configured"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        {/* Filter and Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee, ID, bank, account, PAN..."
                className="pl-9 h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Department Filter */}
            <div className="w-40">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900">
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id || dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-32">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PROBATION">Probation</SelectItem>
                  <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* View Mode Toggle & Mask Toggle */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                onClick={() => setViewMode("ALL")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === "ALL"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                All Details
              </button>
              <button
                onClick={() => setViewMode("SALARY")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === "SALARY"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Salary Breakdown
              </button>
              <button
                onClick={() => setViewMode("BANK")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === "BANK"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Bank & KYC
              </button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMaskedAccount(!showMaskedAccount)}
              className="h-10 text-xs rounded-xl gap-1.5 text-slate-600 dark:text-slate-300"
            >
              {showMaskedAccount ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
              {showMaskedAccount ? "Show Accounts" : "Mask Accounts"}
            </Button>
          </div>
        </div>

        {/* Action Callout Bar */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Ready to Export for {currentMonthObj.name} {selectedYear}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Contains complete employee salary structures, earnings, statutory deductions, bank accounts, IFSC, and
                PAN codes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleExportMonthExcel}
              disabled={!canExportReports || exportingMonthExcel || loadingData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-10 px-4 text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
            >
              {exportingMonthExcel ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              Export {currentMonthObj.short} (.XLSX)
            </Button>

            <Button
              onClick={handleExportAnnualMultiMonthExcel}
              disabled={!canExportReports || exportingAnnualExcel || loadingData}
              variant="outline"
              className="rounded-xl h-10 px-3.5 text-xs gap-1.5 font-semibold cursor-pointer border-slate-300 dark:border-slate-700"
            >
              <Layers className="size-3.5 text-indigo-500" />
              All 12 Months
            </Button>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={tableColumns}
          data={filteredItems}
          loading={loadingData || loading}
          pageSize={10}
          searchable={false}
          showSrNo={false}
          emptyMessage={`No salary records found for ${currentMonthObj.name} ${selectedYear}.`}
          emptyDescription="Try selecting a different month or year from the selector above."
        />

        {/* Bottom Totals Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {currentMonthObj.name} {selectedYear} Total:
            </span>
            <Badge variant="outline" className="font-mono bg-white dark:bg-slate-900">
              {filteredItems.length} Staff
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-600 dark:text-slate-400">
            <div>
              Total Basic:{" "}
              <strong className="text-slate-900 dark:text-slate-100 font-mono">
                ₹{filteredItems.reduce((s, i) => s + (i.basicSalary || 0), 0).toLocaleString()}
              </strong>
            </div>
            <div>
              Total Gross:{" "}
              <strong className="text-sky-600 dark:text-sky-400 font-mono">
                ₹{filteredItems.reduce((s, i) => s + (i.grossSalary || 0), 0).toLocaleString()}
              </strong>
            </div>
            <div>
              Total Deductions:{" "}
              <strong className="text-rose-600 font-mono">
                ₹{filteredItems.reduce((s, i) => s + (i.totalDeductions || 0), 0).toLocaleString()}
              </strong>
            </div>
            <div>
              Total Net Payout:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                ₹{filteredItems.reduce((s, i) => s + (i.netSalary || 0), 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </Card>

      {/* Employee Detail Modal */}
      {selectedEmployeeDetail && (
        <Dialog open={Boolean(selectedEmployeeDetail)} onOpenChange={() => setSelectedEmployeeDetail(null)}>
          <DialogContent className="max-w-3xl sm:max-w-3xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-white dark:bg-slate-950">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 font-extrabold text-lg flex items-center justify-center border border-sky-500/30">
                  {selectedEmployeeDetail.fullName?.[0] || "E"}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedEmployeeDetail.fullName}
                    <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-xs">
                      {selectedEmployeeDetail.employeeId}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-slate-300 text-xs mt-0.5">
                    {selectedEmployeeDetail.designation} • {selectedEmployeeDetail.department} • Month: {currentMonthObj.name} {selectedYear}
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border">
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedEmployeeDetail.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedEmployeeDetail.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">City Category</span>
                  <Badge variant="outline" className="text-[10px] mt-0.5">{selectedEmployeeDetail.cityCategory}</Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tax Regime</span>
                  <Badge variant="outline" className="text-[10px] mt-0.5 text-indigo-600 border-indigo-200">{selectedEmployeeDetail.taxRegime}</Badge>
                </div>
              </div>

              {/* Monthly Earnings */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calculator className="size-4 text-sky-500" />
                  Monthly Earnings ({currentMonthObj.name} {selectedYear})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">Basic Salary</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm">
                      ₹{selectedEmployeeDetail.basicSalary?.toLocaleString()}
                    </strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">HRA</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{selectedEmployeeDetail.hraAmount?.toLocaleString()}
                    </strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">DA</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm">
                      ₹{selectedEmployeeDetail.da?.toLocaleString()}
                    </strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">Special Allowance</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm">
                      ₹{selectedEmployeeDetail.specialAllowance?.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800 flex justify-between items-center">
                  <div>
                    <span className="text-sky-800 dark:text-sky-300 font-bold block">Gross Monthly Salary</span>
                    <span className="text-sky-600 dark:text-sky-400 text-[11px]">
                      Annual CTC: ₹{selectedEmployeeDetail.annualGross?.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xl font-black text-sky-700 dark:text-sky-300">
                    ₹{selectedEmployeeDetail.grossSalary?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Deductions & Net Payout */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-rose-500" />
                  Statutory Deductions & Net Salary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">PF</span>
                    <strong className="text-rose-600 text-sm">₹{selectedEmployeeDetail.pfAmount?.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">ESI</span>
                    <strong className="text-rose-600 text-sm">₹{selectedEmployeeDetail.esiAmount?.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">Professional Tax (PT)</span>
                    <strong className="text-rose-600 text-sm">₹{selectedEmployeeDetail.ptAmount?.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                  <div>
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold block">Net Take-Home Pay</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                      Total Deductions: ₹{selectedEmployeeDetail.totalDeductions?.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{selectedEmployeeDetail.netSalary?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Landmark className="size-4 text-indigo-500" />
                  Bank Details & KYC
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bank Name</span>
                    <strong className="text-slate-900 dark:text-slate-100">{selectedEmployeeDetail.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Account Number</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-mono">
                      {selectedEmployeeDetail.accountNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">IFSC Code</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-mono">{selectedEmployeeDetail.ifscCode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">PAN Number</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-mono">{selectedEmployeeDetail.panNumber}</strong>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-0 flex justify-between items-center border-t dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setSelectedEmployeeDetail(null)}
                className="rounded-xl h-10 px-5 text-xs"
              >
                Close
              </Button>

              <Button
                onClick={() => {
                  exportSalaryReportToExcel(
                    { items: [selectedEmployeeDetail], summary: reportData.summary },
                    {
                      monthName: currentMonthObj.name,
                      year: selectedYear,
                      filename: `${selectedEmployeeDetail.employeeId}_Salary_Slip_${currentMonthObj.name}_${selectedYear}.xlsx`,
                    }
                  );
                  toast.success(`Exported slip for ${selectedEmployeeDetail.fullName}`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-10 px-5 text-xs font-bold"
              >
                <Download className="size-3.5" /> Download Individual Slip (.xlsx)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
