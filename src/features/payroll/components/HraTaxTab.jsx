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


export default function HraTaxTab() {

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

  const activeTab = "hra";
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

  const [rentPage, setRentPage] = useState(1);
  const [rentLimit, setRentLimit] = useState(10);
  const [rentSearch, setRentSearch] = useState("");
  const [rentFilterMonth, setRentFilterMonth] = useState("");
  const [rentFilterYear, setRentFilterYear] = useState("");

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
      fetchRentReceipts({
        page: rentPage,
        limit: rentLimit,
        search: rentSearch,
        month: rentFilterMonth && rentFilterMonth !== "ALL" ? Number(rentFilterMonth) : undefined,
        year: rentFilterYear && rentFilterYear !== "ALL" ? Number(rentFilterYear) : undefined,
      })
    );
  }, [dispatch, rentPage, rentLimit, rentSearch, rentFilterMonth, rentFilterYear]);

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
        <div className="flex items-center gap-2">
          {row.status === "SUBMITTED" && (
            <>
              <Button size="sm" className="bg-emerald-600 text-white h-7 text-xs rounded-lg" onClick={() => handleVerifyRent(row.id, "APPROVED")}>Approve</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 rounded-lg" onClick={() => handleVerifyRent(row.id, "REJECTED")}>Reject</Button>
            </>
          )}
          <button
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-sky-500 hover:text-white hover:border-sky-500 dark:hover:bg-sky-500 rounded-lg transition-all cursor-pointer"
            title="Edit Receipt"
            onClick={() => {
              setRentForm({
                id: row.id,
                employeeId: row.employeeId,
                financialYear: row.financialYear,
                landlordName: row.landlordName,
                landlordPan: row.landlordPan || "",
                landlordAddress: row.landlordAddress,
                monthlyRent: String(row.monthlyRent),
              });
              setIsRentOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-5 border-sky-100 shadow-sm">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-sm font-bold text-sky-900 dark:text-sky-300 flex items-center gap-2">
                  <Info className="size-4 text-sky-600" /> Income Tax HRA Exemption Rule (Section 13.2)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 text-xs space-y-2 text-slate-700 dark:text-slate-300">
                <p>Calculates the <strong>least of</strong> the following three limits automatically upon landlord proof approval:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>(a)</strong> Actual HRA received annually</li>
                  <li><strong>(b)</strong> Rent paid minus 10% of Annual Basic Salary</li>
                  <li><strong>(c)</strong> 50% (Metro) or 40% (Non-Metro) of Annual Basic Salary</li>
                </ul>
              </CardContent>
            </Card>

            {/* ENHANCED MODAL 2: RENT RECEIPTS */}
            <Card className="border rounded-2xl bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Submit Rent Receipts</h3>
                <p className="text-xs text-slate-500 mt-1">Upload monthly rent paid & landlord details for HR/Finance verification.</p>
              </div>
              <Dialog open={isRentOpen} onOpenChange={setIsRentOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl gap-2 text-xs py-2.5 shadow-md" onClick={() => setRentForm({
                    employeeId: employees[0]?.id || "",
                    financialYear: activeFinancialYear || "2026-2027",
                    landlordName: "",
                    landlordPan: "",
                    landlordAddress: "",
                    monthlyRent: "",
                  })}>
                    <Plus className="size-4" /> Submit Rent Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl sm:max-w-2xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                  <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 text-white">
                    <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                      <Home className="size-5 text-indigo-300" /> {rentForm.id ? "Edit Rent Details for HRA Exemption" : "Submit Rent Details for HRA Exemption"}
                    </DialogTitle>
                    <DialogDescription className="text-indigo-200 text-xs mt-1">
                      Enter landlord PAN, rental address, and monthly rent amount to trigger Rule 2A HRA tax exemption computation.
                    </DialogDescription>
                  </div>
                  <form onSubmit={handleSubmitRent} className="p-6 space-y-5">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border space-y-4">
                      <div>
                        <Label className="text-xs font-semibold">Employee *</Label>
                        <div className="mt-1.5">
                          <SearchableSelect
                            options={(employees || []).map((emp) => ({
                              value: emp.id,
                              label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})`,
                              subLabel: `${emp.designation || "Staff"} • ${emp.department || "General"}`
                            }))}
                            value={rentForm.employeeId}
                            onValueChange={(val) => setRentForm({ ...rentForm, employeeId: val })}
                            placeholder="Search & choose employee..."
                            searchPlaceholder="Type employee name or ID..."
                            className={rentErrors.employeeId ? 'border-red-500 border-2' : ''}
                          />
                        </div>
                        {rentErrors.employeeId && (
                          <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                            {rentErrors.employeeId}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Financial Year</Label>
                          <Select
                            value={rentForm.financialYear}
                            onValueChange={(val) => setRentForm({ ...rentForm, financialYear: val })}
                          >
                            <SelectTrigger className={`rounded-xl mt-1.5 h-11 ${rentErrors.financialYear ? 'border-red-500 border-2' : ''}`}>
                              <SelectValue placeholder="Select Financial Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {(fiscalYears || []).map((fy) => (
                                <SelectItem key={fy.id} value={fy.name}>
                                  {fy.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {rentErrors.financialYear && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {rentErrors.financialYear}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Monthly Rent Paid (₹)</Label>
                          <Input
                            type="number"
                            value={rentForm.monthlyRent}
                            onChange={(e) => setRentForm({ ...rentForm, monthlyRent: e.target.value })}
                            className={`rounded-xl mt-1.5 h-11 ${rentErrors.monthlyRent ? 'border-red-500 border-2' : ''}`}
                          />
                          {rentErrors.monthlyRent && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {rentErrors.monthlyRent}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Landlord Verification Info</h4>
                      <div>
                        <Label className="text-xs font-semibold">Landlord Full Name</Label>
                        <Input
                          placeholder="Landlord Name"
                          value={rentForm.landlordName}
                          onChange={(e) => setRentForm({ ...rentForm, landlordName: e.target.value.replace(/[0-9]/g, '') })}
                          className={`rounded-xl mt-1.5 h-11 ${rentErrors.landlordName ? 'border-red-500 border-2' : ''}`}
                        />
                        {rentErrors.landlordName && (
                          <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                            {rentErrors.landlordName}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Landlord PAN (Required if rent &gt; ₹1L/yr)</Label>
                          <Input
                            placeholder="e.g. ABCDE1234F"
                            value={rentForm.landlordPan}
                            onChange={(e) => setRentForm({ ...rentForm, landlordPan: e.target.value })}
                            className="rounded-xl mt-1.5 h-11"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Rented Accommodation Address</Label>
                          <Input
                            placeholder="Rental Address"
                            value={rentForm.landlordAddress}
                            onChange={(e) => setRentForm({ ...rentForm, landlordAddress: e.target.value })}
                            className={`rounded-xl mt-1.5 h-11 ${rentErrors.landlordAddress ? 'border-red-500 border-2' : ''}`}
                          />
                          {rentErrors.landlordAddress && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {rentErrors.landlordAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-3 pt-2">
                      <Button type="button" variant="outline" className="rounded-xl h-11 px-5" onClick={() => setIsRentOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-7 font-semibold">{rentForm.id ? "Update Rent Details" : "Submit Rent Receipt"}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </Card>

            {/* ENHANCED MODAL 3: TAX DECLARATION */}
            <Card className="border rounded-2xl bg-white dark:bg-slate-900 p-5 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Tax Regime Declaration</h3>
                <p className="text-xs text-slate-500 mt-1">Declare 80C, 80D, 80G deductions for annual TDS calculation.</p>
              </div>
              <Dialog open={isTaxOpen} onOpenChange={setIsTaxOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-4 rounded-xl gap-2 text-xs py-2.5 border-sky-200 text-sky-700 hover:bg-sky-50">
                    <FileText className="size-4" /> Declare Investments (80C / 80D)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl sm:max-w-2xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
                  <div className="bg-gradient-to-r from-slate-900 to-sky-900 p-6 text-white">
                    <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                      <FileText className="size-5 text-sky-400" /> Income Tax Declaration & Regime Selection
                    </DialogTitle>
                    <DialogDescription className="text-slate-300 text-xs mt-1">
                      Choose Old vs New Tax Regime and submit eligible Chapter VI-A investment proofs.
                    </DialogDescription>
                  </div>
                  <form onSubmit={handleSubmitTax} className="p-6 space-y-5">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Employee *</Label>
                          <div className="mt-1.5">
                            <SearchableSelect
                              options={(employees || []).map((emp) => ({
                                value: emp.id,
                                label: `${emp.firstName} ${emp.lastName} (${emp.employeeId})`,
                                subLabel: `${emp.designation || "Staff"} • ${emp.department || "General"}`
                              }))}
                              value={taxForm.employeeId}
                              onValueChange={(val) => setTaxForm({ ...taxForm, employeeId: val })}
                              placeholder="Search & choose employee..."
                              searchPlaceholder="Type employee name or ID..."
                              className={taxErrors.employeeId ? 'border-red-500 border-2' : ''}
                            />
                          </div>
                          {taxErrors.employeeId && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {taxErrors.employeeId}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Tax Regime</Label>
                          <Select
                            value={taxForm.regime}
                            onValueChange={(val) => setTaxForm({ ...taxForm, regime: val })}
                          >
                            <SelectTrigger className="rounded-xl mt-1.5 h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NEW">New Tax Regime (Default)</SelectItem>
                              <SelectItem value="OLD">Old Tax Regime (Exemptions Allowed)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Chapter VI-A Investment Deductions (₹)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Section 80C (EPF, PPF, LIC - Max ₹1.5L)</Label>
                          <Input
                            type="number"
                            value={taxForm.section80C}
                            onChange={(e) => setTaxForm({ ...taxForm, section80C: e.target.value })}
                            className={`rounded-xl mt-1.5 h-11 ${taxErrors.section80C ? 'border-red-500 border-2' : ''}`}
                          />
                          {taxErrors.section80C && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {taxErrors.section80C}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Section 80D (Health Insurance)</Label>
                          <Input
                            type="number"
                            value={taxForm.section80D}
                            onChange={(e) => setTaxForm({ ...taxForm, section80D: e.target.value })}
                            className={`rounded-xl mt-1.5 h-11 ${taxErrors.section80D ? 'border-red-500 border-2' : ''}`}
                          />
                          {taxErrors.section80D && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {taxErrors.section80D}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-semibold">Section 80G (Donations)</Label>
                          <Input
                            type="number"
                            value={taxForm.section80G}
                            onChange={(e) => setTaxForm({ ...taxForm, section80G: e.target.value })}
                            className={`rounded-xl mt-1.5 h-11 ${taxErrors.section80G ? 'border-red-500 border-2' : ''}`}
                          />
                          {taxErrors.section80G && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {taxErrors.section80G}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Other Approved Deductions</Label>
                          <Input
                            type="number"
                            value={taxForm.otherDeductions}
                            onChange={(e) => setTaxForm({ ...taxForm, otherDeductions: e.target.value })}
                            className={`rounded-xl mt-1.5 h-11 ${taxErrors.otherDeductions ? 'border-red-500 border-2' : ''}`}
                          />
                          {taxErrors.otherDeductions && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {taxErrors.otherDeductions}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="gap-3 pt-2">
                      <Button type="button" variant="outline" className="rounded-xl h-11 px-5" onClick={() => setIsTaxOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-11 px-7 font-semibold">Save Declaration</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </Card>
          </div>

          <Card className="border rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6">
            <CardHeader className="p-0 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold">Rent Receipts & Auto HRA Exemption Status</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  value={rentFilterMonth}
                  onValueChange={(val) => {
                    setRentFilterMonth(val);
                    setRentPage(1);
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
                  value={rentFilterYear}
                  onValueChange={(val) => {
                    setRentFilterYear(val);
                    setRentPage(1);
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
            </CardHeader>
            <DataTable
              data={rentReceipts.data || []}
              columns={rentReceiptColumns}
              emptyMessage="No rent receipts submitted yet."
              lazy={true}
              totalRecords={rentReceipts.total || 0}
              page={rentPage}
              rows={rentLimit}
              search={rentSearch}
              onPageChange={(page) => setRentPage(page)}
              onRowsChange={(rows) => {
                setRentLimit(rows);
                setRentPage(1);
              }}
              onSearchChange={(search) => {
                setRentSearch(search);
                setRentPage(1);
              }}
            />
          </Card>
        </div>
  );
}
