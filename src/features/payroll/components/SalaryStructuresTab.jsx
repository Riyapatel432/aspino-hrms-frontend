"use client";

import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "@/lib/api";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
  bulkImportSalaryStructures,
} from "@/features/payroll/store/payrollSlice";
import BulkSalaryMatrixModal from "./BulkSalaryMatrixModal";

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
  Upload,
  Loader2,
  Table as TableIcon,
  Eye,
  EyeOff,
  Repeat,
  Lock,
  ArrowRight,
  Calendar,
  Filter,
} from "lucide-react";


export default function SalaryStructuresTab() {

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

  const activeTab = "structures";
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Dialog States
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyFromMonth, setCopyFromMonth] = useState("6");
  const [copyToMonth, setCopyToMonth] = useState("7");
  const [transferPassword, setTransferPassword] = useState("");
  const [showTransferPassword, setShowTransferPassword] = useState(false);
  const [transferError, setTransferError] = useState("");

  useEffect(() => {
    if (isCopyModalOpen) {
      setTransferPassword("");
      setTransferError("");
    }
  }, [isCopyModalOpen]);
  const [isRentOpen, setIsRentOpen] = useState(false);

  const monthOptions = [
    { value: "1", label: "1 - January" },
    { value: "2", label: "2 - February" },
    { value: "3", label: "3 - March" },
    { value: "4", label: "4 - April" },
    { value: "5", label: "5 - May" },
    { value: "6", label: "6 - June" },
    { value: "7", label: "7 - July" },
    { value: "8", label: "8 - August" },
    { value: "9", label: "9 - September" },
    { value: "10", label: "10 - October" },
    { value: "11", label: "11 - November" },
    { value: "12", label: "12 - December" },
  ];
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [selectedForm16, setSelectedForm16] = useState(null);

  // Form States
  const defaultStructForm = {
    employeeId: "",
    basicSalary: "",
    hraAmount: "",
    da: "",
    conveyance: "",
    specialAllowance: "",
    statutoryBonus: "",
    reimbursements: "",
    pfAmount: "",
    esiAmount: "",
    ptAmount: "",
    taxRegime: "NEW",
    bankId: "",
    accountNumber: "",
    ifscCode: "",
    panNumber: "",
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
  const DEFAULT_INDIAN_BANKS = [
    { id: 1, name: "HDFC Bank" },
    { id: 2, name: "ICICI Bank" },
    { id: 3, name: "State Bank of India" },
    { id: 4, name: "Axis Bank" },
    { id: 5, name: "Kotak Mahindra Bank" },
    { id: 6, name: "Punjab National Bank" },
    { id: 7, name: "Bank of Baroda" },
    { id: 8, name: "IndusInd Bank" },
    { id: 9, name: "Canara Bank" },
    { id: 10, name: "Union Bank of India" },
    { id: 11, name: "IDFC FIRST Bank" },
    { id: 12, name: "Yes Bank" },
  ];
  const [banks, setBanks] = useState(DEFAULT_INDIAN_BANKS);

  useEffect(() => {
    async function fetchBanks() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        let res = await apiFetch(`${backendUrl}/staff-hrms/payroll/banks`);
        if (!res.ok) {
          res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/banks`);
        }
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];
          if (list && list.length > 0) {
            setBanks(list);
          }
        }
      } catch (err) {
        console.error("Error fetching banks:", err);
      }
    }
    fetchBanks();
  }, []);

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

  // Bulk Salary Import States
  const [isBulkSalaryOpen, setIsBulkSalaryOpen] = useState(false);
  const [bulkSalaryCsvText, setBulkSalaryCsvText] = useState("");
  const [parsedSalaryRecords, setParsedSalaryRecords] = useState([]);
  const [importingSalary, setImportingSalary] = useState(false);
  const [salaryImportResult, setSalaryImportResult] = useState(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleDownloadSalaryTemplate = async () => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/salary-structure/template`);
      if (!res.ok) throw new Error("Failed to fetch template");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "salary_structure_import_template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Salary template downloaded successfully.");
    } catch (err) {
      console.error("Template download error:", err);
      toast.error("Failed to download salary template.");
    }
  };

  const handleDownloadSalaryErrorReport = () => {
    if (!salaryImportResult || !salaryImportResult.errors || salaryImportResult.errors.length === 0) return;
    const headers = "Row Number,Employee ID / Code,Error Details\n";
    const rows = salaryImportResult.errors
      .map(e => `"${e.row}","${(e.employeeCodeOrId || "").replace(/"/g, '""')}","${(e.error || "").replace(/"/g, '""')}"`)
      .join("\n");
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `salary_import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Salary error report sheet downloaded.");
  };

  const handleParseSalaryCsv = (text) => {
    setBulkSalaryCsvText(text);
    if (!text || !text.trim()) {
      setParsedSalaryRecords([]);
      return;
    }
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      setParsedSalaryRecords([]);
      return;
    }
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;
      const cols = rawLine.split(",").map(c => c.trim().replace(/^"(.*)"$/, "$1"));
      if (cols.length === 0) continue;

      records.push({
        employeeCodeOrId: cols[0] || "",
        basicSalary: cols[1] ? parseFloat(cols[1]) : 0,
        hraAmount: cols[2] ? parseFloat(cols[2]) : undefined,
        da: cols[3] ? parseFloat(cols[3]) : 0,
        conveyance: cols[4] ? parseFloat(cols[4]) : 1600,
        specialAllowance: cols[5] ? parseFloat(cols[5]) : 0,
        statutoryBonus: cols[6] ? parseFloat(cols[6]) : 0,
        reimbursements: cols[7] ? parseFloat(cols[7]) : 0,
        grossSalary: cols[8] ? parseFloat(cols[8]) : undefined,
        pfAmount: cols[9] ? parseFloat(cols[9]) : undefined,
        esiAmount: cols[10] ? parseFloat(cols[10]) : undefined,
        ptAmount: cols[11] ? parseFloat(cols[11]) : undefined,
        taxRegime: cols[12] || "NEW",
        bankName: cols[13] || undefined,
        accountNumber: cols[14] || undefined,
        ifscCode: cols[15] || undefined,
        panNumber: cols[16] || undefined,
      });
    }
    setParsedSalaryRecords(records);
  };

  const handleSalaryFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        handleParseSalaryCsv(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCloseBulkModal = () => {
    setIsBulkSalaryOpen(false);
    setParsedSalaryRecords([]);
    setBulkSalaryCsvText("");
    setSalaryImportResult(null);
  };

  const handleExecuteBulkSalaryImport = async () => {
    if (parsedSalaryRecords.length === 0) {
      toast.error("No valid salary records found.");
      return;
    }
    setImportingSalary(true);
    setSalaryImportResult(null);
    try {
      const res = await dispatch(bulkImportSalaryStructures(parsedSalaryRecords)).unwrap();
      setSalaryImportResult(res);
      if (res.successCount > 0) {
        toast.success(`Successfully updated ${res.successCount} salary structures!`);
        dispatch(fetchSalaryStructures({ page: structPage, limit: structLimit, search: structSearch }));
      }
      if (res.failureCount > 0) {
        toast.warning(`${res.failureCount} records could not be updated.`);
      } else if (res.successCount > 0) {
        setTimeout(() => {
          handleCloseBulkModal();
        }, 1000);
      }
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Bulk salary import failed");
    } finally {
      setImportingSalary(false);
    }
  };

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
    dispatch(fetchSalaryStructures({ page: structPage, limit: structLimit, search: structSearch, month: selectedMonth, year: selectedYear }));
  }, [dispatch, structPage, structLimit, structSearch, selectedMonth, selectedYear]);

  const calculatedGross =
    Number(structForm.basicSalary) +
    Number(structForm.hraAmount) +
    Number(structForm.da) +
    Number(structForm.conveyance) +
    Number(structForm.specialAllowance) +
    Number(structForm.statutoryBonus) +
    Number(structForm.reimbursements);

  const calculatedNet =
    calculatedGross -
    (Number(structForm.pfAmount) || 0) -
    (Number(structForm.esiAmount) || 0) -
    (Number(structForm.ptAmount) || 0);

  // Handlers
  const handleSaveStructure = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!structForm.employeeId) errors.employeeId = "Please select an employee.";
    if (structForm.basicSalary === "" || isNaN(Number(structForm.basicSalary)) || Number(structForm.basicSalary) < 0) {
      errors.basicSalary = "Valid basic salary (≥ 0) is required.";
    }

    if (structForm.hraAmount === "" || isNaN(Number(structForm.hraAmount)) || Number(structForm.hraAmount) < 0) {
      errors.hraAmount = "HRA amount is required (≥ 0).";
    }
    if (structForm.da === "" || isNaN(Number(structForm.da)) || Number(structForm.da) < 0) {
      errors.da = "Dearness Allowance is required (≥ 0).";
    }
    if (structForm.conveyance === "" || isNaN(Number(structForm.conveyance)) || Number(structForm.conveyance) < 0) {
      errors.conveyance = "Conveyance allowance is required (≥ 0).";
    }
    if (structForm.specialAllowance === "" || isNaN(Number(structForm.specialAllowance)) || Number(structForm.specialAllowance) < 0) {
      errors.specialAllowance = "Special allowance is required (≥ 0).";
    }
    if (structForm.statutoryBonus === "" || isNaN(Number(structForm.statutoryBonus)) || Number(structForm.statutoryBonus) < 0) {
      errors.statutoryBonus = "Statutory bonus is required (≥ 0).";
    }
    if (structForm.reimbursements === "" || isNaN(Number(structForm.reimbursements)) || Number(structForm.reimbursements) < 0) {
      errors.reimbursements = "Reimbursements is required (≥ 0).";
    }

    if (structForm.pfAmount === "" || isNaN(Number(structForm.pfAmount)) || Number(structForm.pfAmount) < 0) {
      errors.pfAmount = "PF amount is required (≥ 0).";
    }
    if (structForm.esiAmount === "" || isNaN(Number(structForm.esiAmount)) || Number(structForm.esiAmount) < 0) {
      errors.esiAmount = "ESI amount is required (≥ 0).";
    }
    if (structForm.ptAmount === "" || isNaN(Number(structForm.ptAmount)) || Number(structForm.ptAmount) < 0) {
      errors.ptAmount = "PT amount is required (≥ 0).";
    }

    if (!structForm.bankId) {
      errors.bankId = "Bank name is required.";
    }

    if (!structForm.accountNumber || !structForm.accountNumber.trim()) {
      errors.accountNumber = "Account number is required.";
    } else if (!/^\d{9,18}$/.test(structForm.accountNumber.trim())) {
      errors.accountNumber = "Account number must be 9 to 18 digits.";
    }

    if (!structForm.ifscCode || !structForm.ifscCode.trim()) {
      errors.ifscCode = "IFSC code is required.";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(structForm.ifscCode.trim())) {
      errors.ifscCode = "Invalid IFSC Code format (e.g. HDFC0001234).";
    }

    if (!structForm.panNumber || !structForm.panNumber.trim()) {
      errors.panNumber = "PAN number is required.";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(structForm.panNumber.trim())) {
      errors.panNumber = "Invalid PAN format (e.g. ABCDE1234F).";
    }

    if (Object.keys(errors).length > 0) {
      setStructErrors(errors);
      toast.error("Please resolve the validation errors before saving.");
      return;
    }
    
    setStructErrors({});
    try {
      await dispatch(setupSalaryStructure({
        employeeId: structForm.employeeId,
        month: Number(selectedMonth),
        year: Number(selectedYear),
        basicSalary: Number(structForm.basicSalary) || 0,
        hraAmount: Number(structForm.hraAmount) || 0,
        da: Number(structForm.da) || 0,
        conveyance: Number(structForm.conveyance) || 0,
        specialAllowance: Number(structForm.specialAllowance) || 0,
        statutoryBonus: Number(structForm.statutoryBonus) || 0,
        reimbursements: Number(structForm.reimbursements) || 0,
        pfAmount: Number(structForm.pfAmount) || 0,
        esiAmount: Number(structForm.esiAmount) || 0,
        ptAmount: Number(structForm.ptAmount) || 0,
        taxRegime: structForm.taxRegime || "NEW",
        bankId: structForm.bankId ? Number(structForm.bankId) : undefined,
        accountNumber: structForm.accountNumber || "",
        ifscCode: structForm.ifscCode || "",
        panNumber: structForm.panNumber || "",
      })).unwrap();

      setIsStructureOpen(false);
      resetStructForm();
      dispatch(fetchSalaryStructures({ page: structPage, limit: structLimit, search: structSearch, month: selectedMonth, year: selectedYear }));
    } catch (err) {
      console.error("Error saving salary structure:", err);
    }
  };

  const handleDeleteStructure = async (id) => {
    await dispatch(deleteSalaryStructure(id));
    setDeleteStructId(null);
  };

  const handleExecuteSalaryTransfer = async () => {
    if (copyFromMonth === copyToMonth) {
      const msg = "Source and target months cannot be the same.";
      setTransferError(msg);
      toast.error(msg);
      return;
    }
    if (!transferPassword || !transferPassword.trim()) {
      const msg = "Authorization password is required.";
      setTransferError(msg);
      toast.error(msg);
      return;
    }

    setTransferError("");
    setCopyLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/salary-structure/copy-previous`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromMonth: Number(copyFromMonth),
          fromYear: selectedYear,
          toMonth: Number(copyToMonth),
          toYear: selectedYear,
          password: transferPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        toast.success(data.message || `Transferred salaries for ${data.copiedCount || "all"} employees!`);
        setIsCopyModalOpen(false);
        setTransferPassword("");
        setSelectedMonth(Number(copyToMonth));
        dispatch(fetchSalaryStructures({ page: structPage, limit: structLimit, search: structSearch, month: Number(copyToMonth), year: selectedYear }));
      } else {
        const errMsg = data.message || "Failed to transfer previous month salaries. Check your password.";
        setTransferError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      console.error("Error executing salary transfer:", err);
      toast.error("Network error while executing salary transfer");
    } finally {
      setCopyLoading(false);
    }
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
      label: "Statutory Deductions",
      sortable: false,
      render: (row) => (
        <div className="space-x-1">
          {row.pfAmount > 0 && <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">PF: ₹{row.pfAmount}</Badge>}
          {row.esiAmount > 0 && <Badge className="bg-amber-100 text-amber-800 text-[10px]">ESI: ₹{row.esiAmount}</Badge>}
          {row.ptAmount > 0 && <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">PT: ₹{row.ptAmount}</Badge>}
        </div>
      ),
    },
    {
      key: "bankDetails",
      label: "Bank Account & PAN",
      sortable: false,
      render: (row) => (
        <div className="text-xs space-y-0.5">
          {row.employee?.bankId || row.employee?.bankName || row.employee?.accountNumber ? (
            <>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {row.employee?.bank?.name || row.employee?.bankName || (banks.find(b => b.id === row.employee?.bankId)?.name) || "Bank"} {row.employee?.accountNumber ? `(•••${row.employee.accountNumber.slice(-4)})` : ""}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                IFSC: {row.employee?.ifscCode || "N/A"} | PAN: {row.employee?.panNumber || "N/A"}
              </div>
            </>
          ) : (
            <span className="text-slate-400 italic text-[11px]">Not configured</span>
          )}
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
                hraAmount: row.hraAmount,
                da: row.da,
                conveyance: row.conveyance,
                specialAllowance: row.specialAllowance,
                statutoryBonus: row.statutoryBonus,
                reimbursements: row.reimbursements,
                pfAmount: row.pfAmount,
                esiAmount: row.esiAmount,
                ptAmount: row.ptAmount,
                taxRegime: row.taxRegime,
                bankId: row.employee?.bankId || row.employee?.bank?.id || "",
                accountNumber: row.employee?.accountNumber || "",
                ifscCode: row.employee?.ifscCode || "",
                panNumber: row.employee?.panNumber || "",
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Configured Salary Structures</h2>
              <p className="text-sm text-slate-500">Base salary breakdown for direct employees with Metro/Non-Metro HRA logic.</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-xl h-10 px-4 font-semibold gap-2 cursor-pointer transition-all"
                onClick={() => setIsCopyModalOpen(true)}
                title="Salary Transfer"
              >
                <Repeat className="size-4 text-indigo-500" />
                Salary Transfer
              </Button>

              {/* ENHANCED MODAL 1: SALARY STRUCTURE SETUP */}
              <Dialog open={isStructureOpen} onOpenChange={setIsStructureOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-10 px-6 font-semibold shadow-md gap-2" onClick={resetStructForm}>
                    <Plus className="size-4" /> Assign / Update Structure
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-6xl sm:max-w-6xl w-[94vw] max-h-[92vh] overflow-y-auto border-0 shadow-2xl rounded-3xl p-0 bg-slate-50 dark:bg-slate-950">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-6 text-white flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-sky-500/20 rounded-xl text-sky-400">
                        <Calculator className="size-5" />
                      </span>
                      <DialogTitle className="text-xl font-extrabold tracking-tight">Configure Employee Salary Structure</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-300 text-xs mt-1.5">
                      Define standard earnings components, Metro/Non-Metro HRA percentage, and statutory deduction flags.
                    </DialogDescription>
                  </div>
                </div>

                <form onSubmit={handleSaveStructure} className="p-6 space-y-6" noValidate>
                  {/* Landscape Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN: Employee & Earnings */}
                    <div className="space-y-6">
                      {/* Card 1: Employee Selection */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <UserCheck className="size-4 text-sky-500" /> Employee Selection
                        </h4>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Direct Employee</Label>
                          <Select
                            value={structForm.employeeId}
                            onValueChange={(val) => setStructForm({ ...structForm, employeeId: val })}
                          >
                            <SelectTrigger className={`rounded-xl mt-1.5 h-11 ${structErrors.employeeId ? 'border-red-500 border-2' : ''}`}><SelectValue placeholder="Choose an employee" /></SelectTrigger>
                            <SelectContent>
                              {(!employees || employees.length === 0) ? (
                                <SelectItem value="none" disabled>No employees available</SelectItem>
                              ) : (
                                (employees || []).map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName} ({emp.employeeId}) - {emp.designation}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {structErrors.employeeId && (
                            <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                              {structErrors.employeeId}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card 2: Fixed Monthly Earnings Breakdown */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <DollarSign className="size-4 text-emerald-500" /> Monthly Fixed Earnings Components
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Basic Salary (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.basicSalary}
                              onChange={(e) => setStructForm({ ...structForm, basicSalary: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.basicSalary ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.basicSalary && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.basicSalary}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">HRA Amount (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.hraAmount}
                              onChange={(e) => setStructForm({ ...structForm, hraAmount: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.hraAmount ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.hraAmount && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.hraAmount}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dearness Allowance (DA)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.da}
                              onChange={(e) => setStructForm({ ...structForm, da: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.da ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.da && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.da}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Conveyance Allowance</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.conveyance}
                              onChange={(e) => setStructForm({ ...structForm, conveyance: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.conveyance ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.conveyance && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.conveyance}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Special Allowance</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.specialAllowance}
                              onChange={(e) => setStructForm({ ...structForm, specialAllowance: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.specialAllowance ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.specialAllowance && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.specialAllowance}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Statutory Bonus</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.statutoryBonus}
                              onChange={(e) => setStructForm({ ...structForm, statutoryBonus: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.statutoryBonus ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.statutoryBonus && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.statutoryBonus}
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reimbursements</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.reimbursements}
                              onChange={(e) => setStructForm({ ...structForm, reimbursements: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.reimbursements ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.reimbursements && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.reimbursements}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Deductions, Summary, and Bank Details */}
                    <div className="space-y-6">
                      {/* Card 3: Statutory Deductions & Summary */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <ShieldCheck className="size-4 text-indigo-500" /> Statutory Compliance & Tax Regime
                          </h4>
                          <div className="flex gap-6 text-right">
                            <div>
                              <span className="text-[11px] text-slate-500 font-medium">Monthly Gross:</span>
                              <p className="text-lg font-black text-slate-600 dark:text-slate-300">₹{calculatedGross.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-[11px] text-emerald-600 font-bold">Estimated Net Pay:</span>
                              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{calculatedNet.toLocaleString()}/mo</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">PF Amount (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.pfAmount}
                              onChange={(e) => setStructForm({ ...structForm, pfAmount: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.pfAmount ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.pfAmount && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.pfAmount}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ESI Amount (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.esiAmount}
                              onChange={(e) => setStructForm({ ...structForm, esiAmount: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.esiAmount ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.esiAmount && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.esiAmount}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">PT Amount (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={structForm.ptAmount}
                              onChange={(e) => setStructForm({ ...structForm, ptAmount: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.ptAmount ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.ptAmount && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.ptAmount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Employee Bank & PAN Details */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <Building2 className="size-4 text-sky-500" /> Bank Account & PAN Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bank Name</Label>
                            <Select
                              value={structForm.bankId ? String(structForm.bankId) : ""}
                              onValueChange={(val) => setStructForm({ ...structForm, bankId: val ? Number(val) : "" })}
                            >
                              <SelectTrigger className={`rounded-xl mt-1.5 h-11 bg-white dark:bg-slate-950 ${structErrors.bankId ? 'border-red-500 border-2' : ''}`}>
                                <SelectValue placeholder="Select Bank" />
                              </SelectTrigger>
                              <SelectContent>
                                {(banks && banks.length > 0 ? banks : DEFAULT_INDIAN_BANKS).map((b, idx) => (
                                  <SelectItem key={b.id || idx} value={String(b.id)}>
                                    {b.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {structErrors.bankId && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.bankId}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Number</Label>
                            <Input
                              type="text"
                              placeholder="e.g. 50100234567890"
                              value={structForm.accountNumber}
                              onChange={(e) => setStructForm({ ...structForm, accountNumber: e.target.value })}
                              className={`rounded-xl mt-1.5 h-11 ${structErrors.accountNumber ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.accountNumber && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.accountNumber}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">IFSC Code</Label>
                            <Input
                              type="text"
                              placeholder="e.g. HDFC0001234"
                              value={structForm.ifscCode}
                              onChange={(e) => setStructForm({ ...structForm, ifscCode: e.target.value.toUpperCase() })}
                              className={`rounded-xl mt-1.5 h-11 uppercase ${structErrors.ifscCode ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.ifscCode && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.ifscCode}
                              </div>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">PAN Number</Label>
                            <Input
                              type="text"
                              placeholder="e.g. ABCDE1234F"
                              value={structForm.panNumber}
                              onChange={(e) => setStructForm({ ...structForm, panNumber: e.target.value.toUpperCase() })}
                              className={`rounded-xl mt-1.5 h-11 uppercase ${structErrors.panNumber ? 'border-red-500 border-2' : ''}`}
                            />
                            {structErrors.panNumber && (
                              <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                                {structErrors.panNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-3 pt-2">
                    <Button type="button" variant="outline" className="rounded-xl h-11 px-6 border-slate-300" onClick={() => setIsStructureOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-11 px-8 font-semibold shadow-md">
                      Save Salary Structure
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* BULK SALARY STRUCTURE IMPORT DIALOG */}
        <Dialog open={isBulkSalaryOpen} onOpenChange={(open) => { setIsBulkSalaryOpen(open); if (!open) handleCloseBulkModal(); }}>
              <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
                <DialogHeader className="pr-8">
                  <DialogTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    Bulk Salary Structures Excel / CSV Import
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Upload an Excel/CSV file or paste CSV data to assign base salary structures for multiple employees at once. Existing salary structures will be updated automatically.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                  {/* Download Template Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Need the standard salary import format template?
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadSalaryTemplate}
                      className="h-8 text-xs font-bold rounded-xl border-slate-300 dark:border-slate-600 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-500" />
                      Download CSV Sample Template
                    </Button>
                  </div>

                  {/* Input Options: File Upload or Raw Paste */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-emerald-500" />
                        Option A: Choose CSV File
                      </Label>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleSalaryFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300 hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Option B: Paste CSV Data
                      </Label>
                      <Textarea
                        placeholder="Employee Code,Basic Salary,HRA Amount,DA,Conveyance,Special Allowance..."
                        rows={3}
                        value={bulkSalaryCsvText}
                        onChange={(e) => handleParseSalaryCsv(e.target.value)}
                        className="text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Preview Table */}
                  {parsedSalaryRecords.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          Parsed Records Preview ({parsedSalaryRecords.length} rows ready)
                        </span>
                      </div>
                      <div className="max-h-60 overflow-y-auto overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                        <Table className="text-xs">
                          <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                            <TableRow>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300">#</TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300">Employee ID / Code</TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300">Basic Salary</TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300">HRA</TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300">Conveyance</TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300">Special Allowance</TableHead>
                              <TableHead className="font-bold text-slate-700 dark:text-slate-300">Tax Regime</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedSalaryRecords.map((row, idx) => (
                              <TableRow key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <TableCell className="font-mono text-slate-400">{idx + 1}</TableCell>
                                <TableCell className="font-bold text-slate-800 dark:text-slate-200">{row.employeeCodeOrId || "—"}</TableCell>
                                <TableCell>₹{row.basicSalary?.toLocaleString() || 0}</TableCell>
                                <TableCell>{row.hraAmount ? `₹${row.hraAmount.toLocaleString()}` : "Auto 40%"}</TableCell>
                                <TableCell>₹{row.conveyance || 1600}</TableCell>
                                <TableCell>₹{row.specialAllowance || 0}</TableCell>
                                <TableCell>
                                  <Badge className="text-[10px] uppercase font-bold" variant="outline">
                                    {row.taxRegime}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Results Report */}
                  {salaryImportResult && (
                    <div className={`p-4 rounded-2xl border space-y-2 ${salaryImportResult.failureCount > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"}`}>
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Salary Import Summary
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          Total: {salaryImportResult.total} | Success: <span className="text-emerald-600 dark:text-emerald-400">{salaryImportResult.successCount}</span> | Failed: <span className="text-rose-600 dark:text-rose-400">{salaryImportResult.failureCount}</span>
                        </span>
                      </div>
                      {salaryImportResult.errors && salaryImportResult.errors.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800/40">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-800 dark:text-amber-300 text-xs">Row Errors Detected:</span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleDownloadSalaryErrorReport}
                              className="h-7 text-[11px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download Error Sheet (.CSV)
                            </Button>
                          </div>
                          <div className="space-y-1 text-[11px] max-h-28 overflow-y-auto bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl border border-amber-200/50">
                            {salaryImportResult.errors.map((err, i) => (
                              <div key={i} className="text-rose-600 dark:text-rose-400 font-mono">
                                Row {err.row} ({err.employeeCodeOrId}): {err.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseBulkModal}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExecuteBulkSalaryImport}
                    disabled={importingSalary || parsedSalaryRecords.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-6 cursor-pointer"
                  >
                    {importingSalary ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Updating Salaries...
                      </>
                    ) : (
                      `Import & Save ${parsedSalaryRecords.length} Salary Structures`
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card className="border rounded-2xl shadow-sm bg-white dark:bg-slate-900 p-6 overflow-hidden space-y-5">
              {/* Year & Month Filter Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Filter className="size-4 text-indigo-500" />
                  <span>Filter Salary Structures By Period:</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Year Dropdown */}
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-slate-400" />
                    <Select value={String(selectedYear)} onValueChange={(val) => { setSelectedYear(Number(val)); setStructPage(1); }}>
                      <SelectTrigger className="w-[110px] h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027, 2028].map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Month Dropdown */}
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-slate-400" />
                    <Select value={String(selectedMonth)} onValueChange={(val) => { setSelectedMonth(Number(val)); setStructPage(1); }}>
                      <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DataTable
                columns={salaryStructureColumns}
                data={salaryStructures?.data || []}
                totalRecords={salaryStructures?.total || 0}
                lazy={true}
                loading={loading}
                page={structPage}
                rows={structLimit}
                search={structSearch}
                onPageChange={(page) => setStructPage(page)}
                onRowsChange={(rows) => { setStructLimit(rows); setStructPage(1); }}
                onSearchChange={(search) => { setStructSearch(search); setStructPage(1); }}
                emptyMessage="No salary structures found for selected month & year. Click 'Assign / Update Structure' or 'Salary Transfer' to add structures."
              />
            </Card>

          <DeleteConfirmDialog
            open={!!deleteStructId}
            onOpenChange={(open) => !open && setDeleteStructId(null)}
            onConfirm={() => handleDeleteStructure(deleteStructId)}
            title="Delete Salary Structure"
            description="Are you sure you want to delete this salary structure? This action cannot be undone and may affect payroll calculations."
          />
          {/* BULK SALARY MATRIX MODAL */}
      <BulkSalaryMatrixModal open={isMatrixOpen} onOpenChange={setIsMatrixOpen} banks={banks} />

      {/* DUAL THEME 2-COLUMN INTERACTIVE SALARY TRANSFER HUB MODAL */}
      <Dialog open={isCopyModalOpen} onOpenChange={setIsCopyModalOpen}>
        <DialogContent className="max-w-3xl sm:max-w-3xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-white/10 rounded-2xl text-sky-300 border border-white/10 shadow-inner">
                <Sparkles className="size-6 text-sky-300" />
              </span>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Salary Transfer Hub
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase tracking-wider">
                    High-Speed Engine
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-300 text-xs mt-1">
                  Carry forward base salaries, allowances, statutory deductions, and bank details across all active employees.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950">
            {/* COLUMN 1: PERIOD SELECTION & VISUAL FLOW */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Clock className="size-4 text-indigo-600 dark:text-indigo-400" /> 1. Select Transfer Periods
              </h4>

              {/* Visual Flow Banner */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-center shadow-inner">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">From</p>
                  <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    {monthOptions.find((m) => m.value === copyFromMonth)?.label || "June"}
                  </p>
                </div>
                <ArrowRight className="size-4 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">To</p>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {monthOptions.find((m) => m.value === copyToMonth)?.label || "July"}
                  </p>
                </div>
              </div>

              {/* Month From */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Month From (Source)</Label>
                <Select value={copyFromMonth} onValueChange={setCopyFromMonth}>
                  <SelectTrigger className="rounded-xl mt-1.5 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select Source Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month To */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Month To (Target)</Label>
                <Select value={copyToMonth} onValueChange={setCopyToMonth}>
                  <SelectTrigger className="rounded-xl mt-1.5 h-11 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select Target Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* COLUMN 2: SECURITY & AUTHORIZATION */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Lock className="size-4 text-emerald-600 dark:text-emerald-400" /> 2. Security Authorization
                </h4>

                {/* Password Input */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Authorization Password</span>
                    {/* <span className="text-[10px] text-slate-400 font-mono">From .env</span> */}
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showTransferPassword ? "text" : "password"}
                      name="salary_transfer_auth_pass_no_autofill"
                      autoComplete="new-password"
                      placeholder="Enter transfer password..."
                      value={transferPassword}
                      onChange={(e) => setTransferPassword(e.target.value)}
                      className={`rounded-xl h-11 pr-10 text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 ${transferError ? 'border-red-500 border-2' : 'border-slate-200 dark:border-slate-800'}`}
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      onClick={() => setShowTransferPassword(!showTransferPassword)}
                    >
                      {showTransferPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {transferError && (
                    <div className="text-red-500 text-[11px] font-bold mt-1 pl-1">
                      {transferError}
                    </div>
                  )}
                </div>

                {/* Info Notice Banner */}
                <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 p-3.5 rounded-xl flex gap-2.5 items-start">
                  <ShieldCheck className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    Carrying forward salaries will update all active employee structures for the selected target period in 1 click.
                  </p>
                </div>
              </div>

              {/* Status Counter */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 text-center font-semibold">
                ⚡ Ready to process all active employees instantly
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="p-6 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCopyModalOpen(false)}
              className="rounded-xl h-11 px-6 text-xs font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExecuteSalaryTransfer}
              disabled={copyLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-8 text-xs font-bold shadow-md shadow-indigo-500/20 gap-2 cursor-pointer transition-all hover:scale-[1.01]"
            >
              {copyLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-amber-300" />}
              Transfer Salaries Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
