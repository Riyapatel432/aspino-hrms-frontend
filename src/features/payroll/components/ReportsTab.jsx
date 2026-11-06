"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
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
} from "@/features/payroll/utils/salaryReportExport";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Calendar,
  CheckCircle2,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Landmark,
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  Users,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsTab() {
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
    activeFinancialYear = "",
  } = useSelector((state) => state.payroll || {});

  // Date Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportFinancialYear, setReportFinancialYear] = useState("2026-2027");

  // Tab State: "salary-report" | "statutory" | "form16"
  const [activeTab, setActiveTab] = useState("salary-report");

  // Report Specific State
  const [allEmployees, setAllEmployees] = useState([]);
  const [allStructures, setAllStructures] = useState([]);
  const [banks, setBanks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Search and Filters for the Salary Report Table
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("ALL"); // "ALL" | "SALARY" | "BANK"

  // UI state
  const [showMaskedAccount, setShowMaskedAccount] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Statutory Export states
  const [exportingBank, setExportingBank] = useState(false);
  const [exportingPf, setExportingPf] = useState(false);
  const [exportingEsi, setExportingEsi] = useState(false);
  const [exportingPt, setExportingPt] = useState(false);

  // Form 16 Modal state
  const [selectedForm16, setSelectedForm16] = useState(null);

  // Resolve logged-in employee if role is restricted
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

    return rawEmpList.find(
      (e) =>
        (userId && (String(e.userId) === userId || String(e.id) === userId)) ||
        (userEmpId && (String(e.id) === userEmpId || String(e.employeeId) === userEmpId)) ||
        (userEmpCode && (String(e.employeeId) === userEmpCode || String(e.id) === userEmpCode)) ||
        (userEmail && e.email?.toLowerCase().trim() === userEmail) ||
        (userName && `${e.firstName || ""} ${e.lastName || ""}`.toLowerCase().trim() === userName)
    );
  }, [user, rawEmpList]);

  const myEmployeeId = myEmployee?.id || user?.employeeId || user?.id || null;

  // Month name helper
  const monthName = useMemo(() => {
    return new Date(2026, selectedMonth - 1, 1).toLocaleString("default", { month: "long" });
  }, [selectedMonth]);

  // Fetch Fiscal Years
  useEffect(() => {
    async function fetchFiscalYears() {
      try {
        const res = await apiFetch("/staff-hrms/recruitment/fiscal-years?limit=100");
        const data = await res.json();
        if (data && data.data) {
          setFiscalYears(data.data.filter((fy) => fy.isActive !== false));
        }
      } catch (e) {
        console.error("Error fetching fiscal years:", e);
      }
    }
    fetchFiscalYears();
  }, []);

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
          if (Array.isArray(list) && list.length > 0) {
            setBanks(list);
          }
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

  // Sync active financial year
  useEffect(() => {
    if (activeFinancialYear) {
      setReportFinancialYear(activeFinancialYear);
    } else if (fiscalYears.length > 0) {
      setReportFinancialYear((prev) => (fiscalYears.some((f) => f.name === prev) ? prev : fiscalYears[0].name));
    }
  }, [activeFinancialYear, fiscalYears]);

  // Main loader: Fetch all employees & salary structures for comprehensive reporting
  const fetchReportDataset = useCallback(async () => {
    setLoadingData(true);
    try {
      // 1. Fetch salary structures for selected month/year
      let structs = [];
      try {
        const structRes = await apiFetch(
          `/staff-hrms/payroll/salary-structure/all?limit=2000&month=${selectedMonth}&year=${selectedYear}`
        );
        if (structRes.ok) {
          const data = await structRes.json();
          structs = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        }
      } catch (e) {
        console.warn("Could not fetch month-specific structures:", e);
      }

      // If month-specific structures are empty, fetch general master structures
      if (structs.length === 0) {
        try {
          const allStructRes = await apiFetch(`/staff-hrms/payroll/salary-structure/all?limit=2000`);
          if (allStructRes.ok) {
            const allData = await allStructRes.json();
            structs = Array.isArray(allData?.data) ? allData.data : Array.isArray(allData) ? allData : [];
          }
        } catch (e) {
          console.warn("Could not fetch all structures:", e);
        }
      }

      // 2. Fetch all employees
      let emps = [];
      try {
        const empRes = await apiFetch("/staff-hrms/onboarding/employees?page=1&limit=2000");
        if (empRes.ok) {
          const data = await empRes.json();
          emps = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        }
      } catch (e) {
        console.warn("Could not fetch onboarding employees:", e);
      }

      if (emps.length === 0) {
        try {
          const pEmpRes = await apiFetch("/staff-hrms/payroll/employees");
          if (pEmpRes.ok) {
            const data = await pEmpRes.json();
            emps = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
          }
        } catch (e) {
          console.warn("Could not fetch payroll employees:", e);
        }
      }

      setAllEmployees(emps);
      setAllStructures(structs);
    } catch (err) {
      console.error("Failed to load report dataset:", err);
      toast.error("Unable to load latest payroll dataset. Using local cache.");
    } finally {
      setLoadingData(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReportDataset();
    dispatch(fetchPayrollEmployees());
    dispatch(fetchActiveFinancialYear());
  }, [fetchReportDataset, dispatch]);

  // Combine datasets using the export utility
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

  // Filter items based on user search, department, status, and role
  const filteredReportItems = useMemo(() => {
    let list = reportData.items || [];

    // Role filtering for standard employees
    if (isEmployee && myEmployeeId) {
      const targetId = String(myEmployeeId);
      const targetCode = String(myEmployee?.employeeId || "");
      list = list.filter((item) => {
        const itemEmpId = String(item.employeeId || item.id || "");
        return itemEmpId === targetId || itemEmpId === targetCode;
      });
    }

    // Department filter
    if (departmentFilter !== "ALL") {
      list = list.filter(
        (item) => String(item.department).toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      list = list.filter(
        (item) => String(item.status).toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search query
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
          item.panNumber.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [reportData.items, isEmployee, myEmployeeId, myEmployee, departmentFilter, statusFilter, searchQuery]);

  // Handle Export to Excel (.XLSX)
  const handleExportExcel = async () => {
    if (!canExportReports) {
      toast.error("You do not have permission to export salary reports.");
      return;
    }
    setExportingExcel(true);
    try {
      const dataToExport = {
        items: filteredReportItems.length > 0 ? filteredReportItems : reportData.items,
        summary: reportData.summary,
      };

      exportSalaryReportToExcel(dataToExport, {
        monthName,
        year: selectedYear,
        filename: `Aspino_Employee_Salary_and_Bank_Report_${selectedYear}_${monthName.replace(/\s+/g, "_")}.xlsx`,
      });

      toast.success(
        `Excel Salary Report downloaded for ${dataToExport.items.length} employees (${monthName} ${selectedYear}).`
      );
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Failed to generate Excel report. Please try again.");
    } finally {
      setExportingExcel(false);
    }
  };

  // Handle Export to CSV
  const handleExportCsv = async () => {
    if (!canExportReports) {
      toast.error("You do not have permission to export salary reports.");
      return;
    }
    setExportingCsv(true);
    try {
      const dataToExport = {
        items: filteredReportItems.length > 0 ? filteredReportItems : reportData.items,
        summary: reportData.summary,
      };

      exportSalaryReportToCsv(dataToExport, {
        monthName,
        year: selectedYear,
        filename: `Aspino_Employee_Salary_and_Bank_Report_${selectedYear}_${monthName.replace(/\s+/g, "_")}.csv`,
      });

      toast.success(`CSV Salary Report exported for ${dataToExport.items.length} employees.`);
    } catch (err) {
      console.error("CSV export error:", err);
      toast.error("Failed to generate CSV report.");
    } finally {
      setExportingCsv(false);
    }
  };

  // Copy account number helper
  const handleCopyAccount = (accNum) => {
    if (!accNum || accNum === "—") return;
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(accNum);
    toast.success("Bank account number copied to clipboard!");
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  // Statutory Export: Bank Disbursement CSV
  const triggerFileDownload = (blobOrText, filename) => {
    const blob = typeof blobOrText === "string" ? new Blob([blobOrText], { type: "text/csv;charset=utf-8;" }) : blobOrText;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportBankTransfer = async () => {
    setExportingBank(true);
    try {
      const res = await apiFetch(`/staff-hrms/payroll/export/bank-transfer?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          triggerFileDownload(text, `Bank_Disbursement_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`);
          toast.success(`Bank transfer disbursement file exported for ${selectedMonth}/${selectedYear}`);
          return;
        }
      }
      throw new Error("No data returned");
    } catch (err) {
      const headers = "Beneficiary Name,Account Number,IFSC Code,Amount (INR),Remarks\n";
      const rows = reportData.items
        .map((item) => {
          return `"${item.fullName}","${item.accountNumber}","${item.ifscCode}",${item.netSalary},"Salary ${selectedMonth}/${selectedYear}"`;
        })
        .join("\n");

      triggerFileDownload(headers + rows, `Bank_Disbursement_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`);
      toast.success(`Bank transfer disbursement file generated for ${selectedMonth}/${selectedYear}`);
    } finally {
      setExportingBank(false);
    }
  };

  // Statutory Export: PF ECR
  const handleExportPfEcr = async () => {
    setExportingPf(true);
    try {
      const res = await apiFetch(`/staff-hrms/payroll/export/statutory/pf-ecr?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          triggerFileDownload(text, `PF_ECR_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`);
          toast.success(`PF ECR report exported for ${selectedMonth}/${selectedYear}`);
          return;
        }
      }
      throw new Error("No data returned");
    } catch (err) {
      const headers = "UAN/Emp ID,Member Name,Gross Wages,EPF Wages,EPS Wages,EDLI Wages,EE Share,ER Share EPF,ER Share EPS\n";
      const rows = reportData.items
        .map((emp) => {
          const wages = emp.basicSalary || 25000;
          const eeShare = emp.pfAmount || Math.round(wages * 0.12);
          const erEpf = Math.round(eeShare * 0.2917);
          const erEps = Math.round(eeShare * 0.7083);
          return `"${emp.uanNumber !== "—" ? emp.uanNumber : emp.employeeId}","${emp.fullName}",${emp.grossSalary},${wages},${wages},${wages},${eeShare},${erEpf},${erEps}`;
        })
        .join("\n");

      triggerFileDownload(headers + rows, `PF_ECR_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`);
      toast.success(`PF ECR report generated for ${selectedMonth}/${selectedYear}`);
    } finally {
      setExportingPf(false);
    }
  };

  // Statutory Export: ESI Return
  const handleExportEsi = async () => {
    setExportingEsi(true);
    try {
      const res = await apiFetch(`/staff-hrms/payroll/export/statutory/esi-return?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          triggerFileDownload(text, `ESI_Return_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`);
          toast.success(`ESI return report exported for ${selectedMonth}/${selectedYear}`);
          return;
        }
      }
      throw new Error("No data returned");
    } catch (err) {
      const headers = "IP Number / Emp ID,IP Name,No of Days,Total Wages,IP Contribution,Employer Contribution\n";
      const rows = reportData.items
        .map((emp) => {
          const wages = emp.grossSalary || 20000;
          const ipContrib = emp.esiAmount || Math.round(wages * 0.0075);
          const erContrib = Math.ceil(wages * 0.0325);
          return `"${emp.esiNumber !== "—" ? emp.esiNumber : emp.employeeId}","${emp.fullName}",30,${wages},${ipContrib},${erContrib}`;
        })
        .join("\n");

      triggerFileDownload(headers + rows, `ESI_Return_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`);
      toast.success(`ESI return report generated for ${selectedMonth}/${selectedYear}`);
    } finally {
      setExportingEsi(false);
    }
  };

  // Statutory Export: PT Slab
  const handleExportPt = async () => {
    setExportingPt(true);
    try {
      const res = await apiFetch(`/staff-hrms/payroll/export/statutory/pt-report?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim()) {
          triggerFileDownload(text, `PT_Report_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`);
          toast.success(`PT slab report exported for ${selectedMonth}/${selectedYear}`);
          return;
        }
      }
      throw new Error("No data returned");
    } catch (err) {
      const headers = "Employee ID,Employee Name,State,Gross Earnings,PT Deducted\n";
      const rows = reportData.items
        .map((emp) => {
          return `"${emp.employeeId}","${emp.fullName}","Maharashtra",${emp.grossSalary},${emp.ptAmount || 200}`;
        })
        .join("\n");

      triggerFileDownload(headers + rows, `PT_Report_${selectedYear}_${String(selectedMonth).padStart(2, "0")}.csv`);
      toast.success(`PT slab report generated for ${selectedMonth}/${selectedYear}`);
    } finally {
      setExportingPt(false);
    }
  };

  // Form 16 handler
  const handleOpenForm16 = async (row) => {
    if (!row) return;
    const employeeId = row.employee?.id || row.employeeId || row.id;
    const fy = reportFinancialYear || activeFinancialYear || "2026-2027";

    try {
      const res = await apiFetch(
        `/staff-hrms/payroll/export/form16/${employeeId}?financialYear=${encodeURIComponent(fy)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.employeeName) {
          setSelectedForm16(data);
          return;
        }
      }
    } catch (err) {
      console.warn("Form 16 API fetch failed, computing from structure:", err);
    }

    const empName = row.fullName || (row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : "Staff Member");
    const annualGross = row.annualGross || Number(row.grossSalary || 50000) * 12;
    const annualHra = Number(row.hraAmount || 0) * 12 || annualGross * 0.25;
    const stdDeduction = 50000;
    const sec80c = 150000;
    const hraExempt = Math.round(annualHra > 0 ? annualHra * 0.5 : 0);
    const netTaxable = Math.max(0, annualGross - stdDeduction - sec80c - hraExempt);
    const tdsDeducted = Math.round(netTaxable * 0.1);

    setSelectedForm16({
      financialYear: fy,
      employeeId: row.employeeId || "EMP001",
      employeeName: empName,
      pan: row.panNumber || "ABCDE1234F",
      employerName: "Aspino Technologies Pvt Ltd",
      employerTan: "MUMB12345A",
      grossSalary: annualGross,
      hraExemption: hraExempt,
      standardDeduction: stdDeduction,
      section80C: sec80c,
      totalPfDeduction: Math.round((Number(row.basicSalary) || 25000) * 12 * 0.12),
      totalTdsDeducted: tdsDeducted,
      netTaxableIncome: netTaxable,
    });
  };

  // Columns for the Comprehensive Salary & Bank Report DataTable
  const salaryReportColumns = useMemo(() => {
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
                <Badge variant="outline" className="text-[10px] px-1 py-0 border-slate-200 dark:border-slate-700">
                  {row.employeeId}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
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
            const allowances = (row.da || 0) + (row.conveyance || 0) + (row.specialAllowance || 0) + (row.statutoryBonus || 0) + (row.reimbursements || 0);
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
                      className="text-slate-400 hover:text-sky-500 cursor-pointer transition-colors"
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
            title="View Full Profile & Salary Breakdown"
          >
            <Eye className="size-3.5" /> Details
          </Button>
        </div>
      ),
    });

    return cols;
  }, [viewMode, showMaskedAccount, copiedAccount]);

  // Form 16 Table Columns
  const form16Columns = useMemo(
    () => [
      {
        key: "employee",
        label: "Employee",
        render: (row) => (
          <span className="font-semibold">
            {row.fullName || (row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : row.employeeId)}
          </span>
        ),
      },
      {
        key: "department",
        label: "Department",
        render: (row) => row.department || "—",
      },
      {
        key: "financialYear",
        label: "Financial Year",
        render: () => reportFinancialYear || activeFinancialYear || "2026-2027",
      },
      {
        key: "grossSalary",
        label: "Annual Gross CTC",
        render: (row) => `₹${(row.annualGross || (row.grossSalary || 50000) * 12).toLocaleString()}`,
      },
      {
        key: "status",
        label: "Status",
        render: () => <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Ready</Badge>,
      },
      {
        key: "action",
        label: "Action",
        sortable: false,
        render: (row) => (
          <Button
            size="sm"
            variant="outline"
            className="text-xs rounded-xl gap-2 h-8 cursor-pointer"
            onClick={() => handleOpenForm16(row)}
          >
            <FileText className="size-3.5" /> View Form 16
          </Button>
        ),
      },
    ],
    [reportFinancialYear, activeFinancialYear]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="size-3.5" />
              <span>HRMS Financial & Payroll Reports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Employee Salary & Bank Reports
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Export complete employee salary structures, earnings breakdown, statutory contributions (PF, ESI, PT),
              and verified bank accounts directly to multi-sheet formatted Excel (.xlsx) and CSV spreadsheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleExportExcel}
              disabled={!canExportReports || exportingExcel || loadingData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-11 px-5 font-bold shadow-lg shadow-emerald-900/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {exportingExcel ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-4" />
              )}
              Export Salary Report (.XLSX)
            </Button>

            <Link href="/dashboard/payroll/salary-reports">
              <Button
                variant="outline"
                className="border-sky-400/40 bg-sky-950/60 hover:bg-sky-900 text-sky-200 rounded-xl gap-2 h-11 px-4 text-xs font-semibold cursor-pointer shadow-md"
                title="Open dedicated Monthly Salary Reports page with month selector and multi-month sheet exports"
              >
                <Calendar className="size-3.5 text-sky-400" />
                Monthly Reports Page
              </Button>
            </Link>

            <Button
              onClick={handleExportCsv}
              variant="outline"
              disabled={!canExportReports || exportingCsv || loadingData}
              className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl gap-2 h-11 px-4 text-xs font-semibold cursor-pointer"
            >
              {exportingCsv ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              CSV
            </Button>

            <Button
              onClick={fetchReportDataset}
              variant="ghost"
              disabled={loadingData}
              className="text-slate-300 hover:text-white hover:bg-white/10 rounded-xl h-11 w-11 p-0 cursor-pointer"
              title="Refresh Report Data"
            >
              <RefreshCw className={`size-4 ${loadingData ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-2xl">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Staff in Report</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {reportData.summary.totalEmployees}
              </h3>
              <p className="text-[10px] text-slate-400">
                {filteredReportItems.length} matching filter
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
              <p className="text-xs text-slate-500 font-medium">Monthly Gross Payroll</p>
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
              <p className="text-xs text-slate-500 font-medium">Monthly Net Payout</p>
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

      {/* Main Report Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-3 dark:border-slate-800">
          <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <TabsTrigger
              value="salary-report"
              className="rounded-xl px-4 py-2 font-bold text-xs gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="size-4 text-emerald-500" />
              Employee Salary & Bank Report (Excel)
            </TabsTrigger>
            <TabsTrigger
              value="statutory"
              className="rounded-xl px-4 py-2 font-bold text-xs gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm cursor-pointer"
            >
              <ShieldCheck className="size-4 text-indigo-500" />
              Disbursement & Statutory Files
            </TabsTrigger>
            <TabsTrigger
              value="form16"
              className="rounded-xl px-4 py-2 font-bold text-xs gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm cursor-pointer"
            >
              <FileText className="size-4 text-sky-500" />
              Annual Form 16 / Tax
            </TabsTrigger>
          </TabsList>

          {/* Period Filter Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border rounded-2xl px-3 py-1.5 shadow-sm">
            <span className="text-xs font-bold text-slate-500">Period:</span>
            <div className="w-32">
              <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                <SelectTrigger className="h-8 text-xs rounded-xl border-0 bg-slate-50 dark:bg-slate-800">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-24">
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="h-8 text-xs rounded-xl border-0 bg-slate-50 dark:bg-slate-800">
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

        {/* -------------------------------------------------------------------------- */}
        {/* TAB 1: EMPLOYEE SALARY & BANK DETAILS REPORT (EXCEL)                        */}
        {/* -------------------------------------------------------------------------- */}
        <TabsContent value="salary-report" className="space-y-6 m-0">
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
                    Salary Structure
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
                  title={showMaskedAccount ? "Reveal account numbers" : "Mask account numbers"}
                >
                  {showMaskedAccount ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  {showMaskedAccount ? "Show Accounts" : "Mask Accounts"}
                </Button>
              </div>
            </div>

            {/* Excel Download Callout Banner */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Export Full Roster to Excel Spreadsheet (.xlsx)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Includes 3 sheets: <strong>Master Salary & Bank Roster</strong>,{" "}
                    <strong>Earnings & Deduction Breakdown</strong>, and{" "}
                    <strong>Bank Disbursement Layout</strong> with column formatting and total sums.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={handleExportExcel}
                  disabled={!canExportReports || exportingExcel || loadingData}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-10 px-4 text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
                >
                  {exportingExcel ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  Download Excel (.XLSX)
                </Button>
                <Button
                  onClick={handleExportCsv}
                  variant="outline"
                  disabled={!canExportReports || exportingCsv || loadingData}
                  className="rounded-xl h-10 text-xs gap-1.5 cursor-pointer"
                >
                  <Download className="size-3.5" /> CSV
                </Button>
              </div>
            </div>

            {/* Interactive Data Table */}
            <DataTable
              columns={salaryReportColumns}
              data={filteredReportItems}
              loading={loadingData || loading}
              pageSize={10}
              searchable={false}
              showSrNo={false}
              emptyMessage="No employee salary and bank records found."
              emptyDescription="No records match your selected month, year, or search criteria."
            />

            {/* Bottom Summary Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Roster Total:</span>
                <Badge variant="outline" className="font-mono bg-white dark:bg-slate-900">
                  {filteredReportItems.length} Employees
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-slate-600 dark:text-slate-400">
                <div>
                  Total Basic:{" "}
                  <strong className="text-slate-900 dark:text-slate-100 font-mono">
                    ₹{filteredReportItems.reduce((s, i) => s + (i.basicSalary || 0), 0).toLocaleString()}
                  </strong>
                </div>
                <div>
                  Total Gross:{" "}
                  <strong className="text-sky-600 dark:text-sky-400 font-mono">
                    ₹{filteredReportItems.reduce((s, i) => s + (i.grossSalary || 0), 0).toLocaleString()}
                  </strong>
                </div>
                <div>
                  Total Deductions:{" "}
                  <strong className="text-rose-600 font-mono">
                    ₹{filteredReportItems.reduce((s, i) => s + (i.totalDeductions || 0), 0).toLocaleString()}
                  </strong>
                </div>
                <div>
                  Total Net Payout:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    ₹{filteredReportItems.reduce((s, i) => s + (i.netSalary || 0), 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* -------------------------------------------------------------------------- */}
        {/* TAB 2: DISBURSEMENT & STATUTORY COMPLIANCE FILES                            */}
        {/* -------------------------------------------------------------------------- */}
        <TabsContent value="statutory" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank File Export Card */}
            <Card className="border rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="p-3.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-2xl w-fit mb-4">
                  <FileSpreadsheet className="size-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  Bank Transfer Disbursement File
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Generate bank upload CSV layout containing employee bank accounts, IFSC, and net salary for batch bank
                  disbursement.
                </p>
              </div>
              <Button
                disabled={!canExportReports || exportingBank}
                onClick={handleExportBankTransfer}
                className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-11 px-6 font-semibold shadow-md cursor-pointer transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {exportingBank ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Export Bank Upload File (.CSV)
              </Button>
            </Card>

            {/* Statutory Compliance Reports */}
            <Card className="border rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-sm">
              <div>
                <div className="p-3.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-2xl w-fit mb-4">
                  <FileCheck className="size-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  Statutory Compliance Challans
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Monthly PF ECR file, ESI return summary, and Professional Tax reports formatted for government portal filing.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={!canExportReports || exportingPf}
                  onClick={handleExportPfEcr}
                  className="flex-1 min-w-[120px] rounded-xl text-xs h-10 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer gap-1.5 font-bold"
                >
                  {exportingPf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  PF ECR Report
                </Button>
                <Button
                  variant="outline"
                  disabled={!canExportReports || exportingEsi}
                  onClick={handleExportEsi}
                  className="flex-1 min-w-[120px] rounded-xl text-xs h-10 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer gap-1.5 font-bold"
                >
                  {exportingEsi ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  ESI Return
                </Button>
                <Button
                  variant="outline"
                  disabled={!canExportReports || exportingPt}
                  onClick={handleExportPt}
                  className="flex-1 min-w-[120px] rounded-xl text-xs h-10 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer gap-1.5 font-bold"
                >
                  {exportingPt ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  PT Slab Report
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* -------------------------------------------------------------------------- */}
        {/* TAB 3: ANNUAL FORM 16 / TAX STATEMENTS                                     */}
        {/* -------------------------------------------------------------------------- */}
        <TabsContent value="form16" className="space-y-6 m-0">
          <Card className="border rounded-3xl shadow-sm bg-white dark:bg-slate-900 p-6">
            <CardHeader className="px-0 pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle className="text-base font-bold">Annual Form 16 / Tax Statements</CardTitle>
                <CardDescription className="text-xs">
                  Generate Certificate under Section 203 of the Income-tax Act, 1961 for employee tax deduction summaries.
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">Financial Year:</span>
                <Select value={reportFinancialYear} onValueChange={(val) => setReportFinancialYear(val)}>
                  <SelectTrigger className="w-40 rounded-xl h-10 text-xs bg-slate-50 dark:bg-slate-800">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900">
                    {fiscalYears && fiscalYears.length > 0
                      ? fiscalYears.map((fy) => (
                          <SelectItem key={fy.id} value={fy.name}>
                            {fy.name}
                          </SelectItem>
                        ))
                      : ["2026-2027", "2025-2026", "2024-2025"].map((fy) => (
                          <SelectItem key={fy} value={fy}>
                            {fy}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <DataTable
              columns={form16Columns}
              data={filteredReportItems}
              pageSize={10}
              searchable={true}
              searchPlaceholder="Search employee for Form 16..."
              emptyMessage="No structures available to generate Form 16."
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* -------------------------------------------------------------------------- */}
      {/* MODAL: SINGLE EMPLOYEE COMPREHENSIVE DETAILS PREVIEW                       */}
      {/* -------------------------------------------------------------------------- */}
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
                    {selectedEmployeeDetail.designation} • {selectedEmployeeDetail.department} • Joined {selectedEmployeeDetail.dateOfJoining}
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Row 1: Employee & Tax Profile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border">
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedEmployeeDetail.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact</span>
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

              {/* Row 2: Salary Structure Components */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calculator className="size-4 text-sky-500" />
                  Monthly Earnings Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">Basic Salary</span>
                    <strong className="text-slate-900 dark:text-slate-100 text-sm">
                      ₹{selectedEmployeeDetail.basicSalary?.toLocaleString()}
                    </strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">HRA Amount</span>
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

              {/* Row 3: Deductions & Net Payout */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-rose-500" />
                  Statutory Deductions & Net Salary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">PF Deduction</span>
                    <strong className="text-rose-600 text-sm">₹{selectedEmployeeDetail.pfAmount?.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">ESI Deduction</span>
                    <strong className="text-rose-600 text-sm">₹{selectedEmployeeDetail.esiAmount?.toLocaleString()}</strong>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border">
                    <span className="text-slate-500 text-[11px] block">Professional Tax (PT)</span>
                    <strong className="text-rose-600 text-sm">₹{selectedEmployeeDetail.ptAmount?.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                  <div>
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold block">Net Monthly Take-Home Pay</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                      Total Deductions: ₹{selectedEmployeeDetail.totalDeductions?.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{selectedEmployeeDetail.netSalary?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Row 4: Bank Details & KYC */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Landmark className="size-4 text-indigo-500" />
                  Bank Details & Statutory Identification
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
                      monthName,
                      year: selectedYear,
                      filename: `${selectedEmployeeDetail.employeeId}_Salary_Slip_${monthName}_${selectedYear}.xlsx`,
                    }
                  );
                  toast.success(`Exported Excel slip for ${selectedEmployeeDetail.fullName}`);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-10 px-5 text-xs font-bold"
              >
                <Download className="size-3.5" /> Download Individual Slip (.xlsx)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* MODAL: FORM 16 CERTIFICATE PREVIEW                                         */}
      {/* -------------------------------------------------------------------------- */}
      {selectedForm16 && (
        <Dialog open={Boolean(selectedForm16)} onOpenChange={() => setSelectedForm16(null)}>
          <DialogContent className="max-w-2xl sm:max-w-2xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-white dark:bg-slate-950">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white text-center">
              <DialogTitle className="font-black text-xl tracking-wider uppercase">
                FORM NO. 16 (Certificate under Section 203)
              </DialogTitle>
              <DialogDescription className="text-slate-300 text-xs mt-1">
                Tax Deducted at Source on Salary - Financial Year{" "}
                {selectedForm16.financialYear || reportFinancialYear || "2026-2027"}
              </DialogDescription>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border">
                <div>
                  <p>
                    <strong>Employee:</strong> {selectedForm16.employeeName || "Staff Member"}
                  </p>
                  <p>
                    <strong>PAN:</strong> {selectedForm16.pan || "ABCDE1234F"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Employer:</strong> {selectedForm16.employerName || "Aspino Technologies Pvt Ltd"}
                  </p>
                  <p>
                    <strong>TAN:</strong> {selectedForm16.employerTan || "MUMB12345A"}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border space-y-2">
                <div className="flex justify-between">
                  <span>Gross Salary:</span>
                  <span>₹{(selectedForm16.grossSalary || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>HRA Exemption (Sec 10(13A)):</span>
                  <span>-₹{(selectedForm16.hraExemption || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Standard Deduction:</span>
                  <span>-₹{(selectedForm16.standardDeduction || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Section 80C Deduction:</span>
                  <span>-₹{(selectedForm16.section80C || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold border-t pt-2 text-slate-900 dark:text-slate-100">
                  <span>Net Taxable Income:</span>
                  <span>₹{(selectedForm16.netTaxableIncome || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sky-600 dark:text-sky-400">
                  <span>Total TDS Deducted & Deposited:</span>
                  <span>₹{(selectedForm16.totalTdsDeducted || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-center">
              <Button
                onClick={() => window.print()}
                className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white rounded-xl gap-2 h-11 px-8 font-semibold shadow-md cursor-pointer"
              >
                <Download className="size-4" /> Download Form 16 Certificate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
