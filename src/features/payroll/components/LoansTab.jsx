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
  recordLoanRepayment,
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


export default function LoansTab() {

  const dispatch = useDispatch();
  const { employees, salaryStructures, rentReceipts, taxDeclarations, loans, currentRun, payslips, loading, activeFinancialYear } = useSelector(
    (state) => state.payroll
  );

  const activeTab = "loans";
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

  const [isRepayOpen, setIsRepayOpen] = useState(false);
  const [selectedRepayLoan, setSelectedRepayLoan] = useState(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayError, setRepayError] = useState("");

  // Pagination states
  const [structPage, setStructPage] = useState(1);
  const [structLimit, setStructLimit] = useState(10);
  const [structSearch, setStructSearch] = useState("");
  const [deleteStructId, setDeleteStructId] = useState(null);

  const [loanPage, setLoanPage] = useState(1);
  const [loanLimit, setLoanLimit] = useState(10);
  const [loanSearch, setLoanSearch] = useState("");
  const [loanFilterMonth, setLoanFilterMonth] = useState("");
  const [loanFilterYear, setLoanFilterYear] = useState("");

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
      fetchLoans({
        page: loanPage,
        limit: loanLimit,
        search: loanSearch,
        month: loanFilterMonth && loanFilterMonth !== "ALL" ? Number(loanFilterMonth) : undefined,
        year: loanFilterYear && loanFilterYear !== "ALL" ? Number(loanFilterYear) : undefined,
      })
    );
  }, [dispatch, loanPage, loanLimit, loanSearch, loanFilterMonth, loanFilterYear]);

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
  };

  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    if (!repayAmount || isNaN(Number(repayAmount)) || Number(repayAmount) <= 0) {
      setRepayError("Please enter a valid repayment amount greater than 0.");
      return;
    }
    if (Number(repayAmount) > selectedRepayLoan.balanceRemaining) {
      setRepayError(`Repayment amount cannot exceed remaining balance of ₹${selectedRepayLoan.balanceRemaining.toLocaleString()}.`);
      return;
    }
    setRepayError("");
    await dispatch(recordLoanRepayment({ id: selectedRepayLoan.id, amount: Number(repayAmount) }));
    setIsRepayOpen(false);
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
    {
      key: "repaidAmount",
      label: "Amount Repaid",
      render: (row) => <span className="text-emerald-600 font-semibold">₹{(row.principalAmount - row.balanceRemaining).toLocaleString()}</span>
    },
    { key: "balanceRemaining", label: "Remaining Balance", render: (row) => <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{row.balanceRemaining.toLocaleString()}</span> },
    { key: "monthlyInstallment", label: "Monthly Installment", render: (row) => <span className="text-amber-600 font-bold">₹{row.monthlyInstallment.toLocaleString()}/mo</span> },
    { key: "status", label: "Status", render: (row) => <Badge className={row.status === "ACTIVE" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}>{row.status}</Badge> },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2 justify-end">
          {row.status === "ACTIVE" && row.balanceRemaining > 0 && (
            <button
              className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 dark:hover:bg-emerald-500 rounded-lg transition-all cursor-pointer"
              title="Record Repayment"
              onClick={() => {
                setSelectedRepayLoan(row);
                setRepayAmount("");
                setRepayError("");
                setIsRepayOpen(true);
              }}
            >
              <Banknote className="w-4 h-4" />
            </button>
          )}
          <button
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-sky-500 hover:text-white hover:border-sky-500 dark:hover:bg-sky-500 rounded-lg transition-all cursor-pointer"
            title="Edit Loan"
            onClick={() => {
              setLoanForm({
                id: row.id,
                employeeId: row.employeeId,
                loanType: row.loanType,
                principalAmount: String(row.principalAmount),
                monthlyInstallment: String(row.monthlyInstallment),
              });
              setIsLoanOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    }
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Employee Loans & Salary Advances</h2>
              <p className="text-sm text-slate-500">Automated monthly installment recovery directly from net monthly pay.</p>
            </div>

            {/* ENHANCED MODAL 4: ISSUE LOAN */}
            <Dialog open={isLoanOpen} onOpenChange={setIsLoanOpen}>
              <DialogTrigger asChild>
                <Button className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl gap-2 shadow-md py-2.5" onClick={() => setLoanForm({
                  employeeId: employees[0]?.id || "",
                  loanType: "LOAN",
                  principalAmount: "",
                  monthlyInstallment: "",
                })}>
                  <Plus className="size-4" /> Issue Loan / Advance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl sm:max-w-xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-900 p-6 text-white">
                  <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                    <Wallet className="size-5 text-amber-400" /> {loanForm.id ? "Edit Employee Loan or Salary Advance" : "Issue Employee Loan or Salary Advance"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-300 text-xs mt-1">
                    Set up principal disbursement and monthly auto-recovery installment amount.
                  </DialogDescription>
                </div>
                <form onSubmit={handleCreateLoan} className="p-6 space-y-5">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">Employee</Label>
                      <Select
                        value={loanForm.employeeId}
                        onValueChange={(val) => setLoanForm({ ...loanForm, employeeId: val })}
                      >
                        <SelectTrigger className={`rounded-xl mt-1.5 h-11 ${loanErrors.employeeId ? 'border-red-500 border-2' : ''}`}><SelectValue placeholder="Select Employee" /></SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName} ({emp.employeeId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {loanErrors.employeeId && (
                        <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                          {loanErrors.employeeId}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold">Type</Label>
                        <Select
                          value={loanForm.loanType}
                          onValueChange={(val) => setLoanForm({ ...loanForm, loanType: val })}
                        >
                          <SelectTrigger className="rounded-xl mt-1.5 h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOAN">Personal Loan</SelectItem>
                            <SelectItem value="SALARY_ADVANCE">Salary Advance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Principal Amount (₹)</Label>
                        <Input
                          type="number"
                          value={loanForm.principalAmount}
                          onChange={(e) => setLoanForm({ ...loanForm, principalAmount: e.target.value })}
                          className={`rounded-xl mt-1.5 h-11 ${loanErrors.principalAmount ? 'border-red-500 border-2' : ''}`}
                        />
                        {loanErrors.principalAmount && (
                          <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                            {loanErrors.principalAmount}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Monthly Recovery Installment (₹/mo)</Label>
                      <Input
                        type="number"
                        value={loanForm.monthlyInstallment}
                        onChange={(e) => setLoanForm({ ...loanForm, monthlyInstallment: e.target.value })}
                        className={`rounded-xl mt-1.5 h-11 ${loanErrors.monthlyInstallment ? 'border-red-500 border-2' : ''}`}
                      />
                      {loanErrors.monthlyInstallment && (
                        <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                          {loanErrors.monthlyInstallment}
                        </div>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="gap-3 pt-2">
                    <Button type="button" variant="outline" className="rounded-xl h-11 px-5" onClick={() => setIsLoanOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-11 px-7 font-semibold">{loanForm.id ? "Save Loan Changes" : "Disburse Loan"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Active Loans & Advances</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={loanFilterMonth}
                  onValueChange={(val) => {
                    setLoanFilterMonth(val);
                    setLoanPage(1);
                  }}
                >
                  <SelectTrigger className="w-36 rounded-xl h-10 text-xs">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Months</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {new Date(2000, i, 1).toLocaleString("default", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={loanFilterYear}
                  onValueChange={(val) => {
                    setLoanFilterYear(val);
                    setLoanPage(1);
                  }}
                >
                  <SelectTrigger className="w-28 rounded-xl h-10 text-xs">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Years</SelectItem>
                    {Array.from({ length: 5 }, (_, i) => {
                      const yr = new Date().getFullYear() - 2 + i;
                      return <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DataTable
              data={loans.data || []}
              columns={loanColumns}
              emptyMessage="No active loans or salary advances recorded."
              lazy={true}
              totalRecords={loans.total || 0}
              page={loanPage}
              rows={loanLimit}
              search={loanSearch}
              onPageChange={(page) => setLoanPage(page)}
              onRowsChange={(rows) => {
                setLoanLimit(rows);
                setLoanPage(1);
              }}
              onSearchChange={(search) => {
                setLoanSearch(search);
                setLoanPage(1);
              }}
            />
          </Card>

          {/* MANUAL REPAYMENT DIALOG */}
          <Dialog open={isRepayOpen} onOpenChange={setIsRepayOpen}>
            <DialogContent className="max-w-md sm:max-w-md border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
              <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 p-6 text-white">
                <DialogTitle className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <Banknote className="size-5 text-emerald-400" /> Record Manual Repayment
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-xs mt-1">
                  Enter the repayment amount paid by the employee to deduct it from their remaining balance.
                </DialogDescription>
              </div>
              <form onSubmit={handleRecordRepayment} className="p-6 space-y-4">
                {selectedRepayLoan && (
                  <div className="text-xs space-y-1 bg-white dark:bg-slate-900 p-4 rounded-xl border">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Employee: <span className="font-normal">{selectedRepayLoan.employee ? `${selectedRepayLoan.employee.firstName} ${selectedRepayLoan.employee.lastName}` : selectedRepayLoan.employeeId}</span>
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Loan Type: <span className="font-normal">{selectedRepayLoan.loanType}</span>
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Principal: <span className="font-normal">₹{selectedRepayLoan.principalAmount.toLocaleString()}</span>
                    </p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Remaining Balance: <span className="font-bold text-amber-600">₹{selectedRepayLoan.balanceRemaining.toLocaleString()}</span>
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs font-semibold">Repayment Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="rounded-xl mt-1.5 h-11"
                  />
                  {repayError && (
                    <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                      {repayError}
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-xl h-11 px-5" onClick={() => setIsRepayOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 px-7 font-semibold">Record Payment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
  );
}
