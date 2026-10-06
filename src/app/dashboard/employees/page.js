"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { RouteGuard, usePermissions } from "@/context/PermissionContext";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Building2,
  Calendar,
  CreditCard,
  ShieldCheck,
  FileCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  QrCode,
  FileText,
  UserCheck,
  Sparkles,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  Laptop,
  Mail,
  Phone,
  Briefcase,
  IdCard,
  Check,
  X,
  Loader2,
} from "lucide-react";

export default function EmployeesPage() {
  return (
    <RouteGuard subject="onboarding" action="read">
      <EmployeesPageContent />
    </RouteGuard>
  );
}

function EmployeesPageContent() {
  const { can, isSuperAdmin } = usePermissions();
  const canCreate = isSuperAdmin || can("create", "onboarding") || can("create", "employee");
  const canUpdate = isSuperAdmin || can("update", "onboarding") || can("update", "employee");
  const canDelete = isSuperAdmin || can("delete", "onboarding") || can("delete", "employee");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Table & List State
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [banks, setBanks] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onboardingEmployees: 0,
    probationEmployees: 0,
    confirmedEmployees: 0,
    departmentsCount: 0,
  });

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [modalTab, setModalTab] = useState("personal"); // personal | job | bank | system

  // Details Drawer / Modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState("overview"); // overview | bank | documents | access | idcard

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const initialFormState = {
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    totalExperienceYears: "0",
    photoUrl: "",
    departmentId: "",
    designation: "",
    managerId: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    probationEnd: "",
    probationStatus: "UNDER_REVIEW",
    status: "ACTIVE",
    bankId: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    panNumber: "",
    aadharNumber: "",
    resumeUrl: "",
    systemAccess: {
      erpLogin: true,
      email: true,
      attendanceApp: true,
      vpn: false,
    },
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load employee stats:", err);
    }
  }, [backendUrl]);

  const fetchEmployees = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(rows),
      });
      if (search.trim()) params.append("search", search.trim());
      if (departmentFilter !== "ALL") params.append("department", departmentFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);

      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch employees list");
      }
      const result = await res.json();

      setEmployees(result.data || []);
      setTotalRecords(result.total || (result.data ? result.data.length : 0));
    } catch (err) {
      toast.error(err?.message || "Could not fetch employees");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [backendUrl, page, rows, search, departmentFilter, statusFilter, sortBy, sortOrder]);

  const fetchDependencies = useCallback(async () => {
    try {
      const deptRes = await apiFetch(`${backendUrl}/staff-hrms/recruitment/departments?limit=100`);
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(Array.isArray(deptData.data) ? deptData.data : Array.isArray(deptData) ? deptData : []);
      }
    } catch (err) {
      console.error("Failed to fetch dependencies:", err);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchStats();
    fetchDependencies();
  }, [fetchStats, fetchDependencies]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      ...initialFormState,
      departmentId: departments[0]?.id || "",
    });
    setFormErrors({});
    setIsEditing(false);
    setEditingEmployeeId(null);
    setModalTab("personal");
    setIsEntryModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (emp) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/${emp.id}`);
      const fullEmp = res.ok ? await res.json() : emp;

      // Extract photo URL if any
      let photoUrl = "";
      const photoDoc = fullEmp.documents?.find((d) => d.documentType === "Photo");
      if (photoDoc?.fileUrl) {
        photoUrl = photoDoc.fileUrl;
      }

      // Extract resume URL if any
      let resumeUrl = fullEmp.resumeUrl || "";
      if (!resumeUrl) {
        const resumeDoc = fullEmp.documents?.find((d) => d.documentType === "Resume / CV");
        if (resumeDoc?.fileUrl) {
          resumeUrl = resumeDoc.fileUrl;
        }
      }

      setFormData({
        employeeId: fullEmp.employeeId || "",
        firstName: fullEmp.firstName || "",
        lastName: fullEmp.lastName || "",
        email: fullEmp.email || "",
        phone: fullEmp.phone || "",
        dob: fullEmp.dob ? fullEmp.dob.split("T")[0] : "",
        address: fullEmp.address || "",
        totalExperienceYears: String(fullEmp.totalExperienceYears ?? "0"),
        photoUrl: photoUrl || "",
        resumeUrl: resumeUrl || "",
        departmentId: fullEmp.departmentId || "",
        designation: fullEmp.designation || "",
        managerId: fullEmp.managerId || "",
        dateOfJoining: fullEmp.dateOfJoining ? fullEmp.dateOfJoining.split("T")[0] : "",
        probationEnd: fullEmp.probationEnd ? fullEmp.probationEnd.split("T")[0] : "",
        probationStatus: fullEmp.probationStatus || "UNDER_REVIEW",
        status: fullEmp.status || "ACTIVE",
        bankId: fullEmp.bankId ? String(fullEmp.bankId) : "",
        bankName: fullEmp.bankName || "",
        accountNumber: fullEmp.accountNumber || "",
        ifscCode: fullEmp.ifscCode || "",
        panNumber: fullEmp.panNumber || "",
        aadharNumber: fullEmp.aadharNumber || "",
        systemAccess: {
          erpLogin: fullEmp.systemAccess?.erpLogin ?? true,
          email: fullEmp.systemAccess?.email ?? true,
          attendanceApp: fullEmp.systemAccess?.attendanceApp ?? true,
          vpn: fullEmp.systemAccess?.vpn ?? false,
        },
      });

      setFormErrors({});
      setIsEditing(true);
      setEditingEmployeeId(fullEmp.id);
      setModalTab("personal");
      setIsEntryModalOpen(true);
    } catch (err) {
      toast.error("Failed to load employee details for editing.");
    }
  };

  // Open Full Profile Drawer
  const handleOpenDetails = async (emp) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/${emp.id}`);
      if (res.ok) {
        const fullEmp = await res.json();
        setSelectedEmployee(fullEmp);
      } else {
        setSelectedEmployee(emp);
      }
      setDetailsTab("overview");
      setIsDetailsOpen(true);
    } catch (err) {
      setSelectedEmployee(emp);
      setIsDetailsOpen(true);
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    setUploadingPhoto(true);
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/upload-photo`, {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message)
          ? errData.message.join(", ")
          : (errData.message || errData.error || "Photo upload failed");
        throw new Error(msg);
      }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, photoUrl: data.fileUrl }));
      toast.success("Profile photo uploaded successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle Resume Upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = /\.(pdf|doc|docx)$/i;
    if (!validExtensions.test(file.name)) {
      toast.error("Please upload a valid document (PDF, DOC, or DOCX).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume file size cannot exceed 10MB.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    setUploadingResume(true);
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/upload-resume`, {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message)
          ? errData.message.join(", ")
          : (errData.message || errData.error || "Resume upload failed");
        throw new Error(msg);
      }
      const data = await res.json();
      setFormData((prev) => ({ ...prev, resumeUrl: data.fileUrl }));
      toast.success("Resume uploaded successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to upload resume");
    } finally {
      setUploadingResume(false);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    // 1. Profile Photo (Required)
    if (!formData.photoUrl?.trim()) {
      errors.photoUrl = "Profile photo is required.";
    }

    // 2. Resume / CV (Required)
    if (!formData.resumeUrl?.trim()) {
      errors.resumeUrl = "Resume / CV document is required.";
    }

    // 3. First Name (Required)
    if (!formData.firstName?.trim()) {
      errors.firstName = "First name is required.";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters.";
    } else if (/\d/.test(formData.firstName)) {
      errors.firstName = "Numbers are not allowed in first name.";
    }

    // 4. Last Name (Required)
    if (!formData.lastName?.trim()) {
      errors.lastName = "Last name is required.";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters.";
    } else if (/\d/.test(formData.lastName)) {
      errors.lastName = "Numbers are not allowed in last name.";
    }

    // 5. Official Work Email (Required)
    if (!formData.email?.trim()) {
      errors.email = "Official work email is required.";
    } else {
      const emailTrimmed = formData.email.trim().toLowerCase();
      const emailRx = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
      if (!emailRx.test(emailTrimmed)) {
        if (emailTrimmed.includes("%")) {
          errors.email = "Special character '%' is not allowed in email.";
        } else {
          errors.email = "Please enter a valid email address (e.g. name@company.com).";
        }
      } else {
        const [username, domain] = emailTrimmed.split("@");
        if (domain === "gmail.com" || domain === "googlemail.com") {
          if (!/^[a-z0-9]+(\.[a-z0-9]+)*$/i.test(username)) {
            errors.email = "Only letters (a-z), numbers (0-9), and periods (.) are allowed in Gmail username.";
          }
        }
        const dupEmp = (employees || []).find(
          (emp) => String(emp.id) !== String(editingEmployeeId) && emp.email && emp.email.trim().toLowerCase() === emailTrimmed
        );
        if (dupEmp) {
          errors.email = "An employee with this work email address already exists.";
        }
      }
    }

    // 6. Mobile Contact Number (Required, 10 digits)
    if (!formData.phone?.trim()) {
      errors.phone = "Mobile contact number is required.";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = "Phone number must be exactly 10 digits.";
    }

    // 7. Date of Birth (DOB) (Required)
    if (!formData.dob) {
      errors.dob = "Date of Birth is required.";
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (isNaN(birthDate.getTime())) {
        errors.dob = "Please provide a valid date of birth.";
      } else if (birthDate > today) {
        errors.dob = "Date of birth cannot be in the future.";
      } else if (age < 18) {
        errors.dob = "Employee must be at least 18 years old.";
      }
    }

    // 8. Total Prior Experience (Years) (Required, 0 for Fresher)
    if (formData.totalExperienceYears === "" || formData.totalExperienceYears === null || formData.totalExperienceYears === undefined) {
      errors.totalExperienceYears = "Total prior experience is required (enter 0 for Fresher).";
    } else if (Number(formData.totalExperienceYears) < 0) {
      errors.totalExperienceYears = "Experience cannot be negative.";
    } else if (Number(formData.totalExperienceYears) > 50) {
      errors.totalExperienceYears = "Experience cannot exceed 50 years.";
    }

    // 9. Aadhaar Card Number (Required, 12 digits)
    if (!formData.aadharNumber?.trim()) {
      errors.aadharNumber = "Aadhaar Card number is required.";
    } else {
      const cleanAadhar = formData.aadharNumber.replace(/\D/g, "");
      if (cleanAadhar.length !== 12) {
        errors.aadharNumber = "Aadhaar Card number must be exactly 12 digits.";
      }
    }

    // 10. PAN Card Number (Required, 10 chars format)
    if (!formData.panNumber?.trim()) {
      errors.panNumber = "PAN Card number is required.";
    } else {
      const pan = formData.panNumber.trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        errors.panNumber = "Invalid PAN format (e.g. ABCDE1234F).";
      }
    }

    // 11. Residential Address (Required)
    if (!formData.address?.trim()) {
      errors.address = "Residential address is required.";
    } else if (formData.address.trim().length < 5) {
      errors.address = "Address must be at least 5 characters.";
    } else if (formData.address.trim().length > 255) {
      errors.address = "Address cannot exceed 255 characters.";
    }

    // 12. Employee ID (Required)
    if (!formData.employeeId?.trim()) {
      errors.employeeId = "Employee ID is required.";
    } else {
      const empIdTrimmed = formData.employeeId.trim().toUpperCase();
      const dupEmp = (employees || []).find(
        (emp) =>
          String(emp.id) !== String(editingEmployeeId) &&
          emp.employeeId &&
          emp.employeeId.trim().toUpperCase() === empIdTrimmed
      );
      if (dupEmp) {
        errors.employeeId = "An employee with this Employee ID already exists.";
      }
    }

    // 13. Department (Required)
    if (!formData.departmentId) {
      errors.departmentId = "Department is required.";
    }

    // 14. Job Designation (Required)
    if (!formData.designation?.trim()) {
      errors.designation = "Job designation is required.";
    }

    // 15. Date of Joining (Required)
    if (!formData.dateOfJoining) {
      errors.dateOfJoining = "Date of joining is required.";
    }

    // 16. Probation End Date (Required)
    if (!formData.probationEnd) {
      errors.probationEnd = "Probation end date is required.";
    } else if (formData.dateOfJoining && new Date(formData.probationEnd) < new Date(formData.dateOfJoining)) {
      errors.probationEnd = "Probation end date cannot be earlier than Date of Joining.";
    }

    // 17. Employment Status (Required)
    if (!formData.status) {
      errors.status = "Employment status is required.";
    }

    // 18. Probation Review Status (Required)
    if (!formData.probationStatus) {
      errors.probationStatus = "Probation review status is required.";
    }

    setFormErrors(errors);

    // Auto-switch to tab containing error
    const personalKeys = ["photoUrl", "resumeUrl", "firstName", "lastName", "email", "phone", "dob", "totalExperienceYears", "aadharNumber", "panNumber", "address"];
    const hasPersonalError = personalKeys.some((k) => errors[k]);
    const jobKeys = ["employeeId", "departmentId", "designation", "dateOfJoining", "probationEnd", "status", "probationStatus"];
    const hasJobError = jobKeys.some((k) => errors[k]);

    if (hasPersonalError && modalTab !== "personal") {
      setModalTab("personal");
    } else if (!hasPersonalError && hasJobError && modalTab !== "job") {
      setModalTab("job");
    }

    return Object.keys(errors).length === 0;
  };

  // Submit Handler (Create / Update)
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateForm()) {
      toast.error("Please resolve highlighted form validation errors.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: formData.employeeId?.trim() || undefined,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || null,
        dob: formData.dob || undefined,
        address: formData.address?.trim() || null,
        totalExperienceYears: parseFloat(formData.totalExperienceYears) || 0,
        departmentId: formData.departmentId,
        designation: formData.designation.trim(),
        managerId: formData.managerId || null,
        dateOfJoining: formData.dateOfJoining,
        probationEnd: formData.probationEnd || undefined,
        probationStatus: formData.probationStatus,
        status: formData.status,
        bankId: formData.bankId ? parseInt(formData.bankId, 10) : null,
        bankName: formData.bankName?.trim() || null,
        accountNumber: formData.accountNumber?.trim() || null,
        ifscCode: formData.ifscCode?.trim()?.toUpperCase() || null,
        panNumber: formData.panNumber?.trim()?.toUpperCase() || null,
        aadharNumber: formData.aadharNumber ? formData.aadharNumber.replace(/\D/g, "") : null,
        resumeUrl: formData.resumeUrl || undefined,
        systemAccess: formData.systemAccess,
        photoUrl: formData.photoUrl || undefined,
      };

      if (isEditing) {
        const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/${editingEmployeeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = Array.isArray(errData.message)
            ? errData.message.join(", ")
            : (errData.message || errData.error || "Failed to update employee record");
          throw new Error(msg);
        }
        toast.success(`Employee ${formData.firstName} ${formData.lastName} updated successfully!`);
      } else {
        const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = Array.isArray(errData.message)
            ? errData.message.join(", ")
            : (errData.message || errData.error || "Failed to create new employee");
          throw new Error(msg);
        }
        toast.success(`Employee ${formData.firstName} ${formData.lastName} added to Core HR roster!`);
      }

      setIsEntryModalOpen(false);
      fetchEmployees(true);
      fetchStats();
    } catch (err) {
      const errorMsg = err?.message || "Operation failed";
      toast.error(errorMsg);
      if (errorMsg.toLowerCase().includes("email")) {
        setFormErrors((prev) => ({ ...prev, email: errorMsg }));
        setModalTab("personal");
      } else if (errorMsg.toLowerCase().includes("employee id") || errorMsg.toLowerCase().includes("employeeid")) {
        setFormErrors((prev) => ({ ...prev, employeeId: errorMsg }));
        setModalTab("job");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errData.message)
          ? errData.message.join(", ")
          : (errData.message || errData.error || "Failed to delete employee profile");
        throw new Error(msg);
      }
      toast.success(`Employee ${deleteTarget.name} removed successfully.`);
      setDeleteTarget(null);
      fetchEmployees(true);
      fetchStats();
    } catch (err) {
      toast.error(err?.message || "Failed to delete employee");
    } finally {
      setDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!employees.length) {
      toast.info("No employee records to export.");
      return;
    }

    const headers = [
      "Employee ID",
      "Full Name",
      "Email",
      "Phone",
      "Date of Birth",
      "Residential Address",
      "Department",
      "Designation",
      "Date of Joining",
      "Experience (Years)",
      "Status",
      "Probation Status",
      "PAN Number",
      "Aadhaar Number",
      "Bank Account",
      "IFSC Code",
    ];

    const csvRows = employees.map((emp) => [
      `"${emp.employeeId || ""}"`,
      `"${emp.firstName || ""} ${emp.lastName || ""}"`,
      `"${emp.email || ""}"`,
      `"${emp.phone || ""}"`,
      `"${emp.dob ? new Date(emp.dob).toLocaleDateString() : ""}"`,
      `"${(emp.address || "").replace(/"/g, '""')}"`,
      `"${emp.department?.name || ""}"`,
      `"${emp.designation || ""}"`,
      `"${emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : ""}"`,
      `"${emp.totalExperienceYears || 0}"`,
      `"${emp.status || ""}"`,
      `"${emp.probationStatus || ""}"`,
      `"${emp.panNumber || ""}"`,
      `"${emp.aadharNumber || ""}"`,
      `"${emp.accountNumber || ""}"`,
      `"${emp.ifscCode || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Employees_Roster_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Employee roster exported to CSV!");
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status) => {
    const map = {
      ACTIVE: { bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", label: "Active" },
      ONBOARDING: { bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", label: "Onboarding" },
      EXITING: { bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", label: "Exiting" },
      RELIEVED: { bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", label: "Relieved" },
      PROBATION: { bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20", label: "Probation" },
      ON_LEAVE: { bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20", label: "On Leave" },
      NOTICE_PERIOD: { bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", label: "Notice Period" },
      TERMINATED: { bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", label: "Terminated" },
      RESIGNED: { bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", label: "Resigned" },
    };
    const config = map[status] || { bg: "bg-slate-500/10 text-slate-600", label: status };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {config.label}
      </span>
    );
  };

  const renderProbationBadge = (probStatus) => {
    if (probStatus === "CONFIRMED") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" /> Confirmed
        </span>
      );
    }
    if (probStatus === "EXTENDED") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Clock className="w-3.5 h-3.5" /> Extended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400">
        <Clock className="w-3.5 h-3.5" /> Under Review
      </span>
    );
  };

  // Columns definition for DataTable
  const columns = useMemo(
    () => [
      {
        key: "firstName",
        label: "Employee",
        render: (emp) => {
          const rowData = emp?.original || emp?.row || emp || {};
          const initials = `${rowData.firstName?.[0] || ""}${rowData.lastName?.[0] || ""}`.toUpperCase();
          const photoDoc = rowData.documents?.find((d) => d.documentType === "Photo" && d.fileUrl);

          return (
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm overflow-hidden shrink-0">
                {photoDoc?.fileUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`${backendUrl}${photoDoc.fileUrl}`}
                    alt={`${rowData.firstName || ""} ${rowData.lastName || ""}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>{initials || "EM"}</span>
                )}
              </div>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenDetails(rowData)}
                  className="font-semibold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors text-sm text-left truncate block"
                >
                  {rowData.firstName} {rowData.lastName}
                </button>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                      rowData.employeeId
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-medium"
                    }`}
                  >
                    {rowData.employeeId || "Pending ID"}
                  </span>
                  <span>•</span>
                  <span className="truncate">{rowData.email}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "designation",
        label: "Department & Role",
        render: (emp) => {
          const rowData = emp?.original || emp?.row || emp || {};
          return (
            <div>
              <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                {rowData.designation || "—"}
              </div>
              <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{rowData.department?.name || "Unassigned"}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "dateOfJoining",
        label: "Joining Date",
        render: (emp) => {
          const rowData = emp?.original || emp?.row || emp || {};
          return (
            <div className="text-xs space-y-0.5">
              <div className="text-slate-700 dark:text-slate-300 font-medium">
                {rowData.dateOfJoining ? new Date(rowData.dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </div>
              <div className="text-slate-400">
                Exp: {rowData.totalExperienceYears ? `${rowData.totalExperienceYears} yrs` : "Fresher"}
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        render: (emp) => {
          const rowData = emp?.original || emp?.row || emp || {};
          return (
            <div className="space-y-1">
              <div>{renderStatusBadge(rowData.status)}</div>
              <div>{renderProbationBadge(rowData.probationStatus)}</div>
            </div>
          );
        },
      },
      {
        key: "systemAccess",
        label: "System Access",
        render: (emp) => {
          const rowData = emp?.original || emp?.row || emp || {};
          const sa = rowData.systemAccess;
          if (!sa) return <span className="text-xs text-slate-400">—</span>;
          return (
            <div className="flex flex-wrap gap-1 max-w-[150px]">
              {sa.erpLogin && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ERP
                </span>
              )}
              {sa.email && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  Mail
                </span>
              )}
              {sa.attendanceApp && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  App
                </span>
              )}
              {sa.vpn && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  VPN
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        render: (emp) => {
          const rowData = emp?.original || emp?.row || emp || {};
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                title="View Profile & ID Card"
                onClick={() => handleOpenDetails(rowData)}
                className="h-8 w-8 text-slate-600 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30"
              >
                <Eye className="w-4 h-4" />
              </Button>

              <a
                href={`${backendUrl}/employees/pdf/${rowData.qrToken}`}
                target="_blank"
                rel="noreferrer"
                title="Download Official ID Card PDF"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
              >
                <IdCard className="w-4 h-4" />
              </a>

              {canUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Edit Employee Profile"
                  onClick={() => handleOpenEditModal(rowData)}
                  className="h-8 w-8 text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete Employee"
                  onClick={() => setDeleteTarget({ id: rowData.id, name: `${rowData.firstName} ${rowData.lastName}` })}
                  className="h-8 w-8 text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canUpdate, canDelete, backendUrl]
  );

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-sky-600 dark:text-sky-400 mb-1 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Core HRMS</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span>Employee Master</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            Employees Entry & Master Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Register new employee profiles, manage statutory & banking details, and generate digital ID credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Export CSV
          </Button>

          {canCreate && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 font-medium"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              + New Employee Entry
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.totalEmployees}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Employees
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.activeEmployees}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Workforce
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.onboardingEmployees}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              In Onboarding
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.probationEmployees}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Under Probation
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {stats.departmentsCount}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Departments
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, ID, email, role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-hidden text-slate-700 dark:text-slate-200 text-xs cursor-pointer font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent border-none outline-hidden text-slate-700 dark:text-slate-200 text-xs cursor-pointer font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="PROBATION">Under Probation</option>
              <option value="EXITING">Exiting</option>
              <option value="RELIEVED">Relieved</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setDepartmentFilter("ALL");
              setStatusFilter("ALL");
              setPage(1);
            }}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Main Employee Table */}
      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        totalRecords={totalRecords}
        page={page}
        rows={rows}
        searchable={false}
        onPageChange={setPage}
        onRowsChange={setRows}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
        emptyMessage={
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No employees found
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No employee records match your active search filters or no employees have been entered into Core HR yet.
            </p>
            {canCreate && (
              <Button size="sm" onClick={handleOpenCreateModal} className="bg-sky-600 hover:bg-sky-700 text-white text-xs mt-2">
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Add First Employee
              </Button>
            )}
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* NEW EMPLOYEE ENTRY / EDIT MODAL                                           */}
      {/* ========================================================================= */}
      {isEntryModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEntryModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-sky-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isEditing ? "Edit Employee Profile" : "New Employee Entry"}
                  </h2>
                  <p className="text-xs text-sky-200/80">
                    {isEditing
                      ? "Update master credentials, department, and role placement"
                      : "Register new staff profile & job placement into Core HRMS"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEntryModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-5 pt-2 gap-2 overflow-x-auto">
              {[
                {
                  id: "personal",
                  label: "Personal & Identity",
                  icon: Users,
                  hasError: ["photoUrl", "resumeUrl", "firstName", "lastName", "email", "phone", "dob", "totalExperienceYears", "aadharNumber", "panNumber", "address"].some(k => formErrors[k]),
                },
                {
                  id: "job",
                  label: "Job & Placement",
                  icon: Briefcase,
                  hasError: ["employeeId", "departmentId", "designation", "dateOfJoining", "probationEnd", "status", "probationStatus"].some(k => formErrors[k]),
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = modalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setModalTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                      isActive
                        ? "border-sky-600 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 shadow-xs"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.hasError && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Has form errors" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
              {/* TAB 1: PERSONAL & IDENTITY */}
              {modalTab === "personal" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Avatar & Resume Upload Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Avatar Upload Preview */}
                    <div className={`flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border ${formErrors.photoUrl ? "border-rose-500 bg-rose-50/20" : "border-slate-200/80 dark:border-slate-800"}`}>
                      <div className={`relative w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-dashed ${formErrors.photoUrl ? "border-rose-400" : "border-sky-400/50"} flex items-center justify-center overflow-hidden shrink-0`}>
                        {formData.photoUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={`${backendUrl}${formData.photoUrl}`}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-slate-400" />
                        )}
                        {uploadingPhoto && (
                          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Profile Photo <span className="text-rose-500">*</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          ID badge photo (PNG/JPG &lt; 5MB)
                        </p>
                        <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-medium cursor-pointer transition-colors shadow-xs">
                          <UploadCloud className="w-3 h-3" />
                          <span>{formData.photoUrl ? "Change Photo" : "Upload Photo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              handlePhotoUpload(e);
                              if (formErrors.photoUrl) setFormErrors({ ...formErrors, photoUrl: null });
                            }}
                            className="hidden"
                            disabled={uploadingPhoto}
                          />
                        </label>
                        {formErrors.photoUrl && (
                          <p className="text-[11px] text-rose-500 font-medium">{formErrors.photoUrl}</p>
                        )}
                      </div>
                    </div>

                    {/* Resume / CV Upload */}
                    <div className={`flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border ${formErrors.resumeUrl ? "border-rose-500 bg-rose-50/20" : "border-slate-200/80 dark:border-slate-800"}`}>
                      <div className={`relative w-14 h-14 rounded-xl bg-sky-50 dark:bg-sky-950/50 border-2 border-dashed ${formErrors.resumeUrl ? "border-rose-400" : "border-sky-400/50"} flex items-center justify-center overflow-hidden shrink-0 text-sky-600 dark:text-sky-400`}>
                        <FileText className="w-6 h-6" />
                        {uploadingResume && (
                          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white">
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Resume / CV <span className="text-rose-500">*</span>
                          </div>
                          {formData.resumeUrl && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              Uploaded
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          PDF, DOC, DOCX (&lt; 10MB)
                        </p>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-[11px] font-medium cursor-pointer transition-colors shadow-xs">
                            <UploadCloud className="w-3 h-3" />
                            <span>{formData.resumeUrl ? "Replace CV" : "Upload CV"}</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              onChange={(e) => {
                                handleResumeUpload(e);
                                if (formErrors.resumeUrl) setFormErrors({ ...formErrors, resumeUrl: null });
                              }}
                              className="hidden"
                              disabled={uploadingResume}
                            />
                          </label>

                          {formData.resumeUrl && (
                            <a
                              href={`${backendUrl}${formData.resumeUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400 text-[11px] font-medium transition-colors border border-sky-200 dark:border-sky-800"
                              title="Preview uploaded Resume"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View</span>
                            </a>
                          )}
                        </div>
                        {formErrors.resumeUrl && (
                          <p className="text-[11px] text-rose-500 font-medium">{formErrors.resumeUrl}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        First Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. John"
                        value={formData.firstName}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\d/g, "");
                          setFormData({ ...formData, firstName: val });
                          if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: null });
                        }}
                        className={formErrors.firstName ? "border-rose-500" : ""}
                      />
                      {formErrors.firstName && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Last Name <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Doe"
                        value={formData.lastName}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\d/g, "");
                          setFormData({ ...formData, lastName: val });
                          if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: null });
                        }}
                        className={formErrors.lastName ? "border-rose-500" : ""}
                      />
                      {formErrors.lastName && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Official Work Email <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="john.doe@aspinopharm.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                        }}
                        className={formErrors.email ? "border-rose-500" : ""}
                      />
                      {formErrors.email && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Mobile Contact Number (10 Digits) <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setFormData({ ...formData, phone: val });
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                        }}
                        className={formErrors.phone ? "border-rose-500" : ""}
                      />
                      {formErrors.phone && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Date of Birth (DOB) <span className="text-rose-500">*</span>
                      </Label>
                      <DatePicker
                        date={formData.dob}
                        setDate={(d) => {
                          setFormData({ ...formData, dob: d });
                          if (formErrors.dob) setFormErrors({ ...formErrors, dob: null });
                        }}
                        placeholder="Select Date of Birth"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                        className={formErrors.dob ? "border-rose-500" : ""}
                      />
                      {formErrors.dob && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.dob}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Total Prior Experience (Years) <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        value={formData.totalExperienceYears}
                        onChange={(e) => {
                          setFormData({ ...formData, totalExperienceYears: e.target.value });
                          if (formErrors.totalExperienceYears) setFormErrors({ ...formErrors, totalExperienceYears: null });
                        }}
                        className={formErrors.totalExperienceYears ? "border-rose-500" : ""}
                      />
                      {formErrors.totalExperienceYears && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.totalExperienceYears}</p>
                      )}
                    </div>
                  </div>

                  {/* Identity Credentials (Aadhaar & PAN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <IdCard className="w-3.5 h-3.5 text-sky-500" />
                          Aadhaar Card Number <span className="text-rose-500">*</span>
                        </Label>
                        <span className={`text-[10px] font-mono ${(formData.aadharNumber || "").replace(/\D/g, "").length === 12 ? "text-emerald-500 font-semibold" : "text-slate-400"}`}>
                          {formData.aadharNumber ? `${formData.aadharNumber.replace(/\D/g, "").length}/12 digits` : "12 digits"}
                        </span>
                      </div>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="e.g. 1234 5678 9012"
                        value={formData.aadharNumber ? formData.aadharNumber.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim() : ""}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                          setFormData({ ...formData, aadharNumber: raw });
                          if (formErrors.aadharNumber) setFormErrors({ ...formErrors, aadharNumber: null });
                        }}
                        className={`font-mono tracking-wider ${formErrors.aadharNumber ? "border-rose-500" : ""}`}
                      />
                      {formErrors.aadharNumber ? (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.aadharNumber}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400">12-digit UIDAI identity number.</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-sky-500" />
                          PAN Card Number <span className="text-rose-500">*</span>
                        </Label>
                        <span className={`text-[10px] font-mono ${(formData.panNumber || "").length === 10 ? "text-emerald-500 font-semibold" : "text-slate-400"}`}>
                          {formData.panNumber ? `${formData.panNumber.length}/10 chars` : "10 chars"}
                        </span>
                      </div>
                      <Input
                        type="text"
                        maxLength={10}
                        placeholder="e.g. ABCDE1234F"
                        value={formData.panNumber || ""}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
                          setFormData({ ...formData, panNumber: val });
                          if (formErrors.panNumber) setFormErrors({ ...formErrors, panNumber: null });
                        }}
                        className={`font-mono uppercase tracking-wider ${formErrors.panNumber ? "border-rose-500" : ""}`}
                      />
                      {formErrors.panNumber ? (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.panNumber}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400">10-character Permanent Account Number.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      Residential / Communication Address <span className="text-rose-500">*</span>
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="e.g. Plot No. 42, GIDC Industrial Estate, Ankleshwar, Gujarat - 393002"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                      }}
                      className={`text-sm ${formErrors.address ? "border-rose-500" : ""}`}
                    />
                    {formErrors.address && (
                      <p className="text-[11px] text-rose-500 font-medium">{formErrors.address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: JOB & PLACEMENT */}
              {modalTab === "job" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Employee ID <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. EMP-001 or ASP-2026-001"
                        value={formData.employeeId}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setFormData({ ...formData, employeeId: val });
                          if (val.trim()) {
                            const dupEmp = (employees || []).find(
                              (emp) =>
                                String(emp.id) !== String(editingEmployeeId) &&
                                emp.employeeId &&
                                emp.employeeId.trim().toUpperCase() === val.trim()
                            );
                            if (dupEmp) {
                              setFormErrors((prev) => ({
                                ...prev,
                                employeeId: `Employee ID "${val.trim()}" is already assigned to ${dupEmp.firstName} ${dupEmp.lastName}.`,
                              }));
                            } else if (formErrors.employeeId) {
                              setFormErrors((prev) => ({ ...prev, employeeId: null }));
                            }
                          } else if (formErrors.employeeId) {
                            setFormErrors((prev) => ({ ...prev, employeeId: null }));
                          }
                        }}
                        className={`font-mono text-sm uppercase ${formErrors.employeeId ? "border-rose-500" : ""}`}
                      />
                      {formErrors.employeeId ? (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.employeeId}</p>
                      ) : (
                        <p className="text-[11px] text-slate-400">
                          Enter unique employee ID code.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Department <span className="text-rose-500">*</span>
                      </Label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => {
                          setFormData({ ...formData, departmentId: e.target.value });
                          if (formErrors.departmentId) setFormErrors({ ...formErrors, departmentId: null });
                        }}
                        className={`w-full h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-sky-500 ${
                          formErrors.departmentId
                            ? "border-rose-500"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.departmentId && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.departmentId}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Job Designation <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Quality Control Chemist / HR Exec"
                        value={formData.designation}
                        onChange={(e) => {
                          setFormData({ ...formData, designation: e.target.value });
                          if (formErrors.designation) setFormErrors({ ...formErrors, designation: null });
                        }}
                        className={formErrors.designation ? "border-rose-500" : ""}
                      />
                      {formErrors.designation && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.designation}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Reporting Manager</Label>
                      <select
                        value={formData.managerId}
                        onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                        className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="">None / Top Level Head</option>
                        {employees
                          .filter((e) => !editingEmployeeId || e.id !== editingEmployeeId)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.firstName} {m.lastName} ({m.designation})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Date of Joining <span className="text-rose-500">*</span>
                      </Label>
                      <DatePicker
                        date={formData.dateOfJoining}
                        setDate={(doj) => {
                          let pEnd = "";
                          if (doj) {
                            const d = new Date(doj);
                            d.setMonth(d.getMonth() + 6);
                            pEnd = d.toISOString().split("T")[0];
                          }
                          setFormData({
                            ...formData,
                            dateOfJoining: doj,
                            probationEnd: formData.probationEnd || pEnd,
                          });
                          if (formErrors.dateOfJoining) setFormErrors({ ...formErrors, dateOfJoining: null });
                          if (formErrors.probationEnd && (formData.probationEnd || pEnd)) setFormErrors((prev) => ({ ...prev, probationEnd: null }));
                        }}
                        placeholder="Select Date of Joining"
                        fromYear={2000}
                        toYear={new Date().getFullYear() + 2}
                        className={formErrors.dateOfJoining ? "border-rose-500" : ""}
                      />
                      {formErrors.dateOfJoining && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.dateOfJoining}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Probation End Date <span className="text-rose-500">*</span>
                      </Label>
                      <DatePicker
                        date={formData.probationEnd}
                        setDate={(d) => {
                          setFormData({ ...formData, probationEnd: d });
                          if (formErrors.probationEnd) setFormErrors({ ...formErrors, probationEnd: null });
                        }}
                        placeholder="Select Probation End Date"
                        fromYear={2000}
                        toYear={new Date().getFullYear() + 2}
                        className={formErrors.probationEnd ? "border-rose-500" : ""}
                      />
                      {formErrors.probationEnd && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.probationEnd}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Employment Status <span className="text-rose-500">*</span>
                      </Label>
                      <select
                        value={formData.status}
                        onChange={(e) => {
                          setFormData({ ...formData, status: e.target.value });
                          if (formErrors.status) setFormErrors({ ...formErrors, status: null });
                        }}
                        className={`w-full h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden ${formErrors.status ? "border-rose-500" : "border-slate-200 dark:border-slate-800"}`}
                      >
                        <option value="ACTIVE">ACTIVE (Full Working Staff)</option>
                        <option value="ONBOARDING">ONBOARDING (Under Induction)</option>
                        <option value="EXITING">EXITING (Exit Process)</option>
                        <option value="RELIEVED">RELIEVED (Relieved Staff)</option>
                      </select>
                      {formErrors.status && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.status}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Probation Review Status <span className="text-rose-500">*</span>
                      </Label>
                      <select
                        value={formData.probationStatus}
                        onChange={(e) => {
                          setFormData({ ...formData, probationStatus: e.target.value });
                          if (formErrors.probationStatus) setFormErrors({ ...formErrors, probationStatus: null });
                        }}
                        className={`w-full h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden ${formErrors.probationStatus ? "border-rose-500" : "border-slate-200 dark:border-slate-800"}`}
                      >
                        <option value="UNDER_REVIEW">UNDER_REVIEW (Active Review)</option>
                        <option value="EXTENDED">EXTENDED (Further Evaluation)</option>
                        <option value="CONFIRMED">CONFIRMED (Permanent Staff)</option>
                      </select>
                      {formErrors.probationStatus && (
                        <p className="text-[11px] text-rose-500 font-medium">{formErrors.probationStatus}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEntryModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  {modalTab === "job" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalTab("personal")}
                    >
                      ← Previous
                    </Button>
                  )}

                  {modalTab === "personal" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const personalErrors = {};
                        if (!formData.photoUrl?.trim()) personalErrors.photoUrl = "Profile photo is required.";
                        if (!formData.resumeUrl?.trim()) personalErrors.resumeUrl = "Resume / CV document is required.";
                        if (!formData.firstName?.trim()) personalErrors.firstName = "First name is required.";
                        if (!formData.lastName?.trim()) personalErrors.lastName = "Last name is required.";
                        if (!formData.email?.trim()) personalErrors.email = "Official work email is required.";
                        if (!formData.phone?.trim()) personalErrors.phone = "Mobile contact number is required.";
                        if (!formData.dob) personalErrors.dob = "Date of Birth is required.";
                        if (formData.totalExperienceYears === "" || formData.totalExperienceYears === null || formData.totalExperienceYears === undefined) personalErrors.totalExperienceYears = "Total prior experience is required.";
                        if (!formData.aadharNumber?.trim()) personalErrors.aadharNumber = "Aadhaar Card number is required.";
                        if (!formData.panNumber?.trim()) personalErrors.panNumber = "PAN Card number is required.";
                        if (!formData.address?.trim()) personalErrors.address = "Residential address is required.";

                        if (Object.keys(personalErrors).length > 0) {
                          setFormErrors((prev) => ({ ...prev, ...personalErrors }));
                          toast.error("Please fill in all required personal details.");
                        } else {
                          setModalTab("job");
                        }
                      }}
                    >
                      Next Step →
                    </Button>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm font-semibold"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                    {isEditing ? "Save Profile Changes" : "Create Employee Entry"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL EMPLOYEE PROFILE & DIGITAL ID CARD MODAL                             */}
      {/* ========================================================================= */}
      {isDetailsOpen && selectedEmployee && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailsOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Top Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-sky-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sky-500/20 border-2 border-sky-400/40 flex items-center justify-center font-bold text-sky-400 overflow-hidden shrink-0">
                  {selectedEmployee.documents?.find((d) => d.documentType === "Photo" && d.fileUrl)?.fileUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`${backendUrl}${selectedEmployee.documents.find((d) => d.documentType === "Photo").fileUrl}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {selectedEmployee.firstName?.[0]}
                      {selectedEmployee.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-sky-200/80">
                    <span className="font-mono bg-sky-900/60 px-1.5 py-0.5 rounded text-[11px]">
                      {selectedEmployee.employeeId || "Pending ID"}
                    </span>
                    <span>•</span>
                    <span>{selectedEmployee.designation}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`${backendUrl}/employees/pdf/${selectedEmployee.qrToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ID Card PDF</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsDetailsOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-5 pt-2 gap-1 shrink-0 overflow-x-auto">
              {[
                { id: "overview", label: "Profile Overview", icon: Users },
                { id: "documents", label: "Documents Checklist", icon: FileCheck },
                { id: "bank", label: "Banking & Statutory", icon: CreditCard },
                { id: "access", label: "System Access", icon: ShieldCheck },
                { id: "idcard", label: "Digital Badge", icon: QrCode },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = detailsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailsTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
                      isActive
                        ? "border-sky-600 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900 shadow-xs"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* DETAILS TAB: OVERVIEW */}
              {detailsTab === "overview" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Department</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                        {selectedEmployee.department?.name || "—"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Designation</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                        {selectedEmployee.designation || "—"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Date of Joining</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                        {selectedEmployee.dateOfJoining ? new Date(selectedEmployee.dateOfJoining).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total Experience</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                        {selectedEmployee.totalExperienceYears ? `${selectedEmployee.totalExperienceYears} Years` : "Fresher"}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Contact & Personal Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Work Email</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{selectedEmployee.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Phone</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{selectedEmployee.phone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Date of Birth (DOB)</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {selectedEmployee.dob
                            ? new Date(selectedEmployee.dob).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Aadhaar Card Number</span>
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                          {selectedEmployee.aadharNumber ? selectedEmployee.aadharNumber.replace(/(\d{4})(?=\d)/g, "$1 ") : "—"}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block">Residential Address</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {selectedEmployee.address || "—"}
                        </span>
                      </div>
                      {(() => {
                        const resumeLink = selectedEmployee.resumeUrl || selectedEmployee.documents?.find(d => d.documentType === 'Resume / CV')?.fileUrl;
                        return (
                          <div className="sm:col-span-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-sky-500" />
                              Curriculum Vitae / Resume
                            </span>
                            {resumeLink ? (
                              <a
                                href={`${backendUrl}${resumeLink}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Resume</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Not uploaded</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Organizational Hierarchy
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 block">Reporting Manager</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedEmployee.manager
                          ? `${selectedEmployee.manager.firstName} ${selectedEmployee.manager.lastName} (${selectedEmployee.manager.designation})`
                          : "Top Level / Head of Department"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS TAB: DOCUMENTS CHECKLIST */}
              {detailsTab === "documents" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Mandatory onboarding compliance documents checklist and verification status.
                  </div>

                  <div className="space-y-2">
                    {selectedEmployee.documents?.length ? (
                      selectedEmployee.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {doc.documentType}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {doc.verifiedAt ? `Verified on ${new Date(doc.verifiedAt).toLocaleDateString()}` : "Pending Verification"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {doc.status === "VERIFIED" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                VERIFIED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                {doc.status || "PENDING"}
                              </span>
                            )}

                            {doc.fileUrl && (
                              <a
                                href={`${backendUrl}${doc.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                title="View Document File"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No onboarding documents registered yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DETAILS TAB: BANK & STATUTORY */}
              {detailsTab === "bank" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Bank Account Details
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Bank Name</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedEmployee.bank?.name || selectedEmployee.bankName || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Account Number</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {selectedEmployee.accountNumber || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">IFSC Code</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                          {selectedEmployee.ifscCode || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Tax & Statutory Credentials
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Aadhaar Card Number</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {selectedEmployee.aadharNumber ? selectedEmployee.aadharNumber.replace(/(\d{4})(?=\d)/g, "$1 ") : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Permanent Account Number (PAN)</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {selectedEmployee.panNumber || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Probation Status</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {selectedEmployee.probationStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS TAB: SYSTEM ACCESS */}
              {detailsTab === "access" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Configured digital system access permissions and application privileges.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "erpLogin", title: "Aspino Core ERP", icon: Laptop },
                      { key: "email", title: "Corporate Mailbox", icon: Mail },
                      { key: "attendanceApp", title: "Mobile Attendance App", icon: Clock },
                      { key: "vpn", title: "Plant VPN Gateway", icon: ShieldCheck },
                    ].map((item) => {
                      const Icon = item.icon;
                      const hasAccess = !!selectedEmployee.systemAccess?.[item.key];
                      return (
                        <div
                          key={item.key}
                          className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-sky-500" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {item.title}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              hasAccess
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-slate-500/10 text-slate-500"
                            }`}
                          >
                            {hasAccess ? "ENABLED" : "DISABLED"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DETAILS TAB: DIGITAL BADGE PREVIEW */}
              {detailsTab === "idcard" && (
                <div className="space-y-4 text-center">
                  <div className="text-xs text-slate-500">
                    Official Aspino HRMS Digital Verification Badge.
                  </div>

                  {/* Physical ID Card Preview Box */}
                  <div className="mx-auto w-[240px] bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300 overflow-hidden text-left">
                    {/* Dark Navy Header */}
                    <div className="bg-[#0b1329] p-3 text-center border-b-2 border-emerald-500">
                      <div className="text-emerald-400 font-extrabold text-sm tracking-wider">
                        ASPINO HRMS
                      </div>
                      <div className="text-[9px] text-slate-300 uppercase tracking-widest">
                        Official ID Card
                      </div>
                    </div>

                    {/* Avatar Ring */}
                    <div className="pt-4 pb-2 text-center">
                      <div className="relative inline-block w-16 h-16 rounded-full ring-2 ring-emerald-500 p-0.5 bg-white shadow-md overflow-hidden">
                        {selectedEmployee.documents?.find((d) => d.documentType === "Photo" && d.fileUrl)?.fileUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={`${backendUrl}${selectedEmployee.documents.find((d) => d.documentType === "Photo").fileUrl}`}
                            alt="Badge Photo"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm rounded-full">
                            {selectedEmployee.firstName?.[0]}
                            {selectedEmployee.lastName?.[0]}
                          </div>
                        )}
                      </div>

                      <div className="font-bold text-xs text-slate-900 mt-2">
                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        {selectedEmployee.designation}
                      </div>
                    </div>

                    {/* Detail Lines */}
                    <div className="px-4 py-2 space-y-1.5 text-[10px] border-t border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">ID:</span>
                        <span className="font-mono font-bold text-slate-800">{selectedEmployee.employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">DEPT:</span>
                        <span className="font-semibold text-slate-800">{selectedEmployee.department?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">JOIN:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedEmployee.dateOfJoining ? new Date(selectedEmployee.dateOfJoining).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-[#0b1329] p-2.5 text-center text-white border-t border-emerald-500">
                      <div className="text-[9px] font-bold text-emerald-400">
                        ✓ VERIFIED DIGITAL ID
                      </div>
                      <div className="text-[7.5px] text-slate-400 tracking-wider mt-0.5">
                        SCAN QR CODE TO VALIDATE
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`${backendUrl}/employees/pdf/${selectedEmployee.qrToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Printable PDF ID Card</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Employee Profile"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? All linked records (onboarding documents, shift rosters, and system permissions) will be permanently cleaned up.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
