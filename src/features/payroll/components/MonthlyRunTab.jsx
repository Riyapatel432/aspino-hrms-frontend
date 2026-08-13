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


export default function MonthlyRunTab() {

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

  const activeTab = "run";
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    if (activeTab === "hra") fetchFiscalYears();
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

  const [runPage, setRunPage] = useState(1);
  const [runLimit, setRunLimit] = useState(10);
  const [runSearch, setRunSearch] = useState("");

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
    } else if (activeTab === "payslips") {
      dispatch(fetchPayslips({ month: selectedMonth, year: selectedYear }));
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
        page: runPage,
        limit: runLimit,
        search: runSearch,
        month: selectedMonth,
        year: selectedYear,
      })
    );
  }, [dispatch, runPage, runLimit, runSearch, selectedMonth, selectedYear]);

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
    await dispatch(fetchPayslips({ month: Number(selectedMonth), year: Number(selectedYear) }));
  };

  const handleApproveRun = async () => {
    await dispatch(approvePayrollRun({ month: Number(selectedMonth), year: Number(selectedYear), approvedBy: "Finance Director" }));
    await dispatch(fetchPayslips({ month: Number(selectedMonth), year: Number(selectedYear) }));
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
      render: (row) => <span className="font-semibold text-slate-900 dark:text-slate-100">{row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : row.employeeId}</span>
    },
    {
      key: "days",
      label: "Payable Days / LWP",
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-900 dark:text-slate-100">{row.payableDays} days</span>
          {row.lwpDays > 0 && <span className="text-rose-600 dark:text-rose-400 block">({row.lwpDays} LWP)</span>}
        </div>
      )
    },
    {
      key: "basic",
      label: "Basic + HRA + DA",
      render: (row) => <span className="text-xs text-slate-600 dark:text-slate-400">₹{row.basicSalary.toLocaleString()} + ₹{row.hra.toLocaleString()} + ₹{row.da.toLocaleString()}</span>
    },
    { key: "grossEarnings", label: "Gross Pay", render: (row) => <span className="font-bold text-sky-600 dark:text-sky-400">₹{row.grossEarnings.toLocaleString()}</span> },
    { key: "deductions", label: "PF / ESI / PT", render: (row) => <span className="text-xs text-slate-600 dark:text-slate-400">₹{row.pfDeduction} / ₹{row.esiDeduction} / ₹{row.ptDeduction}</span> },
    { key: "taxes", label: "TDS / Loan", render: (row) => <span className="text-xs text-amber-700 dark:text-amber-500">₹{row.tdsDeduction} / ₹{row.loanRecovery}</span> },
    { key: "netSalary", label: "Net Pay", render: (row) => <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{row.netSalary.toLocaleString()}</span> }
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
          <Card className="border rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-6">
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Select Month</Label>
                  <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                    <SelectTrigger className="w-36 rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Year</Label>
                  <Input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-28 rounded-xl h-10" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleRunPayroll} className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl gap-2 h-10 px-5 shadow-md">
                  <RefreshCw className="size-4" /> Calculate & Preview Payroll
                </Button>
                {currentRun && currentRun.status === "PREVIEW" && (
                  <Button onClick={handleApproveRun} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 h-10 px-5 shadow-md">
                    <CheckCircle2 className="size-4" /> Approve & Lock Payroll
                  </Button>
                )}
              </div>
            </div>

            {/* Run Summary Banner */}
            {currentRun && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Payroll Run Status</span>
                  <div className="mt-1">
                    <Badge className={currentRun.status === "APPROVED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 text-sm" : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 text-sm"}>
                      {currentRun.status}
                    </Badge>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Direct Employees</span>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{currentRun.totalEmployees}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Monthly Gross</span>
                  <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">₹{currentRun.totalGross.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Net Disbursement</span>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">₹{currentRun.totalNet.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Detailed Preview Table */}
            <div className="mt-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">Employee Payroll Breakdown Preview</h3>
              <DataTable
                columns={payslipPreviewColumns}
                data={payslips?.data || []}
                totalRecords={payslips?.total || 0}
                lazy={true}
                loading={loading}
                page={runPage}
                rows={runLimit}
                search={runSearch}
                onPageChange={(page) => setRunPage(page)}
                onRowsChange={(rows) => {
                  setRunLimit(rows);
                  setRunPage(1);
                }}
                onSearchChange={(search) => {
                  setRunSearch(search);
                  setRunPage(1);
                }}
                emptyMessage="Click 'Calculate & Preview Payroll' to auto-import attendance & compute month's earnings."
              />
            </div>
          </Card>
        </div>
  );
}
