"use client";

import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "@/lib/api";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import {
  fetchPayrollEmployees,
  fetchSalaryStructures,
  setupSalaryStructure,
  fetchRentReceipts,
  submitRentReceipt,
  verifyRentReceipt,
  fetchTaxDeclarations,
  submitTaxDeclaration,
  fetchLoans,
  createLoan,
  runMonthlyPayroll,
  approvePayrollRun,
  fetchPayrollRun,
  fetchPayslips,
  deleteSalaryStructure,
  fetchActiveFinancialYear,
} from "@/features/payroll/store/payrollSlice";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/ui/data-table";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Banknote,
  Building2,
  Calculator,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Home,
  Info,
  Layers,
  Plus,
  Receipt,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Wallet,
  Sparkles,
  DollarSign,
  Briefcase,
  X,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";


export default function PayslipsTab() {

  const dispatch = useDispatch();
  const {
    employees = [],
    salaryStructures = [],
    rentReceipts = [],
    taxDeclarations = [],
    loans = [],
    currentRun = null,
    payslips = [],
    loading = false,
    activeFinancialYear = "",
  } = useSelector((state) => state.payroll || {});

  const activeTab = "payslips";
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");

  // Dialog States
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [isRentOpen, setIsRentOpen] = useState(false);
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [selectedForm16, setSelectedForm16] = useState(null);

  // Form States
  const defaultStructForm = {
    employeeId: "",
    basicSalary: "",
    cityCategory: "METRO",
    hraPercent: 50,
    da: "",
    conveyance: "",
    specialAllowance: "",
    statutoryBonus: "",
    reimbursements: "",
    pfEnabled: true,
    esiEnabled: false,
    ptEnabled: true,
    taxRegime: "NEW",
  };
  const [structForm, setStructForm] = useState(defaultStructForm);
  const [structErrors, setStructErrors] = useState({});

  const resetStructForm = () => {
    setStructForm(defaultStructForm);
    setStructErrors({});
  };

  const [rentForm, setRentForm] = useState({
    employeeId: "",
    financialYear: activeFinancialYear || "2026-2027",
    landlordName: "",
    landlordPan: "",
    landlordAddress: "",
    monthlyRent: "",
  });
  const [rentErrors, setRentErrors] = useState({});
  const [fiscalYears, setFiscalYears] = useState([]);

  useEffect(() => {
    async function fetchFiscalYears() {
      try {
        const res = await apiFetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/staff-hrms/recruitment/fiscal-years?limit=100`);
        const data = await res.json();
        if (data && data.data) {
          setFiscalYears(data.data.filter(fy => fy.isActive !== false));
        }
      } catch (e) {
        console.error("Error fetching fiscal years:", e);
      }
    }
    fetchFiscalYears();
  }, []);

  const [taxForm, setTaxForm] = useState({
    employeeId: "",
    financialYear: activeFinancialYear || "2026-2027",
    regime: "NEW",
    section80C: "",
    section80D: "",
    section80G: "",
    otherDeductions: "",
  });
  const [taxErrors, setTaxErrors] = useState({});

  const [loanForm, setLoanForm] = useState({
    employeeId: "",
    loanType: "LOAN",
    principalAmount: "",
    monthlyInstallment: "",
  });
  const [loanErrors, setLoanErrors] = useState({});

  // Pagination states
  const [structPage, setStructPage] = useState(1);
  const [structLimit, setStructLimit] = useState(10);
  const [structSearch, setStructSearch] = useState("");
  const [deleteStructId, setDeleteStructId] = useState(null);

  const [payslipPage, setPayslipPage] = useState(1);
  const [payslipLimit, setPayslipLimit] = useState(10);
  const [payslipSearch, setPayslipSearch] = useState("");

    useEffect(() => {
    if (activeFinancialYear) {
      setRentForm(prev => ({ ...prev, financialYear: activeFinancialYear }));
      setTaxForm(prev => ({ ...prev, financialYear: activeFinancialYear }));
    }
  }, [activeFinancialYear]);

  useEffect(() => {
    if (activeTab === "structures") {
      dispatch(fetchPayrollEmployees());
    } else if (activeTab === "hra") {
      dispatch(fetchPayrollEmployees());
      dispatch(fetchRentReceipts());
      dispatch(fetchTaxDeclarations());
      dispatch(fetchActiveFinancialYear());
    } else if (activeTab === "loans") {
      dispatch(fetchPayrollEmployees());
      dispatch(fetchLoans());
    } else if (activeTab === "run") {
      dispatch(fetchPayrollRun({ month: selectedMonth, year: selectedYear }));
    }
  }, [dispatch, selectedMonth, selectedYear]);

  useEffect(() => {
    if (Array.isArray(employees) && employees.length > 0) {
      const firstId = employees[0].id;
      setStructForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: firstId }));
      setRentForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: firstId }));
      setTaxForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: firstId }));
      setLoanForm((prev) => (prev.employeeId ? prev : { ...prev, employeeId: firstId }));
    }
  }, [employees]);

  useEffect(() => {
    dispatch(fetchSalaryStructures({ page: structPage, limit: structLimit, search: structSearch }));
  }, [dispatch, structPage, structLimit, structSearch]);

  useEffect(() => {
    dispatch(
      fetchPayslips({
        page: payslipPage,
        limit: payslipLimit,
        search: payslipSearch,
        month: selectedMonth && selectedMonth !== "ALL" ? Number(selectedMonth) : undefined,
        year: selectedYear && selectedYear !== "ALL" ? Number(selectedYear) : undefined,
      })
    );
  }, [dispatch, payslipPage, payslipLimit, payslipSearch, selectedMonth, selectedYear]);

  // Calculations for Structure Modal Live Preview
  const calculatedHra = (Number(structForm.basicSalary) * Number(structForm.hraPercent)) / 100;
  const calculatedGross =
    Number(structForm.basicSalary) +
    calculatedHra +
    Number(structForm.da) +
    Number(structForm.conveyance) +
    Number(structForm.specialAllowance) +
    Number(structForm.statutoryBonus) +
    Number(structForm.reimbursements);

  // Handlers
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!structForm.employeeId) errors.employeeId = "Please select an employee.";
    if (structForm.basicSalary === "" || Number(structForm.basicSalary) < 0) errors.basicSalary = "Basic salary is required.";
    if (structForm.da === "" || Number(structForm.da) < 0) errors.da = "Dearness allowance is required.";
    if (structForm.conveyance === "" || Number(structForm.conveyance) < 0) errors.conveyance = "Conveyance allowance is required.";
    if (structForm.specialAllowance === "" || Number(structForm.specialAllowance) < 0) errors.specialAllowance = "Special allowance is required.";
    if (structForm.statutoryBonus === "" || Number(structForm.statutoryBonus) < 0) errors.statutoryBonus = "Statutory bonus is required.";
    if (structForm.reimbursements === "" || Number(structForm.reimbursements) < 0) errors.reimbursements = "Reimbursements field is required.";

    if (Object.keys(errors).length > 0) {
      setStructErrors(errors);
      return;
    }
    
    setStructErrors({});
    await dispatch(setupSalaryStructure({
      ...structForm,
      basicSalary: Number(structForm.basicSalary) || 0,
      da: Number(structForm.da) || 0,
      conveyance: Number(structForm.conveyance) || 0,
      specialAllowance: Number(structForm.specialAllowance) || 0,
      statutoryBonus: Number(structForm.statutoryBonus) || 0,
      reimbursements: Number(structForm.reimbursements) || 0,
    }));
    setIsStructureOpen(false);
    resetStructForm();
    dispatch(fetchSalaryStructures({ page: structPage, limit: structLimit, search: structSearch }));
  };

  const handleDeleteStructure = async (id) => {
    await dispatch(deleteSalaryStructure(id));
    setDeleteStructId(null);
  };

  const handleSubmitRent = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!rentForm.employeeId) errors.employeeId = "Employee is required.";
    if (!rentForm.financialYear) errors.financialYear = "Financial Year is required.";
    if (rentForm.monthlyRent === "" || Number(rentForm.monthlyRent) <= 0) errors.monthlyRent = "Valid monthly rent is required.";
    if (!rentForm.landlordName) errors.landlordName = "Landlord name is required.";
    if (!rentForm.landlordAddress) errors.landlordAddress = "Landlord address is required.";

    if (Object.keys(errors).length > 0) {
      setRentErrors(errors);
      return;
    }
    setRentErrors({});
    await dispatch(submitRentReceipt({...rentForm, monthlyRent: Number(rentForm.monthlyRent)}));
    setIsRentOpen(false);
    dispatch(fetchRentReceipts());
  };

  const handleVerifyRent = async (id, status) => {
    await dispatch(verifyRentReceipt({ id, status, verifiedBy: "HR Admin" }));
    dispatch(fetchRentReceipts());
  };

  const handleSubmitTax = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!taxForm.employeeId) errors.employeeId = "Employee is required.";
    if (!taxForm.financialYear) errors.financialYear = "Financial Year is required.";
    if (!taxForm.regime) errors.regime = "Regime is required.";
    if (taxForm.section80C === "" || Number(taxForm.section80C) < 0) errors.section80C = "Valid amount is required.";
    if (taxForm.section80D === "" || Number(taxForm.section80D) < 0) errors.section80D = "Valid amount is required.";
    if (taxForm.section80G === "" || Number(taxForm.section80G) < 0) errors.section80G = "Valid amount is required.";
    if (taxForm.otherDeductions === "" || Number(taxForm.otherDeductions) < 0) errors.otherDeductions = "Valid amount is required.";

    if (Object.keys(errors).length > 0) {
      setTaxErrors(errors);
      return;
    }
    setTaxErrors({});
    await dispatch(submitTaxDeclaration({...taxForm, section80C: Number(taxForm.section80C), section80D: Number(taxForm.section80D), section80G: Number(taxForm.section80G), otherDeductions: Number(taxForm.otherDeductions)}));
    setIsTaxOpen(false);
    dispatch(fetchTaxDeclarations());
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!loanForm.employeeId) errors.employeeId = "Employee is required.";
    if (!loanForm.loanType) errors.loanType = "Loan Type is required.";
    if (loanForm.principalAmount === "" || Number(loanForm.principalAmount) <= 0) errors.principalAmount = "Valid principal is required.";
    if (loanForm.monthlyInstallment === "" || Number(loanForm.monthlyInstallment) <= 0) errors.monthlyInstallment = "Valid installment is required.";

    if (Object.keys(errors).length > 0) {
      setLoanErrors(errors);
      return;
    }
    setLoanErrors({});
    await dispatch(createLoan({...loanForm, principalAmount: Number(loanForm.principalAmount), monthlyInstallment: Number(loanForm.monthlyInstallment)}));
    setIsLoanOpen(false);
    dispatch(fetchLoans());
  };

  const handleRunPayroll = async () => {
    await dispatch(runMonthlyPayroll({ month: Number(selectedMonth), year: Number(selectedYear) }));
  };

  const handleApproveRun = async () => {
    await dispatch(approvePayrollRun({ month: Number(selectedMonth), year: Number(selectedYear), approvedBy: "Finance Director" }));
  };

  const handleExportBankTransfer = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    window.open(`${backendUrl}/staff-hrms/payroll/export/bank-transfer?month=${selectedMonth}&year=${selectedYear}`, "_blank");
  };

  const handleOpenForm16 = async (employeeId) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${backendUrl}/staff-hrms/payroll/export/form16/${employeeId}?financialYear=2026-2027`);
    if (res.ok) {
      const data = await res.json();
      setSelectedForm16(data);
    }
  };

  const salaryStructureColumns = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => (
        <span className="font-semibold">
          {row.employee ? `${row.employee.firstName} ${row.employee.lastName} (${row.employee.employeeId})` : row.employeeId}
        </span>
      ),
    },
    {
      key: "cityCategory",
      label: "City Category",
      render: (row) => (
        <Badge variant="outline" className={row.cityCategory === "METRO" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
          {row.cityCategory}
        </Badge>
      ),
    },
    {
      key: "basicSalary",
      label: "Basic Salary",
      render: (row) => <span className="font-medium text-slate-900 dark:text-slate-100">₹{row.basicSalary.toLocaleString()}</span>,
    },
    {
      key: "hraAmount",
      label: "HRA",
      render: (row) => <span className="text-emerald-600 font-medium">₹{row.hraAmount.toLocaleString()}</span>,
    },
    {
      key: "da_allowances",
      label: "DA / Allowances",
      render: (row) => `₹${(row.da + row.conveyance + row.specialAllowance).toLocaleString()}`,
    },
    {
      key: "grossSalary",
      label: "Gross Monthly Salary",
      render: (row) => <span className="font-extrabold text-sky-600 dark:text-sky-400">₹{row.grossSalary.toLocaleString()}</span>,
    },
    {
      key: "statutoryFlags",
      label: "Statutory Flags",
      sortable: false,
      render: (row) => (
        <div className="space-x-1">
          {row.pfEnabled && <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">PF</Badge>}
          {row.esiEnabled && <Badge className="bg-amber-100 text-amber-800 text-[10px]">ESI</Badge>}
          {row.ptEnabled && <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">PT</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-sky-500 hover:text-white hover:border-sky-500 dark:hover:bg-sky-500 rounded-lg transition-all cursor-pointer"
            title="Edit Structure"
            onClick={() => {
              setStructForm({
                employeeId: row.employeeId,
                basicSalary: row.basicSalary,
                cityCategory: row.cityCategory,
                hraPercent: row.hraPercent,
                da: row.da,
                conveyance: row.conveyance,
                specialAllowance: row.specialAllowance,
                statutoryBonus: row.statutoryBonus,
                reimbursements: row.reimbursements,
                pfEnabled: row.pfEnabled,
                esiEnabled: row.esiEnabled,
                ptEnabled: row.ptEnabled,
                taxRegime: row.taxRegime,
              });
              setIsStructureOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
            title="Delete Structure"
            onClick={() => setDeleteStructId(row.id)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const rentReceiptColumns = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => <span className="font-semibold">{row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : row.employeeId}</span>
    },
    {
      key: "landlord",
      label: "Landlord",
      render: (row) => (
        <div className="text-xs">
          <p className="font-medium text-slate-900 dark:text-slate-100">{row.landlordName}</p>
          <p className="text-slate-500">PAN: {row.landlordPan || "N/A"}</p>
        </div>
      )
    },
    { key: "monthlyRent", label: "Monthly Rent", render: (row) => `₹${row.monthlyRent.toLocaleString()}` },
    { key: "annualRent", label: "Annual Rent", render: (row) => `₹${row.annualRent.toLocaleString()}` },
    { 
      key: "exemption", 
      label: "Auto Computed HRA Exemption", 
      render: (row) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          {row.status === "APPROVED" ? `₹${row.calculatedExemption.toLocaleString()}/yr` : "Pending Verification"}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge className={row.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : row.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}>
          {row.status}
        </Badge>
      )
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="space-x-2">
          {row.status === "SUBMITTED" && (
            <>
              <Button size="sm" className="bg-emerald-600 text-white h-7 text-xs rounded-lg" onClick={() => handleVerifyRent(row.id, "APPROVED")}>Approve</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 rounded-lg" onClick={() => handleVerifyRent(row.id, "REJECTED")}>Reject</Button>
            </>
          )}
        </div>
      )
    }
  ];

  const loanColumns = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => <span className="font-semibold">{row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : row.employeeId}</span>
    },
    { key: "loanType", label: "Type", render: (row) => <Badge variant="outline">{row.loanType}</Badge> },
    { key: "principalAmount", label: "Principal Amount", render: (row) => <span className="font-medium">₹{row.principalAmount.toLocaleString()}</span> },
    { key: "monthlyInstallment", label: "Monthly Installment", render: (row) => <span className="text-amber-600 font-bold">₹{row.monthlyInstallment.toLocaleString()}/mo</span> },
    { key: "balanceRemaining", label: "Remaining Balance", render: (row) => <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{row.balanceRemaining.toLocaleString()}</span> },
    { key: "status", label: "Status", render: (row) => <Badge className={row.status === "ACTIVE" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}>{row.status}</Badge> }
  ];

  const payslipPreviewColumns = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => <span className="font-semibold">{row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : row.employeeId}</span>
    },
    {
      key: "days",
      label: "Payable Days / LWP",
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900">{row.payableDays} days</span>
          {row.lwpDays > 0 && <span className="text-rose-600 block">({row.lwpDays} LWP)</span>}
        </div>
      )
    },
    {
      key: "basic",
      label: "Basic + HRA + DA",
      render: (row) => <span className="text-xs">₹{row.basicSalary.toLocaleString()} + ₹{row.hra.toLocaleString()} + ₹{row.da.toLocaleString()}</span>
    },
    { key: "grossEarnings", label: "Gross Pay", render: (row) => <span className="font-bold text-sky-600">₹{row.grossEarnings.toLocaleString()}</span> },
    { key: "deductions", label: "PF / ESI / PT", render: (row) => <span className="text-xs text-slate-600">₹{row.pfDeduction} / ₹{row.esiDeduction} / ₹{row.ptDeduction}</span> },
    { key: "taxes", label: "TDS / Loan", render: (row) => <span className="text-xs text-amber-700">₹{row.tdsDeduction} / ₹{row.loanRecovery}</span> },
    { key: "netSalary", label: "Net Pay", render: (row) => <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{row.netSalary.toLocaleString()}</span> }
  ];

  const payslipColumns = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => <span className="font-semibold">{row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : row.employeeId}</span>
    },
    {
      key: "period",
      label: "Period",
      render: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {new Date(2026, row.month - 1, 1).toLocaleString("default", { month: "long" })} {row.year}
        </span>
      )
    },
    {
      key: "days",
      label: "Payable / OT / LWP",
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.payableDays} days</span>
          {row.otHours > 0 && <span className="text-amber-600 font-bold block">+{row.otHours}h Extra/OT</span>}
          {row.lwpDays > 0 && <span className="text-rose-600 block">({row.lwpDays} LWP)</span>}
        </div>
      )
    },
    { key: "grossEarnings", label: "Gross Pay (Inc. OT)", render: (row) => <span className="font-bold text-sky-600">₹{row.grossEarnings.toLocaleString()}</span> },
    { key: "totalDeductions", label: "Deductions", render: (row) => <span className="font-bold text-rose-600">-₹{row.totalDeductions.toLocaleString()}</span> },
    { key: "netSalary", label: "Net Pay", render: (row) => <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{row.netSalary.toLocaleString()}</span> },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <Button variant="outline" size="sm" className="text-xs rounded-xl gap-2 h-9" onClick={() => setSelectedPayslip(row)}>
          <FileText className="size-4" /> View Payslip
        </Button>
      )
    }
  ];

  const form16Columns = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => <span className="font-semibold">{row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : row.employeeId}</span>
    },
    { key: "financialYear", label: "Financial Year", render: () => "2026-2027" },
    { key: "status", label: "Status", render: () => <Badge className="bg-emerald-100 text-emerald-800">Generated</Badge> },
    {
      key: "action",
      label: "Action",
      sortable: false,
      render: (row) => (
        <Button size="sm" variant="outline" className="text-xs rounded-xl gap-2 h-9" onClick={() => handleOpenForm16(row.employeeId)}>
          <FileText className="size-3.5" /> View Form 16 Summary
        </Button>
      )
    }
  ];

  
  return (
    <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Digital Payslips Portal</h2>
              <p className="text-sm text-slate-500">Generate and view itemized digital payslips for employees.</p>
            </div>
          </div>

          <Card className="border rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Disbursed Digital Payslips</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-40">
                  <SearchableSelect
                    options={[
                      { value: "ALL", label: "All Months" },
                      ...Array.from({ length: 12 }, (_, i) => ({
                        value: String(i + 1),
                        label: new Date(2026, i, 1).toLocaleString("default", { month: "long" }),
                      })),
                    ]}
                    value={selectedMonth}
                    onValueChange={(val) => { setSelectedMonth(val); setPayslipPage(1); }}
                    placeholder="Month"
                    searchPlaceholder="Search month..."
                    className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="w-32">
                  <SearchableSelect
                    options={[
                      { value: "ALL", label: "All Years" },
                      ...[2024, 2025, 2026, 2027, 2028].map((y) => ({
                        value: String(y),
                        label: String(y),
                      })),
                    ]}
                    value={selectedYear}
                    onValueChange={(val) => { setSelectedYear(val); setPayslipPage(1); }}
                    placeholder="Year"
                    searchPlaceholder="Search year..."
                    className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => dispatch(fetchPayslips({
                    page: payslipPage,
                    limit: payslipLimit,
                    search: payslipSearch,
                    month: selectedMonth && selectedMonth !== "ALL" ? Number(selectedMonth) : undefined,
                    year: selectedYear && selectedYear !== "ALL" ? Number(selectedYear) : undefined,
                  }))}
                  className="text-xs font-bold rounded-xl h-9 gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="size-3.5 text-sky-500" /> Refresh Payslips
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <DataTable
                columns={payslipColumns}
                data={payslips?.data || []}
                totalRecords={payslips?.total || 0}
                lazy={true}
                loading={loading}
                page={payslipPage}
                rows={payslipLimit}
                search={payslipSearch}
                onPageChange={(page) => setPayslipPage(page)}
                onRowsChange={(rows) => {
                  setPayslipLimit(rows);
                  setPayslipPage(1);
                }}
                onSearchChange={(search) => {
                  setPayslipSearch(search);
                  setPayslipPage(1);
                }}
                emptyMessage="No digital payslips found for selected period."
              />
            </div>
          </Card>

          {/* ENHANCED MODAL 5: PAYSLIP DETAIL MODAL */}
          {selectedPayslip && (
            <Dialog open={Boolean(selectedPayslip)} onOpenChange={() => setSelectedPayslip(null)}>
              <DialogContent className="max-w-3xl sm:max-w-3xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-white dark:bg-slate-950">
                <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-6 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-xl tracking-tight">ASPINO TECHNOLOGIES PVT LTD</h3>
                    <p className="text-slate-300 text-xs mt-0.5">
                      Digital Payslip - {new Date(2026, selectedPayslip.month - 1, 1).toLocaleString("default", { month: "long" })} {selectedPayslip.year}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-3 py-1 text-xs">CONFIDENTIAL</Badge>
                </div>

                <div className="p-6 space-y-6">
                  {/* Employee Details Header Card */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border text-xs">
                    <div className="space-y-1">
                      <p><span className="text-slate-500">Employee Name:</span> <strong className="text-slate-900 dark:text-slate-100">{selectedPayslip.employee ? `${selectedPayslip.employee.firstName} ${selectedPayslip.employee.lastName}` : selectedPayslip.employeeId}</strong></p>
                      <p><span className="text-slate-500">Department:</span> <strong>{selectedPayslip.employee?.department || "Engineering"}</strong></p>
                      <p><span className="text-slate-500">Designation:</span> <strong>{selectedPayslip.employee?.designation || "Staff"}</strong></p>
                    </div>
                    <div className="space-y-1">
                      <p><span className="text-slate-500">Payable Days:</span> <strong>{selectedPayslip.payableDays} / {selectedPayslip.totalDays}</strong></p>
                      <p><span className="text-slate-500">OT / Extra Shifts:</span> <strong className="text-amber-600 font-bold">{selectedPayslip.otHours || 0} Hours (Double Rate 2×)</strong></p>
                      {selectedPayslip.lwpDays > 0 && (
                        <p>
                          <span className="text-slate-500">LWP Days (Unpaid):</span>{" "}
                          <strong className="text-rose-600 font-bold">
                            {selectedPayslip.lwpDays} Days (-₹{Math.round((selectedPayslip.grossEarnings / (selectedPayslip.payableDays / selectedPayslip.totalDays)) * (selectedPayslip.lwpDays / selectedPayslip.totalDays)).toLocaleString()})
                          </strong>
                        </p>
                      )}
                      <p><span className="text-slate-500">Bank Account:</span> <strong>{selectedPayslip.accountNumber}</strong></p>
                      <p><span className="text-slate-500">IFSC Code:</span> <strong>{selectedPayslip.ifscCode}</strong></p>
                    </div>
                  </div>

                  {/* Earnings vs Deductions Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-sky-900 dark:text-sky-400 border-b pb-2 mb-3">EARNINGS (₹)</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span>Basic Salary:</span><span className="font-medium">₹{selectedPayslip.basicSalary.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>HRA:</span><span className="font-medium">₹{selectedPayslip.hra.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Dearness Allowance:</span><span className="font-medium">₹{selectedPayslip.da.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Conveyance:</span><span className="font-medium">₹{selectedPayslip.conveyance.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Special Allowance:</span><span className="font-medium">₹{selectedPayslip.specialAllowance.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Statutory Bonus:</span><span className="font-medium">₹{(selectedPayslip.bonus || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Reimbursements:</span><span className="font-medium">₹{(selectedPayslip.reimbursements || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between font-extrabold border-t pt-2 text-slate-900 dark:text-slate-100"><span>Total Gross:</span><span>₹{selectedPayslip.grossEarnings.toLocaleString()}</span></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-400 border-b pb-2 mb-3">DEDUCTIONS (₹)</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span>Provident Fund (PF):</span><span className="font-medium">₹{selectedPayslip.pfDeduction.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>ESI:</span><span className="font-medium">₹{selectedPayslip.esiDeduction.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Professional Tax (PT):</span><span className="font-medium">₹{selectedPayslip.ptDeduction.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>TDS (Income Tax):</span><span className="font-medium">₹{selectedPayslip.tdsDeduction.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Loan Recovery:</span><span className="font-medium">₹{selectedPayslip.loanRecovery.toLocaleString()}</span></div>
                        <div className="flex justify-between font-extrabold border-t pt-2 text-rose-600"><span>Total Deductions:</span><span>₹{selectedPayslip.totalDeductions.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Net Salary Banner */}
                  <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-4 rounded-2xl flex justify-between items-center text-sm font-extrabold shadow-lg">
                    <span>NET SALARY DISBURSED:</span>
                    <span className="text-emerald-400 text-2xl font-black">₹{selectedPayslip.netSalary.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-6 pt-0 flex justify-center">
                  <Button onClick={() => window.print()} className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white rounded-xl gap-2 h-11 px-8 font-semibold shadow-md">
                    <Download className="size-4" /> Print / Save PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
  );
}
