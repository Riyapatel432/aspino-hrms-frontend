"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  Briefcase,
  UserCheck,
  Calendar,
  Star,
  FileText,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  FolderTree,
  Trash2,
  Edit,
  Download,
  RotateCcw,
  Printer,
  Eye,
  Sparkles,
  UserPlus,
  Users,
  Landmark,
  ShieldCheck,
  Info,
  ClipboardCheck,
  History,
  FileUp,
  AlertCircle,
  ChevronRight,
  X,
  Filter
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRequisitions,
  fetchCandidates,
  fetchSchedules,
  fetchOffers,
  fetchDepartments,
  createRequisition,
  createCandidate,
  updateCandidateStatus,
  createSchedule,
  createOffer,
  updateOfferStatus
} from "@/features/recruitment/store/recruitmentSlice";
import { toast } from "sonner";

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState("requisitions");
  const [viewOfferModal, setViewOfferModal] = useState(null);
  // CNV Compliance Modal State
  const [cnvModal, setCnvModal] = useState(null); // { requisition } or null
  const [cnvData, setCnvData] = useState(null);   // CnvRecord from API
  const [cnvLoading, setCnvLoading] = useState(false);
  const [cnvSection, setCnvSection] = useState("overview"); // "overview" | "submit" | "acknowledge"
  const [cnvFormErrors, setCnvFormErrors] = useState({});
  const [cnvSubmitForm, setCnvSubmitForm] = useState({
    employmentExchangeOffice: "",
    notificationDate: "",
    submissionMode: "",
    referenceNumber: "",
    cnvRemarks: "",
    submittedBy: "",
  });
  const [cnvAckForm, setCnvAckForm] = useState({
    acknowledgementNumber: "",
    acknowledgementDate: "",
    cnvRemarks: "",
    acknowledgedBy: "",
  });
  const [cnvSubmitFile, setCnvSubmitFile] = useState(null);
  const [cnvAckFile, setCnvAckFile] = useState(null);
  const [cnvSubmitting, setCnvSubmitting] = useState(false);
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);

  const {
    requisitions,
    totalRequisitions = 0,
    candidates,
    totalCandidates = 0,
    schedules,
    totalSchedules = 0,
    offers,
    totalOffers = 0,
    departments,
    loading
  } = useSelector((state) => state.recruitment);

  // Pagination & Server Query State for each tab
  const [reqPage, setReqPage] = useState(1);
  const [reqRows, setReqRows] = useState(10);
  const [reqSearch, setReqSearch] = useState("");
  const [reqSortBy, setReqSortBy] = useState("createdAt");
  const [reqSortOrder, setReqSortOrder] = useState("desc");

  const [candPage, setCandPage] = useState(1);
  const [candRows, setCandRows] = useState(10);
  const [candSearch, setCandSearch] = useState("");
  const [candSortBy, setCandSortBy] = useState("createdAt");
  const [candSortOrder, setCandSortOrder] = useState("desc");
  const [candStatusFilter, setCandStatusFilter] = useState("ALL");

  const [schedPage, setSchedPage] = useState(1);
  const [schedRows, setSchedRows] = useState(10);
  const [schedSearch, setSchedSearch] = useState("");
  const [schedSortBy, setSchedSortBy] = useState("scheduledAt");
  const [schedSortOrder, setSchedSortOrder] = useState("desc");
  const [schedStatusFilter, setSchedStatusFilter] = useState("ALL");
  const [schedDateFilter, setSchedDateFilter] = useState("");

  const [offerPage, setOfferPage] = useState(1);
  const [offerRows, setOfferRows] = useState(10);
  const [offerSearch, setOfferSearch] = useState("");
  const [offerSortBy, setOfferSortBy] = useState("createdAt");
  const [offerSortOrder, setOfferSortOrder] = useState("desc");

  useEffect(() => {
    if (activeTab !== "requisitions") return;
    dispatch(fetchRequisitions({ page: reqPage, limit: reqRows, search: reqSearch, sortBy: reqSortBy, sortOrder: reqSortOrder }));
  }, [dispatch, activeTab, reqPage, reqRows, reqSearch, reqSortBy, reqSortOrder]);

  useEffect(() => {
    if (activeTab !== "candidates") return;
    dispatch(fetchCandidates({
      page: candPage,
      limit: candRows,
      search: candSearch,
      sortBy: candSortBy,
      sortOrder: candSortOrder,
      status: candStatusFilter === "ALL" ? undefined : candStatusFilter,
    }));
  }, [dispatch, activeTab, candPage, candRows, candSearch, candSortBy, candSortOrder, candStatusFilter]);

  useEffect(() => {
    if (activeTab !== "interviews") return;
    dispatch(fetchSchedules({
      page: schedPage,
      limit: schedRows,
      search: schedSearch,
      sortBy: schedSortBy,
      sortOrder: schedSortOrder,
      status: schedStatusFilter === "ALL" ? undefined : schedStatusFilter,
      date: schedDateFilter || undefined,
    }));
  }, [dispatch, activeTab, schedPage, schedRows, schedSearch, schedSortBy, schedSortOrder, schedStatusFilter, schedDateFilter]);

  useEffect(() => {
    if (activeTab !== "offers") return;
    dispatch(fetchOffers({ page: offerPage, limit: offerRows, search: offerSearch, sortBy: offerSortBy, sortOrder: offerSortOrder }));
  }, [dispatch, activeTab, offerPage, offerRows, offerSearch, offerSortBy, offerSortOrder]);

  const [dropdownRequisitions, setDropdownRequisitions] = useState([]);
  const [dropdownCandidates, setDropdownCandidates] = useState([]);
  const [dropdownEmployees, setDropdownEmployees] = useState([]);

  // Departments & Employees: needed on Job Requisitions tab (form dropdowns)
  useEffect(() => {
    if (activeTab !== "requisitions") return;
    dispatch(fetchDepartments());
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${backendUrl}/staff-hrms/recruitment/employees`)
      .then(res => res.json())
      .then(data => setDropdownEmployees(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch employees for replacement:", err));
  }, [dispatch, activeTab]);

  // Requisitions dropdown: needed on Candidates & Sourcing tab (Job Requisition select)
  useEffect(() => {
    if (activeTab !== "candidates") return;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions`)
      .then(res => res.json())
      .then(data => setDropdownRequisitions(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch dropdown requisitions:", err));
  }, [activeTab]);

  // Candidates dropdown + Users: needed on Interview Scheduling tab (Candidate select & Panel Members)
  useEffect(() => {
    if (activeTab !== "interviews") return;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${backendUrl}/staff-hrms/recruitment/candidates`)
      .then(res => res.json())
      .then(data => setDropdownCandidates(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch dropdown candidates:", err));

    apiFetch(`${backendUrl}/users`)
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch users:", err));
  }, [activeTab]);

  // Requisition Form State
  const [newReq, setNewReq] = useState({
    title: "",
    departmentId: "",
    headcount: 1,
    experienceRequired: "",
    justification: "",
    jobSpecification: "",
    requisitionType: "NEW_REQUIREMENT",
    replacementForEmployeeId: "",
    raisedBy: "",
    isCnvApplicable: false,
    cnvExchangeOffice: "",
    cnvRefNumber: "",
    cnvNotificationDate: "",
    cnvStatus: "NOT_REQUIRED",
    cnvExemptionReason: ""
  });
  // Candidate Form State
  const [newCand, setNewCand] = useState({ name: "", email: "", phone: "", source: "", requisitionId: "", experienceYears: "", resumeUrl: "" });
  const [uploadingFile, setUploadingFile] = useState(false);
  // Schedule Form State
  const [newSched, setNewSched] = useState({ candidateId: "", roundName: "", scheduledAt: "", panelists: [] });
  // Feedback Form State
  const [newFeedback, setNewFeedback] = useState({ id: "", scheduleId: "", panelistId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
  const [feedbackCandidateId, setFeedbackCandidateId] = useState("ALL");
  // Offer Form State
  const [newOffer, setNewOffer] = useState({ candidateId: "", role: "", salary: "", joiningDate: "" });

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, type, label }
  const [deleting, setDeleting] = useState(false);
  
  // Edit States
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const getResumeUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    const base = backendUrl.replace(/\/+$/, "");
    if (url.startsWith("/uploads/") || url.startsWith("uploads/")) {
      return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    if (url.startsWith("/")) {
      return `${base}${url}`;
    }
    return `${base}/uploads/resumes/${url}`;
  };

  // --- Panelist Parsing & Display Helpers ---
  const parsePanelistList = (raw) => {
    if (!raw) return [];
    let items = [];
    if (Array.isArray(raw)) {
      items = raw;
    } else if (typeof raw === "string") {
      let str = raw.trim();
      while ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith('\\"') && str.endsWith('\\"'))) {
        try { str = JSON.parse(str); } catch (e) { break; }
      }
      if (str.startsWith("[") || str.startsWith("{")) {
        try {
          const parsed = JSON.parse(str.replace(/^{/, "[").replace(/}$/, "]"));
          if (Array.isArray(parsed)) items = parsed;
        } catch (e) {
          items = str.replace(/[{}\[\]\\"]/g, "").split(",").map(s => s.trim()).filter(Boolean);
        }
      } else {
        items = str.split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    const cleaned = [];
    for (const item of items) {
      if (!item) continue;
      if (typeof item === "string") {
        const trimmed = item.replace(/[{}\[\]\\"]/g, "").trim();
        if (trimmed) {
          trimmed.split(",").forEach(sub => {
            const s = sub.trim();
            if (s) cleaned.push(s);
          });
        }
      } else {
        cleaned.push(String(item));
      }
    }
    return Array.from(new Set(cleaned));
  };

  const formatPanelistNames = (rawPanelists, usersList = []) => {
    const idsOrNames = parsePanelistList(rawPanelists);
    if (idsOrNames.length === 0) return [];
    return idsOrNames.map((item) => {
      const found = (usersList || []).find((u) => String(u.id) === String(item) || u.name?.toLowerCase() === String(item).toLowerCase());
      return found ? found.name : item;
    }).filter(Boolean);
  };

  const computeEmployeeTenure = (doj, lastDay, createdAt) => {
    const rawStart = doj || createdAt;
    if (!rawStart) return "N/A";
    const start = new Date(rawStart);
    if (isNaN(start.getTime())) return "N/A";
    const end = lastDay && !isNaN(new Date(lastDay).getTime()) ? new Date(lastDay) : new Date();
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365.25);
    const months = Math.floor((totalDays % 365.25) / 30.4375);
    if (years === 0 && months === 0) return "< 1 Mo";
    if (years === 0) return `${months} Mos`;
    if (months === 0) return `${years} Yrs`;
    return `${years} Yrs ${months} Mos`;
  };

  const getRoleExperienceEstimate = (designation) => {
    if (!designation) return "2 - 4 Yrs";
    const d = designation.toLowerCase();
    if (d.includes("director") || d.includes("vp") || d.includes("head") || d.includes("chief")) return "10+ Yrs";
    if (d.includes("principal") || d.includes("architect")) return "8+ Yrs";
    if (d.includes("manager") || d.includes("lead")) return "5 - 8 Yrs";
    if (d.includes("senior") || d.includes("sr")) return "4 - 6 Yrs";
    if (d.includes("mid") || d.includes("specialist") || d.includes("supervisor")) return "2 - 4 Yrs";
    if (d.includes("junior") || d.includes("jr") || d.includes("trainee") || d.includes("intern") || d.includes("associate")) return "0 - 1 Yr";
    return "2 - 4 Yrs";
  };

  const getEmployeeExperienceDetails = (emp) => {
    if (!emp) return { totalExp: "2 - 4 Yrs", companyTenure: "N/A", roleExp: "2 - 4 Yrs", formattedExp: "2 - 4 Yrs" };
    const tenure = computeEmployeeTenure(emp.dateOfJoining, emp.exitProcess?.lastWorkingDay || emp.exitProcess?.resignationDate, emp.createdAt);
    
    let priorExp = Number(emp.totalExperienceYears) || Number(emp.experienceYears) || 0;
    if (priorExp <= 0 && emp.email) {
      const candMatch = (candidates || []).find(c => c.email?.toLowerCase() === emp.email?.toLowerCase());
      if (candMatch && Number(candMatch.experienceYears) > 0) {
        priorExp = Number(candMatch.experienceYears);
      }
    }
    if (priorExp <= 0 && emp.id) {
      const dropEmp = (dropdownEmployees || []).find(e => String(e.id) === String(emp.id));
      if (dropEmp && Number(dropEmp.totalExperienceYears) > 0) {
        priorExp = Number(dropEmp.totalExperienceYears);
      }
    }

    const roleExp = getRoleExperienceEstimate(emp.designation);

    let totalExpStr = roleExp;
    if (priorExp > 0) {
      totalExpStr = `${priorExp} Yrs`;
    }

    return {
      totalExp: totalExpStr,
      companyTenure: tenure,
      roleExp,
      formattedExp: `${totalExpStr} (Company Tenure: ${tenure})`,
    };
  };

  const getEmployeeSalaryInfo = (emp) => {
    if (!emp) return { annualCtc: 0, monthlyGross: 0, formattedCtc: "N/A" };
    const salStruct = Array.isArray(emp.salaryStructures) ? emp.salaryStructures[0] : emp.salaryStructures;
    const payslip = Array.isArray(emp.payslips) ? emp.payslips[0] : emp.payslips;

    const gross = Number(salStruct?.grossSalary) || Number(payslip?.grossEarnings) || 0;
    const basic = Number(salStruct?.basicSalary) || Number(payslip?.basicSalary) || 0;
    const monthly = gross > 0 ? gross : basic;
    const annual = monthly > 0 ? monthly * 12 : (Number(emp.offerSalary) || Number(emp.salary) || Number(emp.ctc) || 0);
    return {
      annualCtc: annual,
      monthlyGross: monthly > 0 ? monthly : Math.round(annual / 12),
      formattedCtc: annual > 0 ? `₹${annual.toLocaleString("en-IN")}` : "N/A",
    };
  };

  // --- Validation Helpers ---
  const getCandidateCoolOffInfo = (cand) => {
    if (!cand || cand.status !== 'REJECTED') return { isCoolingOff: false };
    
    const candSchedules = schedules.filter(s => String(s.candidateId) === String(cand.id));
    let lastDate = cand.updatedAt ? new Date(cand.updatedAt) : new Date();
    if (candSchedules.length > 0) {
      const dates = candSchedules.map(s => new Date(s.scheduledAt).getTime());
      const maxDate = new Date(Math.max(...dates));
      if (maxDate > lastDate) lastDate = maxDate;
    }

    const coolOffDays = 30; // 30-day waiting period
    const eligibleDate = new Date(lastDate.getTime() + coolOffDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now < eligibleDate) {
      const diffMs = eligibleDate - now;
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        isCoolingOff: true,
        daysLeft,
        eligibleDateString: eligibleDate.toLocaleDateString(),
      };
    }
    
    return { isCoolingOff: false, eligibleDateString: eligibleDate.toLocaleDateString() };
  };

  const getReInterviewHistory = (cand) => {
    if (!cand) return { isReInterview: false };
    
    const candSchedules = schedules ? schedules.filter(s => String(s.candidateId) === String(cand.id)) : (cand.schedules || []);
    let hasPastRejection = cand.status === 'RE_INTERVIEW_ELIGIBLE';
    let rejectedComment = "";
    
    for (const s of candSchedules) {
      if (s.feedbacks && s.feedbacks.length > 0) {
        const rej = s.feedbacks.find(f => f.recommendation === 'REJECT');
        if (rej) {
          hasPastRejection = true;
          rejectedComment = rej.comments;
          break;
        }
      }
    }

    return {
      isReInterview: hasPastRejection,
      rejectedComment,
    };
  };

  const validateRequisition = () => {
    const errs = {};
    if (!newReq.title?.trim()) errs.title = "Job title is required.";
    else if (newReq.title.trim().length < 3) errs.title = "Job title must be at least 3 characters.";
    
    if (!newReq.departmentId) errs.departmentId = "Please select a department.";
    
    if (!newReq.headcount || Number(newReq.headcount) < 1) errs.headcount = "Headcount must be at least 1.";
    
    if (!newReq.jobSpecification?.trim()) errs.jobSpecification = "Job specification / requirements is required.";
    else if (newReq.jobSpecification.trim().length < 10) errs.jobSpecification = "Job specification must be at least 10 characters.";

    if (!newReq.justification?.trim()) errs.justification = "Justification / business reason is required.";
    else if (newReq.justification.trim().length < 10) errs.justification = "Justification must be at least 10 characters.";

    if (newReq.requisitionType === "REPLACEMENT" && !newReq.replacementForEmployeeId) {
      errs.replacementForEmployeeId = "Please select the employee who is being replaced.";
    }
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCandidate = () => {
    const errs = {};
    if (!newCand.name?.trim()) errs.name = "Candidate full name is required.";
    else if (newCand.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    else if (/\d/.test(newCand.name)) errs.name = "Numbers are not allowed in full name.";
    
    // Email format, Gmail rules & duplicate validation
    if (!newCand.email?.trim()) {
      errs.email = "Email address is required.";
    } else {
      const emailTrimmed = newCand.email.trim().toLowerCase();
      const emailRx = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
      if (!emailRx.test(emailTrimmed)) {
        if (emailTrimmed.includes("%")) {
          errs.email = "Special character '%' is not allowed in email.";
        } else {
          errs.email = "Please provide a valid email address.";
        }
      } else {
        const [username, domain] = emailTrimmed.split("@");
        if (domain === "gmail.com" || domain === "googlemail.com") {
          if (!/^[a-z0-9]+(\.[a-z0-9]+)*$/i.test(username)) {
            errs.email = "Sorry, only letters (a-z), numbers (0-9), and periods (.) are allowed.";
          }
        }
      }

      if (!errs.email) {
        const dupEmail = (candidates || []).find(
          (c) => String(c.id) !== String(newCand.id) && c.email && c.email.trim().toLowerCase() === emailTrimmed
        );
        if (dupEmail) {
          errs.email = "Candidate with this email already exists.";
        }
      }
    }
    
    // Phone format & duplicate validation
    if (!newCand.phone?.trim()) {
      errs.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(newCand.phone.trim())) {
      errs.phone = "Phone number must be exactly 10 digits.";
    } else {
      const phoneTrimmed = newCand.phone.trim();
      const dupPhone = (candidates || []).find(
        (c) => String(c.id) !== String(newCand.id) && c.phone && c.phone.trim() === phoneTrimmed
      );
      if (dupPhone) {
        errs.phone = "Candidate with this phone number already exists.";
      }
    }

    if (!newCand.requisitionId) errs.requisitionId = "Please select a Job Requisition.";
    if (!newCand.source) errs.source = "Please select a sourcing source.";
    if (!newCand.resumeUrl) errs.resumeUrl = "Resume / CV (PDF) is required.";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSchedule = () => {
    const errs = {};
    if (!newSched.candidateId) {
      errs.candidateId = "Please select a candidate.";
    } else {
      const cand = (dropdownCandidates.length > 0 ? dropdownCandidates : candidates).find(c => String(c.id) === String(newSched.candidateId));
      if (cand) {
        const coolOff = getCandidateCoolOffInfo(cand);
        if (coolOff.isCoolingOff) {
          errs.candidateId = `Candidate was rejected within 30-day waiting period. Re-interview allowed after ${coolOff.eligibleDateString} (${coolOff.daysLeft} days left).`;
        }
      }
    }

    if (!newSched.roundName?.trim()) {
      errs.roundName = "Interview round name is required.";
    } else if (newSched.roundName.trim() === "0" || /^0+$/.test(newSched.roundName.trim())) {
      errs.roundName = "Round name cannot be 0.";
    }
    if (!newSched.scheduledAt) {
      errs.scheduledAt = "Interview date and time is required.";
    } else if (new Date(newSched.scheduledAt) < new Date()) {
      errs.scheduledAt = "Interview date and time cannot be in the past.";
    } else if (newSched.candidateId) {
      const candSchedules = (schedules || []).filter(
        (s) => String(s.candidateId) === String(newSched.candidateId) && (!newSched.id || String(s.id) !== String(newSched.id))
      );
      if (candSchedules.length > 0) {
        const sortedSchedules = [...candSchedules].sort(
          (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        );
        const latestSched = sortedSchedules[0];
        if (!newSched.id && new Date(newSched.scheduledAt) <= new Date(latestSched.scheduledAt)) {
          errs.scheduledAt = `New round must be scheduled after previous round "${latestSched.roundName}" (${new Date(latestSched.scheduledAt).toLocaleString()}).`;
        }
      }
    }
    const panelistsList = parsePanelistList(newSched.panelists);
    if (panelistsList.length === 0) errs.panelists = "At least one panelist is required.";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateFeedback = () => {
    const errs = {};
    if (!newFeedback.scheduleId) {
      errs.scheduleId = "Please select an interview schedule.";
    } else {
      const selSched = schedules.find((s) => String(s.id) === String(newFeedback.scheduleId));
      if (selSched && selSched.scheduledAt) {
        if (new Date(selSched.scheduledAt) > new Date()) {
          errs.scheduleId = `Feedback cannot be submitted before the interview takes place (${new Date(selSched.scheduledAt).toLocaleString()}).`;
        }
      }
    }
    if (!newFeedback.panelistName?.trim()) errs.panelistName = "Panelist name is required.";
    if (newFeedback.rating === "" || newFeedback.rating === undefined || newFeedback.rating === null || Number(newFeedback.rating) < 1 || Number(newFeedback.rating) > 10) {
      errs.rating = "Rating must be between 1 and 10.";
    }
    if (!newFeedback.comments?.trim()) errs.comments = "Feedback comments are required.";
    else if (newFeedback.comments.trim().length < 10) errs.comments = "Comments must be at least 10 characters.";
    if (!newFeedback.recommendation) errs.recommendation = "Please select a recommendation.";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateOffer = () => {
    const errs = {};
    if (!newOffer.candidateId) errs.candidateId = "Please select a candidate.";
    if (!newOffer.role?.trim()) errs.role = "Offered role / designation is required.";
    if (!newOffer.salary || Number(newOffer.salary) < 1) errs.salary = "Annual CTC must be greater than 0.";
    if (!newOffer.joiningDate) errs.joiningDate = "Expected joining date is required.";
    else if (new Date(newOffer.joiningDate) < new Date(new Date().setHours(0,0,0,0))) {
      errs.joiningDate = "Joining date cannot be in the past.";
    }
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitRequisition = async (e) => {
    e.preventDefault();
    if (!validateRequisition()) return;
    try {
      if (newReq.id) {
        // Edit mode
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${newReq.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newReq.title,
            departmentId: newReq.departmentId,
            headcount: Number(newReq.headcount),
            experienceRequired: newReq.experienceRequired === "" || newReq.experienceRequired === null ? 0 : Number(newReq.experienceRequired),
            justification: newReq.justification,
            jobSpecification: newReq.jobSpecification,
            requisitionType: newReq.requisitionType || "NEW_REQUIREMENT",
            replacementForEmployeeId: newReq.requisitionType === "REPLACEMENT" ? newReq.replacementForEmployeeId : null,
            isCnvApplicable: Boolean(newReq.isCnvApplicable),
            cnvExchangeOffice: newReq.isCnvApplicable ? (newReq.cnvExchangeOffice || "") : null,
            cnvRefNumber: newReq.isCnvApplicable ? (newReq.cnvRefNumber || "") : null,
            cnvNotificationDate: newReq.isCnvApplicable && newReq.cnvNotificationDate ? newReq.cnvNotificationDate : null,
            cnvStatus: newReq.isCnvApplicable ? (newReq.cnvStatus || "PENDING_NOTIFICATION") : "NOT_REQUIRED",
            cnvExemptionReason: !newReq.isCnvApplicable ? (newReq.cnvExemptionReason || "") : null,
          })
        });
        if (res.ok) {
          dispatch(fetchRequisitions({ page: reqPage, limit: reqRows, search: reqSearch, sortBy: reqSortBy, sortOrder: reqSortOrder }));
          setNewReq({ title: "", departmentId: "", headcount: 1, experienceRequired: "", justification: "", jobSpecification: "", requisitionType: "NEW_REQUIREMENT", replacementForEmployeeId: "", raisedBy: "", isCnvApplicable: false, cnvExchangeOffice: "", cnvRefNumber: "", cnvNotificationDate: "", cnvStatus: "NOT_REQUIRED", cnvExemptionReason: "" });
          toast.success("Requisition updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update requisition");
          toast.error(msg);
        }
      } else {
        // Create mode
        await dispatch(createRequisition({
          ...newReq,
          headcount: Number(newReq.headcount),
          experienceRequired: newReq.experienceRequired === "" || newReq.experienceRequired === null ? 0 : Number(newReq.experienceRequired),
          raisedBy: newReq.raisedBy?.trim() || "HR Manager",
          jobSpecification: newReq.jobSpecification?.trim() || "",
          requisitionType: newReq.requisitionType || "NEW_REQUIREMENT",
          replacementForEmployeeId: newReq.requisitionType === "REPLACEMENT" ? newReq.replacementForEmployeeId : null,
          isCnvApplicable: Boolean(newReq.isCnvApplicable),
          cnvExchangeOffice: newReq.isCnvApplicable ? (newReq.cnvExchangeOffice || "") : null,
          cnvRefNumber: newReq.isCnvApplicable ? (newReq.cnvRefNumber || "") : null,
          cnvNotificationDate: newReq.isCnvApplicable && newReq.cnvNotificationDate ? newReq.cnvNotificationDate : null,
          cnvStatus: newReq.isCnvApplicable ? (newReq.cnvStatus || "PENDING_NOTIFICATION") : "NOT_REQUIRED",
          cnvExemptionReason: !newReq.isCnvApplicable ? (newReq.cnvExemptionReason || "") : null,
        })).unwrap();
        dispatch(fetchRequisitions({ page: reqPage, limit: reqRows, search: reqSearch, sortBy: reqSortBy, sortOrder: reqSortOrder }));
        setNewReq({ title: "", departmentId: "", headcount: 1, experienceRequired: "", justification: "", jobSpecification: "", requisitionType: "NEW_REQUIREMENT", replacementForEmployeeId: "", raisedBy: "", isCnvApplicable: false, cnvExchangeOffice: "", cnvRefNumber: "", cnvNotificationDate: "", cnvStatus: "NOT_REQUIRED", cnvExemptionReason: "" });
        toast.success("Requisition created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newReq.id ? "Failed to update requisition" : "Failed to create requisition"));
    }
  };

  const handleDeleteRequisition = async (reqId) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${reqId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (newReq.id === reqId) {
          setNewReq({ title: "", departmentId: "", headcount: 1, justification: "", jobSpecification: "", requisitionType: "NEW_REQUIREMENT", replacementForEmployeeId: "", raisedBy: "", isCnvApplicable: false, cnvExchangeOffice: "", cnvRefNumber: "", cnvNotificationDate: "", cnvStatus: "NOT_REQUIRED", cnvExemptionReason: "" });
          setFormErrors({});
        }
        dispatch(fetchRequisitions({ page: reqPage, limit: reqRows, search: reqSearch, sortBy: reqSortBy, sortOrder: reqSortOrder }));
        toast.success("Requisition deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete requisition");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate PDF only
    if (file.type !== "application/pdf") {
      setFormErrors((prev) => ({ ...prev, resumeUrl: "Only PDF files are allowed." }));
      e.target.value = "";
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setFormErrors((prev) => ({ ...prev, resumeUrl: "File size must be less than 2 MB." }));
      e.target.value = "";
      return;
    }

    setFormErrors((prev) => ({ ...prev, resumeUrl: null }));
    const formData = new FormData();
    formData.append("file", file);
    setUploadingFile(true);
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/candidates/upload-resume`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setNewCand({ ...newCand, resumeUrl: data.url });
        if (formErrors.resumeUrl) setFormErrors({ ...formErrors, resumeUrl: null });
      } else {
        setFormErrors((prev) => ({ ...prev, resumeUrl: "Upload failed. Please try again." }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setFormErrors((prev) => ({ ...prev, resumeUrl: "Upload error. Please try again." }));
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitCandidate = async (e) => {
    e.preventDefault();
    if (!validateCandidate()) return;
    try {
      if (newCand.id) {
        // Edit mode
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/candidates/${newCand.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCand.name.trim(),
            email: newCand.email.toLowerCase().trim(),
            phone: newCand.phone.trim(),
            source: newCand.source,
            requisitionId: newCand.requisitionId,
            experienceYears: newCand.experienceYears === "" || newCand.experienceYears === null ? 0 : Number(newCand.experienceYears),
            resumeUrl: newCand.resumeUrl || undefined,
          })
        });
        if (res.ok) {
          dispatch(fetchCandidates({
            page: candPage,
            limit: candRows,
            search: candSearch,
            sortBy: candSortBy,
            sortOrder: candSortOrder,
            status: candStatusFilter === "ALL" ? undefined : candStatusFilter,
          }));
          setNewCand({ name: "", email: "", phone: "", source: "", requisitionId: "", experienceYears: "", resumeUrl: "" });
          setFormErrors({});
          toast.success("Candidate updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update candidate");
          if (msg.toLowerCase().includes("email")) {
            setFormErrors(prev => ({ ...prev, email: msg }));
          }
          if (msg.toLowerCase().includes("phone")) {
            setFormErrors(prev => ({ ...prev, phone: msg }));
          }
          toast.error(msg);
        }
      } else {
        // Create mode
        await dispatch(createCandidate({
          ...newCand,
          name: newCand.name.trim(),
          email: newCand.email.toLowerCase().trim(),
          phone: newCand.phone.trim(),
          experienceYears: newCand.experienceYears === "" || newCand.experienceYears === null ? 0 : Number(newCand.experienceYears),
          source: newCand.source || "Portal",
        })).unwrap();
        setCandPage(1);
        dispatch(fetchCandidates({
          page: 1,
          limit: candRows,
          search: candSearch,
          sortBy: candSortBy,
          sortOrder: candSortOrder,
          status: candStatusFilter === "ALL" ? undefined : candStatusFilter,
        }));
        setNewCand({ name: "", email: "", phone: "", source: "", requisitionId: "", experienceYears: "", resumeUrl: "" });
        setFormErrors({});
        const fileInput = document.getElementById("resume-upload-input");
        if (fileInput) fileInput.value = "";
        toast.success("Candidate added successfully");
      }
    } catch (err) {
      console.error(err);
      const errMsg = typeof err === "string" ? err : err?.message || (newCand.id ? "Failed to update candidate" : "Failed to add candidate");
      if (errMsg.toLowerCase().includes("email")) {
        setFormErrors(prev => ({ ...prev, email: errMsg }));
      }
      if (errMsg.toLowerCase().includes("phone")) {
        setFormErrors(prev => ({ ...prev, phone: errMsg }));
      }
      toast.error(errMsg);
    }
  };

  const handleDeleteCandidate = async (candId) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/candidates/${candId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (newCand.id === candId) {
          setNewCand({ name: "", email: "", phone: "", requisitionId: "", resumeUrl: "", experienceYears: "", skills: "" });
          setFormErrors({});
        }
        dispatch(fetchCandidates({
          page: candPage,
          limit: candRows,
          search: candSearch,
          sortBy: candSortBy,
          sortOrder: candSortOrder,
          status: candStatusFilter === "ALL" ? undefined : candStatusFilter,
        }));
        toast.success("Candidate deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete candidate");
    }
  };

  const handleUpdateRequisition = async (e) => {
    // Deprecated, handled by handleSubmitRequisition
  };

  const handleUpdateCandidateInfo = async (e) => {
    // Deprecated, handled by handleSubmitCandidate
  };

  const handleUpdateCandidateStatus = async (id, status) => {
    try {
      await dispatch(updateCandidateStatus({ id, status })).unwrap();
      dispatch(fetchCandidates({
        page: candPage,
        limit: candRows,
        search: candSearch,
        sortBy: candSortBy,
        sortOrder: candSortOrder,
        status: candStatusFilter === "ALL" ? undefined : candStatusFilter,
      }));
      toast.success("Candidate status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    if (!validateSchedule()) return;
    try {
      const panelistsList = parsePanelistList(newSched.panelists);
      if (newSched.id) {
        // Edit mode
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/schedules/${newSched.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: newSched.candidateId,
            roundName: newSched.roundName,
            scheduledAt: newSched.scheduledAt,
            panelists: panelistsList
          })
        });
        if (res.ok) {
          dispatch(fetchSchedules());
          setNewSched({ candidateId: "", roundName: "", scheduledAt: "", panelists: [] });
          toast.success("Schedule updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update schedule");
          toast.error(msg);
        }
      } else {
        // Create mode
        await dispatch(createSchedule({
          ...newSched,
          panelists: panelistsList,
          roundName: newSched.roundName?.trim() || "Technical Round",
        })).unwrap();
        // Automatically update candidate status to INTERVIEWING if active
        try {
          await dispatch(updateCandidateStatus({ id: newSched.candidateId, status: "INTERVIEWING" })).unwrap();
        } catch (err) {
          console.error("Could not update candidate status:", err);
        }
        dispatch(fetchCandidates());
        dispatch(fetchSchedules());
        setNewSched({ candidateId: "", roundName: "", scheduledAt: "", panelists: [] });
        toast.success("Schedule created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newSched.id ? "Failed to update schedule" : "Failed to create schedule"));
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/schedules/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (newSched.id === id) {
          setNewSched({ candidateId: "", interviewer: "", scheduledAt: "", location: "" });
          setFormErrors({});
        }
        dispatch(fetchSchedules());
        toast.success("Schedule deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete schedule");
    }
  };

  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    if (!validateFeedback()) return;
    try {
      if (newFeedback.id) {
        // Edit mode
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/feedbacks/${newFeedback.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleId: newFeedback.scheduleId,
            panelistName: newFeedback.panelistName,
            panelistId: newFeedback.panelistId || null,
            rating: Number(newFeedback.rating),
            comments: newFeedback.comments,
            recommendation: newFeedback.recommendation,
          }),
        });
        if (res.ok) {
          setNewFeedback({ id: "", scheduleId: "", panelistId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
          setFormErrors({});
          dispatch(fetchSchedules());
          dispatch(fetchCandidates());
          toast.success("Feedback updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update feedback");
          toast.error(msg);
        }
      } else {
        // Create mode
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/feedbacks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newFeedback,
            rating: Number(newFeedback.rating),
          }),
        });
        if (res.ok) {
          setNewFeedback({ id: "", scheduleId: "", panelistId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
          setFormErrors({});
          dispatch(fetchSchedules());
          dispatch(fetchCandidates());
          toast.success("Feedback submitted successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to submit feedback");
          toast.error(msg);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(newFeedback.id ? "Failed to update feedback" : "Failed to submit feedback");
    }
  };

  const handleDeleteFeedback = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/feedbacks/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (newFeedback.id === id) {
          setNewFeedback({ id: "", scheduleId: "", panelistId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
          setFormErrors({});
        }
        dispatch(fetchSchedules({
          page: schedPage,
          limit: schedRows,
          search: schedSearch,
          sortBy: schedSortBy,
          sortOrder: schedSortOrder,
          status: schedStatusFilter === "ALL" ? undefined : schedStatusFilter,
          date: schedDateFilter || undefined,
        }));
        dispatch(fetchCandidates());
        toast.success("Feedback deleted successfully");
      } else {
        const msg = await getErrorMessage(res, "Failed to delete feedback");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete feedback");
    }
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!validateOffer()) return;
    try {
      if (newOffer.id) {
        // Edit mode
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/offers/${newOffer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: newOffer.candidateId,
            role: newOffer.role,
            salary: newOffer.salary,
            joiningDate: newOffer.joiningDate
          })
        });
        if (res.ok) {
          dispatch(fetchOffers());
          setNewOffer({ candidateId: "", role: "", salary: "", joiningDate: "" });
          toast.success("Offer updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update offer");
          toast.error(msg);
        }
      } else {
        // Create mode
        await dispatch(createOffer(newOffer)).unwrap();
        setNewOffer({ candidateId: "", role: "", salary: "", joiningDate: "" });
        toast.success("Offer created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newOffer.id ? "Failed to update offer" : "Failed to create offer"));
    }
  };

  const handleDeleteOffer = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/offers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (newOffer.id === id) {
          setNewOffer({ candidateId: "", ctc: "", joiningDate: "", expiryDate: "" });
          setFormErrors({});
        }
        dispatch(fetchOffers());
        toast.success("Offer deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete offer");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "requisition") {
        await handleDeleteRequisition(deleteTarget.id);
      } else if (deleteTarget.type === "candidate") {
        await handleDeleteCandidate(deleteTarget.id);
      } else if (deleteTarget.type === "schedule") {
        await handleDeleteSchedule(deleteTarget.id);
      } else if (deleteTarget.type === "offer") {
        await handleDeleteOffer(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleAcceptOffer = async (id) => {
    try {
      await dispatch(updateOfferStatus({ id, status: 'ACCEPTED' })).unwrap();
      toast.success("Offer accepted");
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to accept offer");
    }
  };

  // ---------------------------------------------------------------------------
  // CNV Compliance Modal Handlers
  // ---------------------------------------------------------------------------

  const openCnvModal = async (row) => {
    setCnvModal(row);
    setCnvSection("overview");
    setCnvFormErrors({});
    setCnvSubmitForm({ employmentExchangeOffice: "", notificationDate: "", submissionMode: "", referenceNumber: "", cnvRemarks: "", submittedBy: "" });
    setCnvAckForm({ acknowledgementNumber: "", acknowledgementDate: "", cnvRemarks: "", acknowledgedBy: "" });
    setCnvSubmitFile(null);
    setCnvAckFile(null);
    setCnvData(null);
    setCnvLoading(true);
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${row.id}/cnv`);
      if (res.ok) {
        const data = await res.json();
        setCnvData(data?.cnvRecord || null);
        // Pre-fill submit form with existing exchange office if known
        if (data?.cnvRecord?.employmentExchangeOffice) {
          setCnvSubmitForm(prev => ({ ...prev, employmentExchangeOffice: data.cnvRecord.employmentExchangeOffice }));
        } else if (row.cnvExchangeOffice) {
          setCnvSubmitForm(prev => ({ ...prev, employmentExchangeOffice: row.cnvExchangeOffice }));
        }
      }
    } catch (err) {
      console.error("Failed to load CNV details:", err);
    } finally {
      setCnvLoading(false);
    }
  };

  const closeCnvModal = () => {
    setCnvModal(null);
    setCnvData(null);
    setCnvLoading(false);
    setCnvSection("overview");
    setCnvFormErrors({});
  };

  const generateCnvNotificationHandler = async () => {
    if (!cnvModal) return;
    setCnvSubmitting(true);
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${cnvModal.id}/cnv/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performedBy: "HR Manager" }),
      });
      if (res.ok) {
        const genData = await res.json();
        // Refresh CNV data
        const detailRes = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${cnvModal.id}/cnv`);
        if (detailRes.ok) {
          const data = await detailRes.json();
          setCnvData(data?.cnvRecord || null);
        }
        window.open(`/dashboard/recruitment/cnv-print/${cnvModal.id}`, "_blank");
        toast.success("CNV Notification generated successfully.");
      } else {
        const msg = await getErrorMessage(res, "Failed to generate CNV notification");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate CNV notification");
    } finally {
      setCnvSubmitting(false);
    }
  };

  const printCnvNotification = (req) => {
    if (!req) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print/download CNV Notification");
      return;
    }
    const now = new Date();
    const fmtDate = (d) => {
      const dt = d ? new Date(d) : now;
      return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt.getFullYear()}`;
    };
    const refNo = `REF/CNV/${now.getFullYear()}/${String(req.id || "1").slice(-4).padStart(4, "0")}`;
    const exchangeOffice = req.cnvExchangeOffice || req.cnvRecord?.employmentExchangeOffice || "District Employment Exchange";

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>CNV Notification - ${req.title}</title>
  <meta charset="utf-8" />
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    }
    .page-wrapper {
      width: 100%;
      min-height: 96vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      box-sizing: border-box;
      border: 1.5px solid #0f3d70;
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0f3d70 0%, #1e5ba3 100%);
      color: #ffffff;
      padding: 22px 30px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3.5px solid #f59e0b;
    }
    .header-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #ffffff;
    }
    .header-sub {
      font-size: 10px;
      color: #cbd5e1;
      margin-top: 4px;
      line-height: 1.4;
    }
    .header-right {
      font-size: 10.5px;
      text-align: right;
      line-height: 1.6;
      color: #e2e8f0;
    }
    .dept-badge {
      font-weight: 800;
      color: #f59e0b;
      letter-spacing: 0.5px;
      font-size: 11px;
    }
    .body {
      padding: 24px 30px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .ref-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      font-weight: 700;
      color: #334155;
      border-bottom: 1.5px dashed #cbd5e1;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .to-block {
      font-size: 12.5px;
      color: #1e293b;
      line-height: 1.6;
      margin-bottom: 14px;
    }
    .subject {
      font-size: 14px;
      font-weight: 900;
      text-align: center;
      margin: 10px 0 14px;
      color: #0f3d70;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 8px 14px;
      background: #eff6ff;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }
    .legal-clause {
      font-size: 12px;
      line-height: 1.7;
      background: #f8fafc;
      border-left: 4px solid #0f3d70;
      padding: 10px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin: 10px 0 16px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      background: #0f3d70;
      color: #ffffff;
      padding: 10px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }
    td {
      padding: 9px 14px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .td-label {
      font-weight: 700;
      color: #475569;
      width: 38%;
      background: #f1f5f9;
      border-right: 1px solid #e2e8f0;
    }
    .closing-text {
      font-size: 12px;
      line-height: 1.7;
      color: #334155;
      margin: 10px 0 18px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .seal-row {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 14px 0 6px;
      border-top: 1px solid #e2e8f0;
    }
    .seal-block {
      text-align: center;
    }
    .seal-line {
      border-top: 1.5px solid #64748b;
      width: 180px;
      margin: 0 auto 6px;
    }
    .signatory-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f3d70;
    }
    .signatory-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .seal-circle {
      height: 75px;
      width: 110px;
      border: 1.5px dashed #94a3b8;
      border-radius: 50%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      background: #0f3d70;
      color: #ffffff;
      padding: 10px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      letter-spacing: 0.3px;
      border-top: 2.5px solid #f59e0b;
    }
    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      body {
        margin: 0;
        padding: 0;
        background: #fff;
      }
      .page-wrapper {
        min-height: 98vh;
        height: auto;
        border: 1.5px solid #0f3d70 !important;
        page-break-after: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
<div class="page-wrapper">
  <div class="header">
    <div>
      <div class="header-title">ASPINO SPECIALTY CHEMICALS PVT. LTD.</div>
      <div class="header-sub">CIN: U20297GJ2024PTC150782 &nbsp;|&nbsp; SRN-271, BLK-314, Nakoda Road, Ta-Mangrol, Hathuran, Surat - 394125</div>
    </div>
    <div class="header-right">
      <div class="dept-badge">HUMAN RESOURCES DEPARTMENT</div>
      <div>info@aspinochemicals.com</div>
      <div>+91 98259 57173</div>
    </div>
  </div>

  <div class="body">
    <div>
      <div class="ref-row">
        <div><strong>Ref. No.:</strong> ${refNo}</div>
        <div><strong>Date:</strong> ${fmtDate(now)}</div>
      </div>
      <div class="to-block">
        <strong>To,</strong><br/>
        The Employment Officer / Competent Authority,<br/>
        <strong>${exchangeOffice}</strong>
      </div>
      <div class="subject">Statutory Notification of Vacancy (Act, 1959)</div>
      <div class="legal-clause">
        This notification is issued in strict compliance with the statutory provisions of the <strong>Employment Exchanges (Compulsory Notification of Vacancies) Act, 1959</strong> and relevant state rules. The vacancy particulars are submitted below for registration and referral.
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 38%;">Compliance Field</th>
            <th>Particulars / Details</th>
          </tr>
        </thead>
        <tbody>
          <tr><td class="td-label">Name of Employer / Organization</td><td><strong>Aspino Specialty Chemicals Pvt. Ltd.</strong></td></tr>
          <tr><td class="td-label">Vacancy / Job Title</td><td><strong style="color: #0f3d70; font-size: 13px;">${req.title || "—"}</strong></td></tr>
          <tr><td class="td-label">Department / Unit</td><td>${req.department?.name || "—"}</td></tr>
          <tr><td class="td-label">Number of Vacancies (Headcount)</td><td><strong>${req.headcount || 1} Position(s)</strong></td></tr>
          <tr><td class="td-label">Minimum Experience Required</td><td>${req.experienceRequired ? `${req.experienceRequired} Year(s)` : "Freshers / Entry Level eligible"}</td></tr>
          <tr><td class="td-label">Nature of Employment</td><td>Full-Time / Regular & Permanent</td></tr>
          <tr><td class="td-label">Type of Vacancy</td><td>${req.requisitionType === "REPLACEMENT" ? "Replacement Requirement" : "New Requirement / Expansion"}</td></tr>
          <tr><td class="td-label">Job Specification / Requirements</td><td>${req.jobSpecification || "As per organizational standard specification"}</td></tr>
          <tr><td class="td-label">Statutory Reference Number</td><td><span style="font-family: monospace; font-weight: 700;">${refNo}</span></td></tr>
          <tr><td class="td-label">Official Notification Date</td><td>${fmtDate(now)}</td></tr>
        </tbody>
      </table>
      <div class="closing-text">
        We request your office to kindly register this notification on record and sponsor / refer eligible candidates conforming to the above specifications. Aspino Specialty Chemicals Pvt. Ltd. practices equal employment opportunity across all categories including persons with benchmark disabilities.
      </div>
    </div>

    <div class="seal-row">
      <div class="seal-block" style="text-align: left;">
        <div style="height: 50px;"></div>
        <div class="seal-line" style="margin-left: 0;"></div>
        <div class="signatory-title">Authorized Signatory</div>
        <div class="signatory-sub">Aspino Specialty Chemicals Pvt. Ltd.</div>
      </div>
      <div class="seal-block">
        <div class="seal-circle">Official<br/>Company Seal</div>
      </div>
      <div class="seal-block" style="text-align: right;">
        <div style="height: 50px;"></div>
        <div class="seal-line" style="margin-right: 0;"></div>
        <div class="signatory-title">Employment Exchange Receipt</div>
        <div class="signatory-sub">Receiving Officer Signature & Seal</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>Ref: ${refNo} &nbsp;|&nbsp; Generated on ${fmtDate(now)}</div>
    <div>System Generated Statutory Record &nbsp;|&nbsp; Aspino HRMS Portal</div>
  </div>
</div>
<script>
  window.onload = function() {
    window.focus();
    window.print();
  };
</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const handleCnvSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!cnvSubmitForm.employmentExchangeOffice?.trim()) errs.employmentExchangeOffice = "Employment Exchange / Authority name is required.";
    if (!cnvSubmitForm.notificationDate) errs.notificationDate = "Notification date is required.";
    if (!cnvSubmitForm.submissionMode) errs.submissionMode = "Please select a submission mode.";
    if (Object.keys(errs).length > 0) { setCnvFormErrors(errs); return; }
    setCnvFormErrors({});
    setCnvSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(cnvSubmitForm).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (cnvSubmitFile) formData.append("document", cnvSubmitFile);
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${cnvModal.id}/cnv/submit`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setCnvData(data);
        setCnvSection("overview");
        dispatch(fetchRequisitions({ page: reqPage, limit: reqRows, search: reqSearch, sortBy: reqSortBy, sortOrder: reqSortOrder }));
        toast.success("CNV Submission recorded. Status updated to Notified.");
      } else {
        const msg = await getErrorMessage(res, "Failed to record CNV submission");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to record CNV submission");
    } finally {
      setCnvSubmitting(false);
    }
  };

  const handleCnvAcknowledge = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!cnvAckForm.acknowledgementNumber?.trim()) errs.acknowledgementNumber = "Acknowledgement number is required.";
    if (!cnvAckForm.acknowledgementDate) errs.acknowledgementDate = "Acknowledgement date is required.";
    if (Object.keys(errs).length > 0) { setCnvFormErrors(errs); return; }
    setCnvFormErrors({});
    setCnvSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(cnvAckForm).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (cnvAckFile) formData.append("document", cnvAckFile);
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${cnvModal.id}/cnv/acknowledge`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setCnvData(data);
        setCnvSection("overview");
        dispatch(fetchRequisitions({ page: reqPage, limit: reqRows, search: reqSearch, sortBy: reqSortBy, sortOrder: reqSortOrder }));
        toast.success("CNV Acknowledgement recorded. Status updated to Acknowledged.");
      } else {
        const msg = await getErrorMessage(res, "Failed to record CNV acknowledgement");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to record CNV acknowledgement");
    } finally {
      setCnvSubmitting(false);
    }
  };

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatOfferDate = (dateString) => {
    const d = dateString ? new Date(dateString) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleDateString("en-GB");
    return `${getOrdinal(d.getDate())} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
  };

  const formatJoiningDateFull = (dateString) => {
    const d = dateString ? new Date(dateString) : new Date();
    if (isNaN(d.getTime())) return "the date of joining";
    return `${getOrdinal(d.getDate())} ${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
  };

  const handlePrintOfferLetter = (offer) => {
    if (!offer) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to print/download offer letter");
      return;
    }
    const candidateName = offer.candidate?.name || "Ravi Babariya";
    const role = offer.role || "PACKING SUPERVISOR";
    const dateFormatted = formatOfferDate(offer.createdAt || new Date());
    const joiningDateFormatted = formatJoiningDateFull(offer.joiningDate || new Date());
    const year = new Date().getFullYear();
    const seq = String(offer.id || "1").slice(-3).padStart(3, "0");
    const refNo = `Ref.ASCPL/OL-${year}-${seq}`;

    const candidateAddress = offer.candidate?.address || "Dadri, Kosamba Tarsadi";
    const candidateCity = offer.candidate?.city || "Surat";
    const candidateState = offer.candidate?.state || "Gujarat- 394 120";

    const salaryClause = offer.salary
      ? `Your annual salary package shall be mutually agreed at Rs. ${Number(offer.salary).toLocaleString('en-IN')}/- per annum at the time of an Interview.`
      : `Your annual salary package shall be mutually agreed at the time of an Interview.`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offer Letter - ${candidateName}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: #ffffff;
              color: #1e293b;
              font-family: Arial, Helvetica, sans-serif;
            }
            .a4-container {
              position: relative;
              width: 100%;
              min-height: 100vh;
              margin: 0 auto;
              padding: 0;
              background: #ffffff;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
              }
              .a4-container {
                width: 210mm;
                height: 297mm;
                max-height: 297mm;
                page-break-after: avoid;
                page-break-inside: avoid;
              }
            }
            .watermark {
              position: absolute;
              top: 52%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 440px;
              opacity: 0.05;
              pointer-events: none;
              z-index: 0;
            }
            /* Header */
            .header-wrap {
              position: relative;
              width: 100%;
              z-index: 1;
            }
            .top-shapes {
              position: relative;
              width: 100%;
              height: 44px;
            }
            .top-left-tab {
              position: absolute;
              top: 0;
              left: 0;
              width: 260px;
              height: 34px;
              background: #2073bd;
              border-bottom-right-radius: 34px;
            }
            .top-right-ribbon {
              position: absolute;
              top: 0;
              right: 0;
              width: 155px;
              height: 145px;
            }
            .header-content {
              padding: 0 54px;
              margin-top: 0px;
            }
            .logo-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding-bottom: 22px;
            }
            .logo-img {
              width: 160px;
              height: auto;
              display: block;
            }
            .cin-text {
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              letter-spacing: 0.3px;
              margin-bottom: 4px;
            }
            /* Body */
            .letter-content {
              position: relative;
              z-index: 1;
              padding: 0 54px;
              flex-grow: 1;
            }
            .recipient-block {
              font-size: 13px;
              line-height: 1.45;
              color: #1e293b;
              margin-bottom: 20px;
            }
            .recipient-block .ref {
              font-weight: 500;
            }
            .recipient-block .date {
              margin-bottom: 5px;
            }
            .recipient-block .name {
              font-weight: 500;
            }
            .doc-title {
              text-align: center;
              font-size: 16px;
              font-weight: 900;
              text-decoration: underline;
              letter-spacing: 0.6px;
              margin: 18px 0 16px 0;
              color: #162a55;
            }
            .intro-text {
              text-align: justify;
              font-size: 12.5px;
              font-weight: 700;
              line-height: 1.55;
              margin-bottom: 14px;
              color: #162a55;
            }
            .terms-list {
              margin: 0 0 14px 0;
              padding: 0;
              list-style: none;
            }
            .terms-list li {
              margin-bottom: 8px;
              font-size: 12px;
              line-height: 1.55;
              text-align: justify;
              color: #1e293b;
            }
            .checklist-heading {
              font-weight: 700;
              font-size: 12.5px;
              margin: 16px 0 8px 0;
              color: #162a55;
            }
            .checklist-list {
              margin: 0 0 14px 0;
              padding: 0;
              list-style: none;
            }
            .checklist-list li {
              margin-bottom: 4px;
              font-size: 11.5px;
              line-height: 1.5;
              position: relative;
              padding-left: 14px;
              color: #334155;
            }
            .checklist-list li::before {
              content: "-";
              position: absolute;
              left: 0;
              font-weight: bold;
            }
            .closing-text {
              font-size: 12px;
              line-height: 1.55;
              margin: 16px 0 14px 0;
              color: #1e293b;
            }
            .signoff-block {
              margin-top: 14px;
              font-size: 12.5px;
              line-height: 1.45;
            }
            .signoff-thanks {
              font-weight: 700;
              color: #162a55;
              margin-bottom: 8px;
            }
            .signoff-company {
              font-weight: 700;
              color: #162a55;
              margin-bottom: 24px;
            }
            /* Footer */
            .footer-wrap {
              position: relative;
              z-index: 1;
              width: 100%;
            }
            .office-text {
              padding: 0 54px 10px 54px;
              font-size: 10.5px;
              font-weight: 700;
              color: #1e293b;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
            }
            .navy-bar {
              background: #173660;
              color: #ffffff;
              padding: 12px 54px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10.5px;
              font-weight: 500;
              letter-spacing: 0.2px;
            }
          </style>
        </head>
        <body>
          <div class="a4-container">
            <img src="/aspino-logo.png" class="watermark" alt="Watermark" />

            <div>
              <div class="header-wrap">
                <div class="top-shapes">
                  <div class="top-left-tab"></div>
                  <svg class="top-right-ribbon" viewBox="0 0 120 115" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M120 0C100 35 60 25 40 50C25 68 35 90 60 115C75 98 70 78 85 62C105 40 115 20 120 0Z" fill="#38bdf8" fill-opacity="0.85"/>
                    <path d="M120 10C105 45 70 38 50 62C35 80 45 98 70 115C60 98 55 82 70 70C90 50 110 32 120 10Z" fill="#1b75bb"/>
                    <path d="M120 22C110 50 78 48 62 70C48 88 58 102 78 115C68 100 64 86 78 76C96 60 112 40 120 22Z" fill="#173660"/>
                  </svg>
                </div>
                <div class="header-content">
                  <div class="logo-row">
                    <img src="/aspino-logo.png" class="logo-img" alt="Aspino Speciality Chemicals Private Limited" />
                    <div class="cin-text">CIN: U20297GJ2024PTC150782</div>
                  </div>
                </div>
              </div>

              <div class="letter-content">
                <div class="recipient-block">
                  <div class="ref">${refNo}</div>
                  <div class="date">Dt. ${dateFormatted}</div>
                  <div class="name">Mr./ Miss ${candidateName},</div>
                  <div>${candidateAddress}</div>
                  <div>${candidateCity}</div>
                  <div>${candidateState}</div>
                </div>

                <div class="doc-title">OFFER LETTER</div>

                <p class="intro-text">
                  This has reference to your application and the subsequent interview you had with us, we are pleased to confirm our decision wherein we have mutually agreed upon the following:
                </p>

                <ul class="terms-list">
                  <li><strong>1.</strong> You shall be designated as &quot;<strong>${role.toUpperCase()}</strong>&quot;.</li>
                  <li><strong>2.</strong> ${salaryClause}</li>
                  <li><strong>3.</strong> Acceptance of the offer would automatically bind you to agree with all the terms and conditions of the employment as discussed during the interview.</li>
                  <li><strong>4.</strong> You will come to finish all formalities and collect appointment letter on or before <strong>${joiningDateFormatted}</strong></li>
                </ul>

                <div class="checklist-heading">Kindly bring the following documents on the date of joining:</div>
                <ul class="checklist-list">
                  <li>Copies of all education certificates for the purpose of admitting the date of birth and all mark sheets of all academic qualifications and achievements.</li>
                  <li>Copy Experience Certificates</li>
                  <li>Proof of past employments.</li>
                  <li>Relieving letter from your current employer</li>
                  <li>Photocopy of last salary slip.</li>
                  <li>Four copies of passport size photographs</li>
                  <li>Photocopy of driving license and your blood group details</li>
                  <li>Two References.</li>
                </ul>

                <p class="closing-text">
                  With best wishes for an enjoyable, exciting and prosperous career association with Aspino Specialty Chemicals Private Limited.
                </p>

                <div class="signoff-block">
                  <div class="signoff-thanks">Thankfully yours,</div>
                  <div class="signoff-company">For Aspino Speciality Chemicals Pvt.Ltd.</div>
                </div>
              </div>
            </div>

            <div class="footer-wrap">
              <div class="office-text">
                <span>Registered office</span>
                <span>📍</span>
                <span>SRN-271,BLK-314, Nakoda Road, Ta-Mangrol, Hathuran, Surat, 394125, Gujarat - India.</span>
              </div>
              <div class="navy-bar">
                <span>📞 +91 98259 57173</span>
                <span>✉ info@aspinochemicals.com</span>
                <span>🌐 www.aspinochemicals.com</span>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadOfferPdf = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/offers/${id}/pdf?t=${Date.now()}`);
      if (!res.ok) {
        const msg = await getErrorMessage(res, "Failed to download offer letter PDF");
        toast.error(msg);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offer-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Offer letter PDF downloaded");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Error downloading PDF: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto">
        {[
          { id: "requisitions", label: "Job Requisitions", icon: Briefcase },
          { id: "candidates", label: "Candidates & Sourcing", icon: UserCheck },
          { id: "interviews", label: "Interview Scheduling", icon: Calendar },
          { id: "offers", label: "Offer Letters", icon: FileText },
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

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: REQUISITIONS */}
          {activeTab === "requisitions" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-500" />
                  {newReq.id ? "Edit Requisition" : "Raise Requisition"}
                </h3>
                <form onSubmit={handleSubmitRequisition} className="space-y-3" noValidate>
                  {/* Requirement Type Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Requirement Type</Label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setNewReq({ ...newReq, requisitionType: "NEW_REQUIREMENT", replacementForEmployeeId: "" });
                          if (formErrors.replacementForEmployeeId) setFormErrors({ ...formErrors, replacementForEmployeeId: null });
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          newReq.requisitionType !== "REPLACEMENT"
                            ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        New Requirement
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewReq({ ...newReq, requisitionType: "REPLACEMENT" });
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          newReq.requisitionType === "REPLACEMENT"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Replacement
                      </button>
                    </div>
                  </div>

                  {/* If Replacement selected, show Employee dropdown */}
                  {newReq.requisitionType === "REPLACEMENT" && (
                    <div className="space-y-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          Employee Being Replaced (Resigned / Terminated) <span className="text-rose-500">*</span>
                        </Label>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                          Auto-fills Role & Dept
                        </span>
                      </div>
                      <SearchableSelect
                        options={dropdownEmployees.map((emp) => {
                          const exitType = emp.exitProcess?.type;
                          const exitTag = exitType === 'RESIGNATION'
                            ? 'Resigned'
                            : exitType === 'TERMINATION'
                              ? 'Terminated'
                              : emp.status === 'EXITING'
                                ? 'Exiting'
                                : emp.status === 'RELIEVED'
                                  ? 'Relieved'
                                  : 'Resigned';
                          const sal = getEmployeeSalaryInfo(emp);
                          const expDetails = getEmployeeExperienceDetails(emp);
                          return {
                            value: String(emp.id),
                            label: `${emp.firstName} ${emp.lastName} (${emp.employeeId || "No ID"})`,
                            subLabel: `${emp.designation || "Staff"} ${emp.department?.name ? `• ${emp.department.name}` : ""} • [${exitTag}] • [Exp: ${expDetails.totalExp}] ${sal.annualCtc > 0 ? `• [CTC: ${sal.formattedCtc}]` : ""}`
                          };
                        })}
                        value={newReq.replacementForEmployeeId || ""}
                        onValueChange={(val) => {
                          const emp = dropdownEmployees.find(e => String(e.id) === String(val));
                          const salInfo = getEmployeeSalaryInfo(emp);
                          const expDetails = getEmployeeExperienceDetails(emp);
                          const exitType = emp?.exitProcess?.type === 'TERMINATION' ? 'Terminated' : 'Resigned';

                          const autoMinExp = Number(emp?.totalExperienceYears) > 0 
                            ? Number(emp.totalExperienceYears) 
                            : (() => {
                                const match = String(expDetails.totalExp).match(/\d+(\.\d+)?/);
                                return match ? Number(match[0]) : 2;
                              })();

                          setNewReq(prev => ({
                            ...prev,
                            replacementForEmployeeId: val,
                            // Auto-fetch & prefill Job Title, Department, and Min Experience
                            title: emp?.designation ? emp.designation : prev.title,
                            departmentId: emp?.departmentId ? String(emp.departmentId) : (emp?.department?.id ? String(emp.department.id) : prev.departmentId),
                            experienceRequired: autoMinExp,
                            // Auto-fill Job Specification & Justification with Total Experience & Salary Budget
                            jobSpecification: (!prev.jobSpecification || prev.jobSpecification.trim() === "" || prev.jobSpecification.includes("Qualifications & Skills:"))
                              ? `Qualifications & Skills: Min ${expDetails.totalExp} experience in ${emp?.designation || "relevant domain"}.${salInfo.annualCtc > 0 ? ` Target CTC: ~${salInfo.formattedCtc}/year.` : ""}`
                              : prev.jobSpecification,
                            justification: (!prev.justification || prev.justification.trim() === "" || prev.justification.includes("Replacement for"))
                              ? `Replacement for ${emp?.firstName} ${emp?.lastName} (${emp?.employeeId || "ID"}) [${exitType}] in ${emp?.department?.name || "Department"}.${salInfo.annualCtc > 0 ? ` Requisite budget: ${salInfo.formattedCtc}/yr.` : ""}`
                              : prev.justification,
                          }));
                          setFormErrors(prev => ({
                            ...prev,
                            replacementForEmployeeId: null,
                            ...(emp?.designation ? { title: null } : {}),
                            ...((emp?.departmentId || emp?.department?.id) ? { departmentId: null } : {}),
                          }));
                          if (emp) {
                            const detailsStr = [
                              salInfo.annualCtc > 0 ? `${salInfo.formattedCtc}/yr` : null,
                              `Exp: ${autoMinExp} Yrs`
                            ].filter(Boolean).join(" · ");
                            toast.info(`Matched & Auto-fetched "${emp.designation || 'Role'}" (${detailsStr})`);
                          }
                        }}
                        placeholder="Select resigned or terminated employee..."
                        searchPlaceholder="Type employee name, ID, or department..."
                        className="h-10 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60"
                      />
                      {formErrors.replacementForEmployeeId && (
                        <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.replacementForEmployeeId}</span>
                      )}

                      {/* Selected Employee Info Summary */}
                      {(() => {
                        const selectedEmp = dropdownEmployees.find(e => String(e.id) === String(newReq.replacementForEmployeeId));
                        if (!selectedEmp) return null;
                        const exitType = selectedEmp.exitProcess?.type || selectedEmp.status;
                        const salInfo = getEmployeeSalaryInfo(selectedEmp);
                        const expDetails = getEmployeeExperienceDetails(selectedEmp);

                        return (
                          <div className="text-[11px] bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 space-y-2 text-slate-700 dark:text-slate-200 shadow-xs">
                            <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/40 pb-1.5">
                              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Auto-filled Replacement Profile
                              </span>
                              <span className="text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded">
                                {exitType}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                              <div className="space-y-0.5">
                                <span className="text-slate-400 block text-[9.5px] font-semibold">ROLE & DEPARTMENT</span>
                                <span className="font-bold text-slate-800 dark:text-white block">{selectedEmp.designation || "Staff"}</span>
                                <span className="text-slate-500 dark:text-slate-400 block">{selectedEmp.department?.name || "Department"}</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-slate-400 block text-[9.5px] font-semibold">SALARY & EXPERIENCE MATCH</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                                  {salInfo.annualCtc > 0 ? `💰 ${salInfo.formattedCtc} / yr` : '💰 Standard Budget'}
                                </span>
                                <span className="text-slate-700 dark:text-slate-200 block font-bold">
                                  🎯 Exp: {expDetails.totalExp} <span className="text-slate-400 text-[9.5px] font-normal">(Tenure: {expDetails.companyTenure})</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Job Title</Label>
                    <Input
                      placeholder="e.g. Chemical Process Supervisor"
                      value={newReq.title}
                      onChange={(e) => {
                        setNewReq({ ...newReq, title: e.target.value });
                        if (formErrors.title) setFormErrors({ ...formErrors, title: null });
                      }}
                    />
                    {formErrors.title && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.title}</span>}
                  </div>
                  <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Department</Label>
                      <SearchableSelect
                        options={departments.filter(dept => dept.isActive !== false || (newReq.id && String(dept.id) === String(newReq.departmentId))).map((dept) => ({
                          value: String(dept.id),
                          label: dept.name
                        }))}
                        value={newReq.departmentId}
                        onValueChange={(val) => {
                          setNewReq({ ...newReq, departmentId: val });
                          if (formErrors.departmentId) setFormErrors({ ...formErrors, departmentId: null });
                        }}
                        placeholder="Search & select department..."
                        searchPlaceholder="Type department name..."
                        className={formErrors.departmentId ? "border-rose-500 border-2" : ""}
                      />
                      {formErrors.departmentId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.departmentId}</span>}
                    </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Headcount</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newReq.headcount}
                        onChange={(e) => {
                          setNewReq({ ...newReq, headcount: Number(e.target.value) });
                          if (formErrors.headcount) setFormErrors({ ...formErrors, headcount: null });
                        }}
                      />
                      {formErrors.headcount && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.headcount}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Min Exp (Yrs)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="e.g. 3"
                        value={newReq.experienceRequired ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value);
                          setNewReq({ ...newReq, experienceRequired: val });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Job Specification / Requirements</Label>
                    <Textarea
                      placeholder="e.g. Qualifications, key skills, experience & certifications..."
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:bg-slate-950 h-20"
                      value={newReq.jobSpecification || ""}
                      onChange={(e) => {
                        setNewReq({ ...newReq, jobSpecification: e.target.value });
                        if (formErrors.jobSpecification) setFormErrors({ ...formErrors, jobSpecification: null });
                      }}
                    />
                    {formErrors.jobSpecification && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.jobSpecification}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Job Justification</Label>
                    <Textarea
                      placeholder="Reason for headcount..."
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:bg-slate-950 h-20"
                      value={newReq.justification}
                      onChange={(e) => {
                        setNewReq({ ...newReq, justification: e.target.value });
                        if (formErrors.justification) setFormErrors({ ...formErrors, justification: null });
                      }}
                    />
                    {formErrors.justification && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.justification}</span>}
                  </div>

                  {/* CNV Act, 1959 Statutory Compliance Card */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <Label className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                            CNV Compliance (Act, 1959)
                          </Label>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block font-medium">
                            Compulsory Notification of Vacancies
                          </span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={Boolean(newReq.isCnvApplicable)}
                          onChange={(e) => {
                            setNewReq({
                              ...newReq,
                              isCnvApplicable: e.target.checked,
                              cnvStatus: e.target.checked ? (newReq.cnvStatus === "NOT_REQUIRED" ? "PENDING_NOTIFICATION" : newReq.cnvStatus) : "NOT_REQUIRED"
                            });
                          }}
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {newReq.isCnvApplicable ? (
                      <div className="space-y-2.5 pt-2 border-t border-indigo-200/60 dark:border-indigo-900/40 text-xs">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Employment Exchange Office</Label>
                          <Input
                            placeholder="e.g. District Employment Exchange, Industrial Area"
                            className="h-8 text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900"
                            value={newReq.cnvExchangeOffice || ""}
                            onChange={(e) => setNewReq({ ...newReq, cnvExchangeOffice: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Ack / Ref No.</Label>
                            <Input
                              placeholder="e.g. CNV-EE-2026/09"
                              className="h-8 text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900"
                              value={newReq.cnvRefNumber || ""}
                              onChange={(e) => setNewReq({ ...newReq, cnvRefNumber: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Notification Date</Label>
                            <DateTimePicker
                              type="date"
                              date={newReq.cnvNotificationDate}
                              setDate={(val) => setNewReq({ ...newReq, cnvNotificationDate: val })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Compliance Status</Label>
                          <Select
                            value={newReq.cnvStatus || "PENDING_NOTIFICATION"}
                            onValueChange={(val) => setNewReq({ ...newReq, cnvStatus: val })}
                          >
                            <SelectTrigger className="h-8 text-xs rounded-lg bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900 w-full">
                              <SelectValue placeholder="Select Status..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              <SelectItem value="PENDING_NOTIFICATION">Pending Notification</SelectItem>
                              <SelectItem value="NOTIFIED">Notified to Exchange</SelectItem>
                              <SelectItem value="ACKNOWLEDGED">Acknowledged by Exchange</SelectItem>
                              <SelectItem value="EXEMPTED">Exempted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-300 flex items-start gap-1">
                          <Info className="w-3 h-3 shrink-0 mt-0.5 text-indigo-500" />
                          <span>Under the CNV Act 1959, report vacancies to the designated Employment Exchange before filling.</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
                        <Label className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-400">Exemption Reason (If applicable)</Label>
                        <Input
                          placeholder="e.g. Vacancy tenure < 3 months, internal promotion, or exempt cadre"
                          className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          value={newReq.cnvExemptionReason || ""}
                          onChange={(e) => setNewReq({ ...newReq, cnvExemptionReason: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    {newReq.id && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setNewReq({ title: "", departmentId: departments[0]?.id || "", headcount: 1, experienceRequired: "", justification: "", jobSpecification: "", requisitionType: "NEW_REQUIREMENT", replacementForEmployeeId: "", raisedBy: "HR Manager", isCnvApplicable: false, cnvExchangeOffice: "", cnvRefNumber: "", cnvNotificationDate: "", cnvStatus: "NOT_REQUIRED", cnvExemptionReason: "" });
                          setFormErrors({});
                        }}
                        className="w-1/3 rounded-xl font-bold"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" className={`bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl ${newReq.id ? 'w-2/3' : 'w-full'}`}>
                      {newReq.id ? "Update Requisition" : "Submit Requisition"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Active Requisitions DataTable */}
              <div className="lg:col-span-2">
                <DataTable
                  title="Active Requisitions"
                  lazy
                  value={requisitions}
                  totalRecords={totalRequisitions}
                  page={reqPage}
                  rows={reqRows}
                  loading={loading}
                  search={reqSearch}
                  sortBy={reqSortBy}
                  sortOrder={reqSortOrder}
                  onPageChange={(p) => setReqPage(p)}
                  onRowsChange={(r) => { setReqRows(r); setReqPage(1); }}
                  onSortChange={(k, dir) => { setReqSortBy(k); setReqSortOrder(dir); setReqPage(1); }}
                  onSearchChange={(s) => { setReqSearch(s); setReqPage(1); }}
                  emptyMessage="No job requisitions found."
                  columns={[
                    {
                      key: "title",
                      label: "Job Specification",
                      render: (row) => {
                        const isReplacement = row.requisitionType === "REPLACEMENT";
                        const replEmp = row.replacementForEmployee;
                        const replEmpName = replEmp
                          ? `${replEmp.firstName} ${replEmp.lastName}`
                          : dropdownEmployees.find(e => String(e.id) === String(row.replacementForEmployeeId))
                            ? `${dropdownEmployees.find(e => String(e.id) === String(row.replacementForEmployeeId)).firstName} ${dropdownEmployees.find(e => String(e.id) === String(row.replacementForEmployeeId)).lastName}`
                            : null;
                        const replEmpId = replEmp?.employeeId || dropdownEmployees.find(e => String(e.id) === String(row.replacementForEmployeeId))?.employeeId;

                        return (
                          <div className="space-y-1 max-w-[280px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-slate-800 dark:text-white block">{row.title}</span>
                              {isReplacement ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  Replacement
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  New Req
                                </span>
                              )}
                            </div>
                            {isReplacement && (replEmpName || row.replacementForEmployeeId) && (() => {
                              const empObj = replEmp || dropdownEmployees.find(e => String(e.id) === String(row.replacementForEmployeeId));
                              const sal = getEmployeeSalaryInfo(empObj);
                              const expDetails = getEmployeeExperienceDetails(empObj);
                              return (
                                <div className="text-[10.5px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/20 px-2 py-1 rounded border border-amber-200/60 dark:border-amber-800/40 space-y-0.5">
                                  <div className="truncate">
                                    <span className="font-bold">Replaces:</span> {replEmpName || 'Employee'} {replEmpId ? `(${replEmpId})` : ''}
                                  </div>
                                  <div className="flex items-center gap-2 text-[9.5px] text-amber-800 dark:text-amber-300 font-semibold flex-wrap">
                                    {sal.annualCtc > 0 && <span>💰 Prev CTC: <strong className="text-emerald-700 dark:text-emerald-400">{sal.formattedCtc}</strong></span>}
                                    <span>🎯 Exp: <strong>{expDetails.totalExp}</strong> <span className="text-slate-400 font-normal">(Tenure: {expDetails.companyTenure})</span></span>
                                  </div>
                                </div>
                              );
                            })()}
                            {row.jobSpecification && (
                              <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium block truncate" title={`Job Specification: ${row.jobSpecification}`}>
                                <span className="font-semibold text-slate-500 dark:text-slate-400">Spec:</span> {row.jobSpecification}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 block truncate" title={`Justification: ${row.justification}`}>
                              <span className="font-semibold text-slate-500 dark:text-slate-400">Reason:</span> {row.justification}
                            </span>
                          </div>
                        );
                      },
                    },
                    {
                      key: "department.name",
                      label: "Department",
                      render: (row) => {
                        const deptName = row.department?.name || departments.find(d => String(d.id) === String(row.departmentId))?.name || "Unknown";
                        return (
                          <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                            {deptName}
                          </span>
                        );
                      },
                    },
                    {
                      key: "headcount",
                      label: "Headcount",
                      render: (row) => (
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">{row.headcount}</span>
                      ),
                    },
                    {
                      key: "cnvStatus",
                      label: "CNV",
                      render: (row) => {
                        const isCnv = row.isCnvApplicable;
                        // Determine effective status — prefer CnvRecord status, fall back to JobRequisition cnvStatus string
                        const cnvRecordStatus = row.cnvRecord?.cnvStatus;
                        const legacyStatus = row.cnvStatus;
                        const status = cnvRecordStatus || legacyStatus;

                        if (!isCnv) {
                          return (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700" title={row.cnvExemptionReason ? `Exemption: ${row.cnvExemptionReason}` : "CNV Not Applicable"}>
                              N/A
                            </span>
                          );
                        }

                        if (status === "ACKNOWLEDGED") {
                          return (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                                <CheckCircle className="w-2.5 h-2.5" />
                                CNV Ack ✓
                              </span>
                              {(row.cnvRecord?.acknowledgementNumber || row.cnvRefNumber) && (
                                <span className="block text-[9.5px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[110px]" title={`Ack: ${row.cnvRecord?.acknowledgementNumber || row.cnvRefNumber}`}>
                                  #{row.cnvRecord?.acknowledgementNumber || row.cnvRefNumber}
                                </span>
                              )}
                            </div>
                          );
                        }
                        if (status === "NOTIFIED") {
                          return (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                <Send className="w-2.5 h-2.5" />
                                CNV Notified
                              </span>
                              {(row.cnvRecord?.referenceNumber || row.cnvRefNumber) && (
                                <span className="block text-[9.5px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[110px]" title={`Ref: ${row.cnvRecord?.referenceNumber || row.cnvRefNumber}`}>
                                  #{row.cnvRecord?.referenceNumber || row.cnvRefNumber}
                                </span>
                              )}
                            </div>
                          );
                        }
                        // Default: PENDING_NOTIFICATION or any other
                        return (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                            <Landmark className="w-2.5 h-2.5" />
                            Pending CNV
                          </span>
                        );
                      },
                    },
                    {
                      key: "raisedBy",
                      label: "Raised By",
                      render: (row) => (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{row.raisedBy}</span>
                      ),
                    },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                          row.status === "APPROVED"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* CNV Compliance Action — only when CNV is applicable */}
                          {row.isCnvApplicable && (
                            <button
                              onClick={() => openCnvModal(row)}
                              className="p-1.5 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 dark:hover:bg-indigo-500 rounded-lg transition-all"
                              title="CNV Compliance"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setNewReq({
                                id: row.id,
                                title: row.title,
                                departmentId: row.departmentId,
                                headcount: row.headcount,
                                experienceRequired: row.experienceRequired ?? "",
                                justification: row.justification,
                                jobSpecification: row.jobSpecification || "",
                                requisitionType: row.requisitionType || "NEW_REQUIREMENT",
                                replacementForEmployeeId: row.replacementForEmployeeId || "",
                                raisedBy: row.raisedBy,
                                isCnvApplicable: Boolean(row.isCnvApplicable),
                                cnvExchangeOffice: row.cnvExchangeOffice || row.cnvRecord?.employmentExchangeOffice || "",
                                cnvRefNumber: row.cnvRefNumber || "",
                                cnvNotificationDate: row.cnvNotificationDate ? String(row.cnvNotificationDate).split("T")[0] : "",
                                cnvStatus: row.cnvRecord?.cnvStatus || row.cnvStatus || (row.isCnvApplicable ? "PENDING_NOTIFICATION" : "NOT_REQUIRED"),
                                cnvExemptionReason: row.cnvExemptionReason || ""
                              });
                            }}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: row.id, name: `requisition "${row.title}"`, type: "requisition", label: "Job Requisition" })}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* TAB 2: CANDIDATES */}
          {activeTab === "candidates" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-500" />
                  {newCand.id ? "Edit Candidate" : "Log Candidate"}
                </h3>
                <form onSubmit={handleSubmitCandidate} className="space-y-3" noValidate>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Full Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={newCand.name}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\d/g, "");
                        setNewCand({ ...newCand, name: val });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                      }}
                    />
                    {formErrors.name && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.name}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={newCand.email}
                      onChange={(e) => {
                        setNewCand({ ...newCand, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                      }}
                    />
                    {formErrors.email && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.email}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Phone</Label>
                    <Input
                      placeholder="Enter 10-digit mobile number"
                      value={newCand.phone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setNewCand({ ...newCand, phone: val });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                      }}
                    />
                    {formErrors.phone && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.phone}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Job Requisition</Label>
                    <Select value={newCand.requisitionId} onValueChange={(val) => {
                      setNewCand({ ...newCand, requisitionId: val });
                      if (formErrors.requisitionId) setFormErrors({ ...formErrors, requisitionId: null });
                    }}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {dropdownRequisitions.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.title} ({r.department?.name || "Unknown"}) {r.requisitionType === 'REPLACEMENT' ? '• [Replacement]' : '• [New Req]'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.requisitionId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.requisitionId}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Sourcing Source</Label>
                      <Select value={newCand.source} onValueChange={(val) => {
                        setNewCand({ ...newCand, source: val });
                        if (formErrors.source) setFormErrors({ ...formErrors, source: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="Portal">Portal</SelectItem>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="Agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.source && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.source}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Total Exp (Yrs)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="e.g. 3.5 (0 for Fresher)"
                        value={newCand.experienceYears ?? ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value);
                          setNewCand({ ...newCand, experienceYears: val });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Resume / CV (PDF)</Label>
                    {newCand.id && newCand.resumeUrl && (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                        <a
                          href={getResumeUrl(newCand.resumeUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sky-600 dark:text-sky-400 font-semibold underline truncate"
                        >
                          View Current Resume
                        </a>
                        <span className="ml-auto text-[10px] text-slate-400">Replace below</span>
                      </div>
                    )}
                    <Input
                      id="resume-upload-input"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">PDF only · Max 2 MB{newCand.id ? " · Upload to replace current resume" : ""}</span>
                    {uploadingFile && <span className="text-[10px] text-sky-500 font-semibold block">Uploading...</span>}
                    {newCand.resumeUrl && !uploadingFile && <span className="text-[10px] text-emerald-500 font-semibold block">{newCand.id ? "New resume uploaded — will replace on save" : "Uploaded successfully"}</span>}
                    {formErrors.resumeUrl && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.resumeUrl}</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {newCand.id && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setNewCand({ name: "", email: "", phone: "", source: "Portal", requisitionId: "", experienceYears: "", resumeUrl: "" });
                          setFormErrors({});
                        }}
                        className="w-1/3 rounded-xl font-bold"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" className={`bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl ${newCand.id ? 'w-2/3' : 'w-full'}`}>
                      {newCand.id ? "Update Candidate" : "Add Candidate"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Active Candidates DataTable */}
              <div className="lg:col-span-2">
                <DataTable
                  title="Active Candidates"
                  lazy
                  value={candidates}
                  totalRecords={totalCandidates}
                  page={candPage}
                  rows={candRows}
                  loading={loading}
                  search={candSearch}
                  sortBy={candSortBy}
                  sortOrder={candSortOrder}
                  onPageChange={(p) => setCandPage(p)}
                  onRowsChange={(r) => { setCandRows(r); setCandPage(1); }}
                  onSortChange={(k, dir) => { setCandSortBy(k); setCandSortOrder(dir); setCandPage(1); }}
                  onSearchChange={(s) => { setCandSearch(s); setCandPage(1); }}
                  emptyMessage="No candidates found."
                  headerRight={
                    <div className="flex items-center gap-2">
                      <Select
                        value={candStatusFilter}
                        onValueChange={(val) => {
                          setCandStatusFilter(val);
                          setCandPage(1);
                        }}
                      >
                        <SelectTrigger className="h-10 text-xs font-semibold rounded-xl bg-background border border-border/60 hover:border-slate-400 dark:hover:border-slate-600 focus:ring-1 focus:ring-sky-500 w-[180px] shadow-sm transition-all">
                          <div className="flex items-center gap-1.5 truncate">
                            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <SelectValue placeholder="All Statuses" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50">
                          <SelectItem value="ALL" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            All Statuses
                          </SelectItem>
                          <SelectItem value="SOURCED" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                              Sourced
                            </span>
                          </SelectItem>
                          <SelectItem value="INTERVIEWING" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              Interviewing
                            </span>
                          </SelectItem>
                          <SelectItem value="SELECTED" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Selected
                            </span>
                          </SelectItem>
                          <SelectItem value="OFFERED" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                              Offered
                            </span>
                          </SelectItem>
                          <SelectItem value="ACCEPTED" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                              Accepted
                            </span>
                          </SelectItem>
                          <SelectItem value="REJECTED" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              Rejected
                            </span>
                          </SelectItem>
                          <SelectItem value="RE_INTERVIEW_ELIGIBLE" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Re-interview Eligible
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {candStatusFilter !== "ALL" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCandStatusFilter("ALL");
                            setCandPage(1);
                          }}
                          className="h-10 px-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Clear Filter"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Clear
                        </Button>
                      )}
                    </div>
                  }
                  columns={[
                    {
                      key: "name",
                      label: "Candidate",
                      render: (row) => {
                        const reHist = getReInterviewHistory(row);
                        return (
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
                              {row.name}
                              {reHist.isReInterview && row.status !== "SELECTED" && row.status !== "ACCEPTED" && row.status !== "OFFERED" && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 flex items-center gap-1" title="Candidate was previously rejected and is re-interviewing">
                                  <RotateCcw className="w-2.5 h-2.5" /> Re-Interview (Prev. Rejected)
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold">Source: {row.source}</span>
                              {row.experienceYears !== undefined && row.experienceYears !== null && row.experienceYears !== "" && Number(row.experienceYears) >= 0 && (
                                <span className="text-[9.5px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.2 rounded border border-sky-200 dark:border-sky-800">
                                  🎯 Exp: {row.experienceYears} Yrs
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      },
                    },
                    {
                      key: "email",
                      label: "Contact Info",
                      render: (row) => (
                        <div className="text-xs space-y-0.5">
                          <span className="text-slate-600 dark:text-slate-300 block font-medium">{row.email ? row.email.toLowerCase() : ""}</span>
                          {row.phone && <span className="text-slate-400 block">{row.phone}</span>}
                        </div>
                      ),
                    },
                    {
                      key: "requisition.title",
                      label: "Applied Role",
                      render: (row) => {
                        const req = row.requisition;
                        const isReplacement = req?.requisitionType === "REPLACEMENT";
                        const replEmp = req?.replacementForEmployee;
                        return (
                          <div className="space-y-0.5">
                            <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400 block">
                              {req?.title || "Unknown"}
                            </span>
                            {isReplacement ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                <RotateCcw className="w-2.5 h-2.5" /> Replacement {replEmp ? `for ${replEmp.firstName}` : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                <Sparkles className="w-2.5 h-2.5" /> New Req
                              </span>
                            )}
                          </div>
                        );
                      },
                    },
                    {
                      key: "resumeUrl",
                      label: "Resume",
                      sortable: false,
                      render: (row) => row.resumeUrl ? (
                        <a
                          href={getResumeUrl(row.resumeUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-500 hover:text-sky-600 dark:text-sky-400 font-extrabold text-xs"
                        >
                          View PDF
                        </a>
                      ) : <span className="text-slate-400 text-xs">No Resume</span>,
                    },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => {
                        const coolOff = getCandidateCoolOffInfo(row);
                        if (row.status === "REJECTED") {
                          if (coolOff.isCoolingOff) {
                            return (
                              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                                REJECTED ({coolOff.daysLeft}d cool-off)
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
                              REJECTED (Re-interview Eligible)
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-900/50">
                            {row.status}
                          </span>
                        );
                      },
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      sortable: false,
                      render: (row) => {
                        const hasScheduledInterview = schedules.some((s) => String(s.candidateId) === String(row.id)) || row.status === "INTERVIEWING";
                        const isFinalStatus = row.status === "SELECTED" || row.status === "REJECTED" || row.status === "ACCEPTED";

                        return (
                          <div className="flex gap-1 items-center">
                            {hasScheduledInterview && !isFinalStatus && (
                              <>
                                <button
                                  onClick={() => handleUpdateCandidateStatus(row.id, "SELECTED")}
                                  className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-lg text-[9px] px-2 py-1 cursor-pointer transition-all shadow-sm"
                                >
                                  Select
                                </button>
                                <button
                                  onClick={() => handleUpdateCandidateStatus(row.id, "REJECTED")}
                                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-[9px] px-2 py-1 cursor-pointer transition-all shadow-sm"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setNewCand({
                                  id: row.id,
                                  name: row.name,
                                  email: row.email,
                                  phone: row.phone || "",
                                  source: row.source,
                                  requisitionId: String(row.requisitionId || row.requisition?.id || ""),
                                  experienceYears: row.experienceYears ?? "",
                                  resumeUrl: row.resumeUrl || ""
                                });
                                // Scroll to form (optional)
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: row.id, name: `candidate "${row.name}"`, type: "candidate", label: "Candidate Profile" })}
                              className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      }
                    }
                  ]}
                />
              </div>
            </div>
          )}

          {/* TAB 3: INTERVIEWS */}
          {activeTab === "interviews" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scheduling & Feedback Forms Column */}
              <div className="space-y-6 h-fit">
                {/* Schedule Interview Form */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-sky-500" />
                    {newSched.id ? "Edit Schedule" : "Schedule Interview"}
                  </h3>
                  <form onSubmit={handleSubmitSchedule} className="space-y-3" noValidate>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Candidate</Label>
                      {(() => {
                        const baseList = (dropdownCandidates && dropdownCandidates.length > 0) ? dropdownCandidates : (candidates || []);
                        const candidateOptions = [...baseList];
                        if (newSched.candidateId) {
                          const exists = candidateOptions.some(c => String(c.id) === String(newSched.candidateId));
                          if (!exists) {
                            const sched = schedules.find(s => String(s.candidateId) === String(newSched.candidateId) || String(s.id) === String(newSched.id));
                            if (sched?.candidate) {
                              candidateOptions.unshift(sched.candidate);
                            }
                          }
                        }

                        const filteredCandidates = candidateOptions.filter(c => {
                          if (newSched.candidateId && String(c.id) === String(newSched.candidateId)) return true;
                          return c.status !== 'SELECTED' && c.status !== 'ACCEPTED';
                        });

                        return (
                          <Select
                            disabled={Boolean(newSched.id)}
                            value={newSched.candidateId ? String(newSched.candidateId) : ""}
                            onValueChange={(val) => {
                              setNewSched({ ...newSched, candidateId: val });
                              if (formErrors.candidateId) setFormErrors({ ...formErrors, candidateId: null });
                            }}
                          >
                            <SelectTrigger className={`h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full ${newSched.id ? 'opacity-70 cursor-not-allowed bg-slate-100/70 dark:bg-slate-800/70' : ''}`}>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              {filteredCandidates.map((c) => {
                                const coolOff = getCandidateCoolOffInfo(c);
                                let labelSuffix = "";
                                if (coolOff.isCoolingOff) {
                                  labelSuffix = ` (Rejected - ${coolOff.daysLeft}d cool-off left)`;
                                } else if (c.status === 'REJECTED') {
                                  labelSuffix = ` (Rejected - Re-interview Eligible)`;
                                }
                                return (
                                  <SelectItem key={c.id} value={String(c.id)}>
                                    {c.name}{labelSuffix}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                      {formErrors.candidateId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.candidateId}</span>}
                    </div>

                    {newSched.candidateId && (() => {
                      const selCand = (dropdownCandidates.length > 0 ? dropdownCandidates : candidates).find(c => String(c.id) === String(newSched.candidateId));
                      if (!selCand) return null;
                      const coolOff = getCandidateCoolOffInfo(selCand);
                      const reHist = getReInterviewHistory(selCand);
                      const dbDaysLeft = selCand.coolOffDaysLeft ?? (coolOff.isCoolingOff ? coolOff.daysLeft : 0);
                      const candSchedules = (schedules || []).filter(
                        (s) => String(s.candidateId) === String(newSched.candidateId) && (!newSched.id || String(s.id) !== String(newSched.id))
                      );
                      const sortedSchedules = [...candSchedules].sort(
                        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
                      );
                      const latestSched = sortedSchedules[0];

                      return (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-1">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <span className="font-extrabold text-slate-800 dark:text-white">{selCand.name}</span>
                            {reHist.isReInterview && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 flex items-center gap-1">
                                <RotateCcw className="w-2.5 h-2.5" /> Re-Interview Candidate
                              </span>
                            )}
                          </div>
                          {latestSched && (
                            <div className="text-sky-600 dark:text-sky-400 font-semibold text-[11px] flex items-center gap-1">
                              <Calendar className="w-3 h-3 shrink-0" />
                              Latest Round ({latestSched.roundName}): {new Date(latestSched.scheduledAt).toLocaleString()}
                            </div>
                          )}
                          {coolOff.isCoolingOff ? (
                            <div className="text-rose-500 font-bold text-[11px] flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              Cool-off Active: {dbDaysLeft} days remaining (Eligible on {coolOff.eligibleDateString})
                            </div>
                          ) : selCand.status === 'RE_INTERVIEW_ELIGIBLE' || selCand.status === 'REJECTED' ? (
                            <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Cool-off Finished: Eligible for Re-interview
                            </div>
                          ) : null}
                          {(selCand.rejectionCount > 0 || selCand.isReInterview) && (
                            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-semibold">
                              DB Rejections Count: {selCand.rejectionCount ?? 1} | Days Left in DB: {dbDaysLeft} days
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Round Name</Label>
                      <Input
                        value={newSched.roundName}
                        onChange={(e) => {
                          setNewSched({ ...newSched, roundName: e.target.value });
                          if (formErrors.roundName) setFormErrors({ ...formErrors, roundName: null });
                        }}
                      />
                      {formErrors.roundName && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.roundName}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Scheduled Date & Time</Label>
                      {(() => {
                        const candSchedules = (schedules || []).filter(
                          (s) => String(s.candidateId) === String(newSched.candidateId) && (!newSched.id || String(s.id) !== String(newSched.id))
                        );
                        const sortedSchedules = [...candSchedules].sort(
                          (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
                        );
                        const latestSched = sortedSchedules[0];
                        const minDateVal = latestSched && new Date(latestSched.scheduledAt) > new Date()
                          ? new Date(latestSched.scheduledAt)
                          : undefined;

                        return (
                          <DateTimePicker
                            date={newSched.scheduledAt}
                            disablePast={true}
                            minDate={minDateVal}
                            setDate={(val) => {
                              setNewSched({ ...newSched, scheduledAt: val });
                              if (formErrors.scheduledAt) setFormErrors({ ...formErrors, scheduledAt: null });
                            }}
                          />
                        );
                      })()}
                      {formErrors.scheduledAt && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.scheduledAt}</span>}
                    </div>
                    {/* Panel Members (Multi-Select) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Panel Members (Multi-Select)
                      </Label>
                      {(() => {
                        const selectedUserIds = parsePanelistList(newSched.panelists);
                        return (
                          <>
                            {selectedUserIds.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                                {selectedUserIds.map((uId) => {
                                  const userObj = users.find((u) => String(u.id) === String(uId) || u.name?.toLowerCase() === String(uId).toLowerCase());
                                  const displayName = userObj ? userObj.name : uId;
                                  return (
                                    <span
                                      key={uId}
                                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                                    >
                                      {displayName}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = selectedUserIds.filter((id) => id !== uId);
                                          setNewSched({ ...newSched, panelists: updated });
                                        }}
                                        className="hover:text-rose-500 rounded-full p-0.5 transition-colors cursor-pointer"
                                        title="Remove panelist"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            <Select
                              value=""
                              onValueChange={(val) => {
                                if (val) {
                                  if (!selectedUserIds.includes(val)) {
                                    const updated = [...selectedUserIds, val];
                                    setNewSched({ ...newSched, panelists: updated });
                                    if (formErrors.panelists) setFormErrors({ ...formErrors, panelists: null });
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                                <SelectValue placeholder={selectedUserIds.length > 0 ? "Add another panel member..." : "Select panel members..."} />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                {users.map((u) => {
                                  const isSel = selectedUserIds.includes(String(u.id)) || selectedUserIds.includes(u.name);
                                  return (
                                    <SelectItem
                                      key={u.id}
                                      value={String(u.id)}
                                      disabled={isSel}
                                      className={isSel ? "opacity-40 font-bold" : ""}
                                    >
                                      {isSel ? `✓ ${u.name} (${u.role?.toUpperCase()})` : `${u.name} (${u.role?.toUpperCase()})`}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </>
                        );
                      })()}
                      {formErrors.panelists && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.panelists}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {newSched.id && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setNewSched({ candidateId: "", roundName: "Technical Round 1", scheduledAt: "", panelists: [] });
                            setFormErrors({});
                          }}
                          className="w-1/3 rounded-xl font-bold"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" className={`bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl ${newSched.id ? 'w-2/3' : 'w-full'}`}>
                        {newSched.id ? "Update Schedule" : "Schedule Round"}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Log Feedback Form */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-sky-500" />
                    {newFeedback.id ? "Edit Panelist Feedback" : "Record Panelist Feedback"}
                  </h3>
                  <form onSubmit={handleCreateFeedback} className="space-y-3" noValidate>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Filter by Candidate</Label>
                      {(() => {
                        const candidatesWithEligibleInterviews = Array.from(
                          new Map(
                            (schedules || [])
                              .filter((s) => s.scheduledAt && new Date(s.scheduledAt) <= new Date())
                              .map((s) => {
                                const cand =
                                  s.candidate ||
                                  (dropdownCandidates || candidates || []).find(
                                    (c) => String(c.id) === String(s.candidateId),
                                  );
                                return cand ? [String(cand.id), cand] : null;
                              })
                              .filter(Boolean),
                          ).values(),
                        );

                        return (
                          <Select
                            value={feedbackCandidateId}
                            onValueChange={(val) => {
                              setFeedbackCandidateId(val);
                              setNewFeedback({
                                ...newFeedback,
                                scheduleId: "",
                                panelistId: "",
                                panelistName: "",
                              });
                            }}
                          >
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                              <SelectValue placeholder="All Candidates" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              <SelectItem value="ALL">All Eligible Candidates ({candidatesWithEligibleInterviews.length})</SelectItem>
                              {candidatesWithEligibleInterviews.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Select Schedule</Label>
                      <Select value={newFeedback.scheduleId} onValueChange={(val) => {
                        if (val === "_none" || !val) return;
                        const selSched = schedules.find(s => String(s.id) === String(val));
                        const assigned = parsePanelistList(selSched?.panelists);
                        const firstUser = users.find(u => String(u.id) === String(assigned[0]) || u.name?.toLowerCase() === assigned[0]?.toLowerCase());
                        const firstPanelistId = firstUser ? firstUser.id : (assigned[0] || "");
                        const firstPanelistName = firstUser ? firstUser.name : (assigned[0] || "");

                        // Auto-load existing feedback if already submitted
                        const existingFb = selSched?.feedbacks?.find((f) =>
                          (firstPanelistId && String(f.panelistId) === String(firstPanelistId)) ||
                          (firstPanelistName && f.panelistName?.toLowerCase() === firstPanelistName.toLowerCase())
                        );

                        if (existingFb) {
                          setNewFeedback({
                            id: existingFb.id,
                            scheduleId: val,
                            panelistId: firstPanelistId,
                            panelistName: firstPanelistName,
                            rating: existingFb.rating !== undefined && existingFb.rating !== null ? String(existingFb.rating) : "",
                            comments: existingFb.comments || "",
                            recommendation: existingFb.recommendation || "",
                          });
                        } else {
                          setNewFeedback({
                            id: "",
                            scheduleId: val,
                            panelistId: firstPanelistId,
                            panelistName: firstPanelistName,
                            rating: "",
                            comments: "",
                            recommendation: "",
                          });
                        }
                        if (formErrors.scheduleId) setFormErrors({ ...formErrors, scheduleId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select a schedule..." />
                        </SelectTrigger>
                        <SelectContent position="popper" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {(() => {
                            const eligibleSchedules = schedules.filter(s => {
                              const matchesCandidate = feedbackCandidateId === 'ALL' || String(s.candidateId) === String(feedbackCandidateId);
                              const hasStarted = s.scheduledAt ? new Date(s.scheduledAt) <= new Date() : false;
                              return matchesCandidate && hasStarted;
                            });

                            if (eligibleSchedules.length === 0) {
                              return (
                                <SelectItem disabled value="_none">
                                  No completed or ongoing interviews available
                                </SelectItem>
                              );
                            }

                            return eligibleSchedules.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.candidate?.name || "Candidate"} - Round: {s.roundName} ({new Date(s.scheduledAt).toLocaleDateString()})
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      {formErrors.scheduleId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.scheduleId}</span>}
                    </div>

                    {newFeedback.scheduleId && (() => {
                      const selSched = schedules.find(s => String(s.id) === String(newFeedback.scheduleId));
                      const cand = selSched?.candidate || candidates.find(c => String(c.id) === String(selSched?.candidateId));
                      const reHist = getReInterviewHistory(cand);
                      const isFinalStatus = cand?.status === "SELECTED" || cand?.status === "ACCEPTED" || cand?.status === "OFFERED";
                      if (!reHist.isReInterview || isFinalStatus) return null;
                      return (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                          <span className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                            <RotateCcw className="w-3.5 h-3.5" /> Re-Interview Candidate Note
                          </span>
                          <p className="text-[11px] opacity-90 leading-tight">
                            This candidate was previously rejected in a past interview process.
                            {reHist.rejectedComment && <span className="block mt-0.5 italic">Past Panel Comment: &quot;{reHist.rejectedComment}&quot;</span>}
                          </p>
                        </div>
                      );
                    })()}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Panelist Name</Label>
                      {(() => {
                        const currentSchedule = schedules.find((s) => String(s.id) === String(newFeedback.scheduleId));
                        const assignedIdsOrNames = parsePanelistList(currentSchedule?.panelists);

                        const panelistOptions = assignedIdsOrNames.map((item) => {
                          const userMatch = users.find((u) => String(u.id) === String(item) || u.name?.toLowerCase() === item.toLowerCase());
                          return {
                            id: userMatch ? userMatch.id : item,
                            name: userMatch ? userMatch.name : item,
                            role: userMatch?.role ? userMatch.role.toUpperCase() : "PANELIST",
                          };
                        });

                        let selectedPanelistValue = newFeedback.panelistId || newFeedback.panelistName || "";

                        if (selectedPanelistValue) {
                          const exactOrPartialMatch = panelistOptions.find(p => 
                            String(p.id) === String(selectedPanelistValue) ||
                            p.name.toLowerCase() === selectedPanelistValue.toLowerCase()
                          );
                          if (exactOrPartialMatch) {
                            selectedPanelistValue = exactOrPartialMatch.id;
                          } else {
                            panelistOptions.unshift({
                              id: selectedPanelistValue,
                              name: selectedPanelistValue,
                              role: "PANELIST",
                            });
                          }
                        }

                        return (
                          <Select
                            key={selectedPanelistValue || 'empty'}
                            disabled={!newFeedback.scheduleId}
                            value={selectedPanelistValue}
                            onValueChange={(val) => {
                              const matchObj = panelistOptions.find(p => String(p.id) === String(val) || p.name.toLowerCase() === val.toLowerCase());
                              const pId = matchObj ? matchObj.id : val;
                              const pName = matchObj ? matchObj.name : val;

                              // Check if feedback already exists for this panelist on this schedule
                              const existingFb = currentSchedule?.feedbacks?.find((f) =>
                                (pId && String(f.panelistId) === String(pId)) ||
                                (pName && f.panelistName?.toLowerCase() === pName.toLowerCase())
                              );

                              if (existingFb) {
                                setNewFeedback({
                                  id: existingFb.id,
                                  scheduleId: currentSchedule?.id || newFeedback.scheduleId,
                                  panelistId: pId,
                                  panelistName: pName,
                                  rating: existingFb.rating !== undefined && existingFb.rating !== null ? String(existingFb.rating) : "",
                                  comments: existingFb.comments || "",
                                  recommendation: existingFb.recommendation || "",
                                });
                              } else {
                                setNewFeedback({
                                  ...newFeedback,
                                  id: "",
                                  panelistId: pId,
                                  panelistName: pName,
                                  rating: "",
                                  comments: "",
                                  recommendation: "",
                                });
                              }
                              if (formErrors.panelistName) setFormErrors({ ...formErrors, panelistName: null });
                            }}
                          >
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                              <SelectValue placeholder={!newFeedback.scheduleId ? "Select a schedule first" : "Select assigned panelist..."} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              {panelistOptions.length > 0 ? (
                                panelistOptions.map((p) => {
                                  const hasFb = currentSchedule?.feedbacks?.some(
                                    f => String(f.panelistId) === String(p.id) || f.panelistName?.toLowerCase() === p.name.toLowerCase()
                                  );
                                  return (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                      {p.name} ({p.role}) {hasFb ? "✓ (Recorded)" : ""}
                                    </SelectItem>
                                  );
                                })
                              ) : (
                                <SelectItem disabled value="_empty">
                                  No panel members assigned to this schedule
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                      {formErrors.panelistName && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.panelistName}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Rating (1 to 10)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newFeedback.rating}
                        onChange={(e) => {
                          setNewFeedback({ ...newFeedback, rating: e.target.value });
                          if (formErrors.rating) setFormErrors({ ...formErrors, rating: null });
                        }}
                      />
                      {formErrors.rating && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.rating}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Comments</Label>
                      <Textarea
                        placeholder="Detailed strengths & weaknesses..."
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:bg-slate-950 h-16"
                        value={newFeedback.comments}
                        onChange={(e) => {
                          setNewFeedback({ ...newFeedback, comments: e.target.value });
                          if (formErrors.comments) setFormErrors({ ...formErrors, comments: null });
                        }}
                      />
                      {formErrors.comments && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.comments}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Recommendation</Label>
                      <Select value={newFeedback.recommendation} onValueChange={(val) => {
                        setNewFeedback({ ...newFeedback, recommendation: val });
                        if (formErrors.recommendation) setFormErrors({ ...formErrors, recommendation: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select recommendation..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="SELECT">SELECT (Recommend Candidate)</SelectItem>
                          <SelectItem value="REJECT">REJECT Candidate</SelectItem>
                          <SelectItem value="HOLD">HOLD Candidate</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.recommendation && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.recommendation}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {newFeedback.id && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNewFeedback({ id: "", scheduleId: "", panelistId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
                            setFormErrors({});
                          }}
                          className="w-1/3 rounded-xl font-bold"
                        >
                          Cancel
                        </Button>
                      )}
                      {(() => {
                        const selSched = schedules.find(s => String(s.id) === String(newFeedback.scheduleId));
                        const isUpcoming = selSched && selSched.scheduledAt && new Date(selSched.scheduledAt) > new Date();
                        return (
                          <Button
                            type="submit"
                            disabled={isUpcoming}
                            className={`bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl ${newFeedback.id ? 'w-2/3' : 'w-full'} ${isUpcoming ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {newFeedback.id ? "Update Feedback" : "Submit Recommendation"}
                          </Button>
                        );
                      })()}
                    </div>
                  </form>
                </div>
              </div>

              {/* Schedules Table Column */}
              <div className="lg:col-span-2 space-y-4">
                <DataTable
                  title="Scheduled Interviews"
                  lazy
                  value={schedules}
                  totalRecords={totalSchedules}
                  page={schedPage}
                  rows={schedRows}
                  loading={loading}
                  search={schedSearch}
                  sortBy={schedSortBy}
                  sortOrder={schedSortOrder}
                  onPageChange={(p) => setSchedPage(p)}
                  onRowsChange={(r) => { setSchedRows(r); setSchedPage(1); }}
                  onSortChange={(k, dir) => { setSchedSortBy(k); setSchedSortOrder(dir); setSchedPage(1); }}
                  onSearchChange={(s) => { setSchedSearch(s); setSchedPage(1); }}
                  headerRight={
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Shadcn UI DatePicker Filter */}
                      <div className="w-[155px]">
                        <DatePicker
                          date={schedDateFilter}
                          setDate={(val) => {
                            setSchedDateFilter(val);
                            setSchedPage(1);
                          }}
                          placeholder="Filter Date"
                          className="h-10 text-xs font-semibold rounded-xl"
                        />
                      </div>

                      {/* Status Filter */}
                      <Select
                        value={schedStatusFilter}
                        onValueChange={(val) => {
                          setSchedStatusFilter(val);
                          setSchedPage(1);
                        }}
                      >
                        <SelectTrigger className="h-10 text-xs font-semibold rounded-xl bg-background border border-border/60 hover:border-slate-400 dark:hover:border-slate-600 focus:ring-1 focus:ring-sky-500 w-[155px] shadow-sm transition-all">
                          <div className="flex items-center gap-1.5 truncate">
                            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <SelectValue placeholder="All Statuses" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50">
                          <SelectItem value="ALL" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            All Statuses
                          </SelectItem>
                          <SelectItem value="SCHEDULED" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                              Scheduled
                            </span>
                          </SelectItem>
                          <SelectItem value="COMPLETED" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Completed
                            </span>
                          </SelectItem>
                          <SelectItem value="CANCELLED" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              Cancelled
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Clear Filters */}
                      {(schedStatusFilter !== "ALL" || schedDateFilter) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSchedStatusFilter("ALL");
                            setSchedDateFilter("");
                            setSchedPage(1);
                          }}
                          className="h-10 px-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Clear Date & Status Filters"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Clear
                        </Button>
                      )}
                    </div>
                  }
                  columns={[
                    {
                      key: "candidate",
                      label: "Candidate & Round",
                      render: (row) => {
                        const cand = row.candidate || candidates.find(c => String(c.id) === String(row.candidateId));
                        const reHist = getReInterviewHistory(cand);
                        return (
                          <div className="max-w-[180px]">
                            <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
                              {row.candidate?.name || cand?.name || "Candidate"}
                              {reHist.isReInterview && cand?.status !== "SELECTED" && cand?.status !== "ACCEPTED" && cand?.status !== "OFFERED" && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 flex items-center gap-0.5">
                                  <RotateCcw className="w-2.5 h-2.5" /> Re-Interview
                                </span>
                              )}
                              {(row.attemptNumber > 1 || row.isReschedule) && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  Attempt #{row.attemptNumber || 2}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-extrabold uppercase block mt-0.5 truncate">
                              Round: {row.roundName}
                            </span>
                          </div>
                        );
                      },
                    },
                    {
                      key: "panelists",
                      label: "Panelists",
                      render: (row) => {
                        const names = formatPanelistNames(row.panelists, users);
                        if (names.length === 0) return <span className="text-xs text-slate-400">—</span>;
                        return (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {names.map((name, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        );
                      },
                    },
                    {
                      key: "scheduledAt",
                      label: "Scheduled Time",
                      render: (row) => {
                        if (!row.scheduledAt) return <span className="text-xs text-slate-400">—</span>;
                        const d = new Date(row.scheduledAt);
                        return (
                          <div className="text-xs whitespace-nowrap">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block">
                              {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium block">
                              {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      },
                    },
                    {
                      key: "feedbacks",
                      label: "Panel Feedback",
                      sortable: false,
                      render: (row) => row.feedbacks && row.feedbacks.length > 0 ? (
                        <div className="space-y-1.5 max-w-[220px]">
                          {row.feedbacks.map((f, fi) => (
                            <div key={fi} className="text-xs p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate">{f.panelistName}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                    f.recommendation === "SELECT" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : f.recommendation === "REJECT" ? "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                                    : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                  }`}>
                                    {f.recommendation} ({f.rating}/10)
                                  </span>
                                  <button
                                    type="button"
                                    title="Edit Feedback"
                                    onClick={() => {
                                      setFeedbackCandidateId(row.candidateId || "ALL");
                                      const matchedUser = users.find(u => u.name?.toLowerCase() === f.panelistName?.toLowerCase() || String(u.id) === String(f.panelistId));
                                      setNewFeedback({
                                        id: f.id,
                                        scheduleId: row.id,
                                        panelistId: f.panelistId || (matchedUser ? matchedUser.id : ""),
                                        panelistName: f.panelistName || (matchedUser ? matchedUser.name : ""),
                                        rating: f.rating !== undefined && f.rating !== null ? String(f.rating) : "",
                                        comments: f.comments || "",
                                        recommendation: f.recommendation || "",
                                      });
                                      setFormErrors({});
                                    }}
                                    className="p-1 text-slate-400 hover:text-sky-500 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete Feedback"
                                    onClick={() => handleDeleteFeedback(f.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              {f.comments && (
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 italic line-clamp-2 mt-1 break-words">{f.comments}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-slate-400 text-xs italic">No feedback yet</span>,
                    },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase whitespace-nowrap ${
                          row.status === "COMPLETED"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                            : "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-500/20"
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
                          <button
                            onClick={() => {
                              setNewSched({
                                id: row.id,
                                candidateId: String(row.candidateId || row.candidate?.id || ""),
                                roundName: row.roundName || "",
                                scheduledAt: row.scheduledAt || "",
                                panelists: parsePanelistList(row.panelists)
                              });
                              setFormErrors({});
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: row.id, name: `interview round "${row.roundName}" for ${row.candidate?.name || 'candidate'}`, type: "schedule", label: "Interview Schedule" })}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* TAB 4: OFFERS */}
          {activeTab === "offers" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Offer */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-500" />
                    {newOffer.id ? "Edit Offer Letter" : "Generate Offer Letter"}
                  </h3>
                  <form onSubmit={handleSubmitOffer} className="space-y-3" noValidate>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Select Selected Candidate</Label>
                      {(() => {
                        const allCandidatesList = Array.from(new Map(
                          [...candidates, ...dropdownCandidates, ...(offers.map(o => o.candidate).filter(Boolean))]
                            .map(c => [String(c.id), c])
                        ).values());

                        const offerCandOptions = allCandidatesList.filter(c => {
                          const isSelected = c.status === 'SELECTED';
                          const isCurrentEditing = newOffer.id && String(c.id) === String(newOffer.candidateId);
                          const hasExistingOffer = Boolean(c.offer || offers.some(o => String(o.candidateId) === String(c.id)));
                          return isCurrentEditing || (isSelected && !hasExistingOffer);
                        });

                        if (newOffer.candidateId && !offerCandOptions.some(c => String(c.id) === String(newOffer.candidateId))) {
                          const currentOfferObj = offers.find(o => String(o.id) === String(newOffer.id));
                          const foundCand = allCandidatesList.find(c => String(c.id) === String(newOffer.candidateId)) || currentOfferObj?.candidate;
                          if (foundCand) {
                            offerCandOptions.unshift(foundCand);
                          } else {
                            offerCandOptions.unshift({
                              id: newOffer.candidateId,
                              name: "Selected Candidate",
                              status: "SELECTED"
                            });
                          }
                        }

                        return (
                          <Select
                            key={newOffer.id || newOffer.candidateId || 'new-offer-select'}
                            value={newOffer.candidateId || ""}
                            onValueChange={(val) => {
                              const selectedCandId = val;
                              const cand = allCandidatesList.find(c => String(c.id) === String(selectedCandId));
                              const req = cand?.requisition;
                              const replEmp = req?.replacementForEmployee || dropdownEmployees.find(e => String(e.id) === String(req?.replacementForEmployeeId));
                              const salInfo = getEmployeeSalaryInfo(replEmp);

                              setNewOffer({
                                ...newOffer,
                                candidateId: selectedCandId,
                                role: cand ? cand.requisition?.title || newOffer.role : newOffer.role,
                                salary: (!newOffer.salary || newOffer.salary === 0) && salInfo.annualCtc > 0 ? salInfo.annualCtc : newOffer.salary,
                              });
                              if (formErrors.candidateId) setFormErrors({ ...formErrors, candidateId: null });
                              if (salInfo.annualCtc > 0 && (!newOffer.salary || newOffer.salary === 0)) {
                                toast.info(`Pre-filled target salary ₹${salInfo.annualCtc.toLocaleString("en-IN")} based on replaced employee's CTC.`);
                              }
                            }}
                          >
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              {offerCandOptions.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.requisition?.title || "Requisition"}) - {c.status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                      {formErrors.candidateId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.candidateId}</span>}

                      {/* Replacement Salary & Experience Benchmark Comparison Card */}
                      {(() => {
                        const allCandidatesList = Array.from(new Map(
                          [...candidates, ...dropdownCandidates, ...(offers.map(o => o.candidate).filter(Boolean))]
                            .map(c => [String(c.id), c])
                        ).values());
                        const selectedCand = allCandidatesList.find(c => String(c.id) === String(newOffer.candidateId));
                        const req = selectedCand?.requisition;
                        const replEmp = req?.replacementForEmployee || dropdownEmployees.find(e => String(e.id) === String(req?.replacementForEmployeeId));
                        if (!replEmp) return null;

                        const salInfo = getEmployeeSalaryInfo(replEmp);
                        const expDetails = getEmployeeExperienceDetails(replEmp);
                        const offeredSal = Number(newOffer.salary) || 0;
                        const variance = (salInfo.annualCtc > 0 && offeredSal > 0)
                          ? (((offeredSal - salInfo.annualCtc) / salInfo.annualCtc) * 100).toFixed(1)
                          : null;

                        return (
                          <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-xs text-slate-800 dark:text-slate-200 animate-in fade-in">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                <Users className="w-3 h-3 text-amber-600" /> Replacing: {replEmp.firstName} {replEmp.lastName}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">Exp: <strong>{expDetails.totalExp}</strong> <span className="font-normal">(Tenure: {expDetails.companyTenure})</span></span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40">
                              <div>
                                <span className="text-[9.5px] text-slate-400 block font-semibold">PREVIOUS CTC BENCHMARK</span>
                                <span className="font-extrabold text-slate-800 dark:text-white">{salInfo.formattedCtc}</span>
                              </div>
                              {variance !== null && (
                                <div className="text-right">
                                  <span className="text-[9.5px] text-slate-400 block font-semibold">OFFER VARIANCE</span>
                                  <span className={`font-bold text-[11px] ${Number(variance) > 15 ? 'text-amber-600' : Number(variance) < -10 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                    {Number(variance) > 0 ? `+${variance}%` : `${variance}%`} {Number(variance) <= 10 && Number(variance) >= -10 ? '✓ Matched' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Designation / Role Offered</Label>
                      <Input
                        placeholder="e.g. Senior QA Lead"
                        value={newOffer.role}
                        onChange={(e) => {
                          setNewOffer({ ...newOffer, role: e.target.value });
                          if (formErrors.role) setFormErrors({ ...formErrors, role: null });
                        }}
                      />
                      {formErrors.role && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.role}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Annual CTC (INR)</Label>
                      <Input
                        type="number"
                        value={newOffer.salary}
                        onChange={(e) => {
                          setNewOffer({ ...newOffer, salary: Number(e.target.value) });
                          if (formErrors.salary) setFormErrors({ ...formErrors, salary: null });
                        }}
                      />
                      {formErrors.salary && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.salary}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Expected Joining Date</Label>
                      <DateTimePicker 
                        type="date" 
                        date={newOffer.joiningDate} 
                        disablePast={true}
                        setDate={(val) => {
                          setNewOffer({ ...newOffer, joiningDate: val });
                          if (formErrors.joiningDate) setFormErrors({ ...formErrors, joiningDate: null });
                        }} 
                      />
                      {formErrors.joiningDate && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.joiningDate}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {newOffer.id && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setNewOffer({ candidateId: "", role: "", salary: 600000, joiningDate: "" });
                            setFormErrors({});
                          }}
                          className="w-1/3 rounded-xl font-bold"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" className={`bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl ${newOffer.id ? 'w-2/3' : 'w-full'}`}>
                        {newOffer.id ? "Update Offer" : "Generate Offer"}
                      </Button>
                    </div>
                  </form>
                </div>

              {/* Offer Letters DataTable */}
              <div className="lg:col-span-2">
                <DataTable
                  title="Generated Offer Letters"
                  lazy
                  value={offers}
                  totalRecords={totalOffers}
                  page={offerPage}
                  rows={offerRows}
                  loading={loading}
                  search={offerSearch}
                  sortBy={offerSortBy}
                  sortOrder={offerSortOrder}
                  onPageChange={(p) => setOfferPage(p)}
                  onRowsChange={(r) => { setOfferRows(r); setOfferPage(1); }}
                  onSortChange={(k, dir) => { setOfferSortBy(k); setOfferSortOrder(dir); setOfferPage(1); }}
                  onSearchChange={(s) => { setOfferSearch(s); setOfferPage(1); }}
                  emptyMessage="No offer letters generated yet."
                  columns={[
                    {
                      key: "candidate.name",
                      label: "Candidate",
                      render: (row) => {
                        const cand = row.candidate || candidates.find(c => String(c.id) === String(row.candidateId));
                        const req = cand?.requisition;
                        const isReplacement = req?.requisitionType === "REPLACEMENT";
                        const replEmp = req?.replacementForEmployee;
                        return (
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-800 dark:text-white block">{cand?.name}</span>
                            {isReplacement ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                <RotateCcw className="w-2.5 h-2.5" /> Replacement {replEmp ? `for ${replEmp.firstName}` : ''}
                              </span>
                            ) : req?.requisitionType ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                <Sparkles className="w-2.5 h-2.5" /> New Req
                              </span>
                            ) : null}
                            <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">Status: {row.status}</span>
                          </div>
                        );
                      },
                    },
                    {
                      key: "role",
                      label: "Designation",
                      render: (row) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{row.role}</span>,
                    },
                    {
                      key: "salary",
                      label: "Salary CTC",
                      render: (row) => (
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                          ₹{row.salary?.toLocaleString("en-IN")}
                        </span>
                      ),
                    },
                    {
                      key: "joiningDate",
                      label: "Joining Date",
                      render: (row) => (
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {row.joiningDate ? new Date(row.joiningDate).toLocaleDateString() : "—"}
                        </span>
                      ),
                    },
                    {
                      key: "pdf",
                      label: "Document",
                      sortable: false,
                      render: (row) => (
                        <button
                          type="button"
                          onClick={() => setViewOfferModal(row)}
                          className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-extrabold text-xs cursor-pointer bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-3 py-1.5 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View & Print
                        </button>
                      ),
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      sortable: false,
                      render: (row) => (
                        <div className="flex items-center gap-2">
                          {row.status === "GENERATED" && (
                            <button
                              onClick={() => handleAcceptOffer(row.id)}
                              className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-lg text-[9px] px-2 py-1 cursor-pointer transition-all inline-flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Accept
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const candId = row.candidateId || row.candidate?.id || "";
                              setNewOffer({
                                id: row.id,
                                candidateId: candId,
                                role: row.role || row.candidate?.requisition?.title || "",
                                salary: row.salary ?? 600000,
                                joiningDate: row.joiningDate ? String(row.joiningDate).split('T')[0] : ""
                              });
                              setFormErrors({});
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: row.id, name: `offer letter for "${row.candidate?.name || 'candidate'}"`, type: "offer", label: "Offer Letter" })}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* CNV Compliance Modal */}
      {cnvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl relative my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">CNV Compliance</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Vacancy Notification Workflow</p>
                </div>
              </div>
              <button onClick={closeCnvModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Vacancy Info Panel */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Vacancy Details</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="font-semibold text-slate-500">Job Title:</span> <span className="font-bold text-slate-800 dark:text-white">{cnvModal.title}</span></div>
                  <div><span className="font-semibold text-slate-500">Department:</span> <span className="font-bold text-slate-800 dark:text-white">{cnvModal.department?.name || "—"}</span></div>
                  <div><span className="font-semibold text-slate-500">Headcount:</span> <span className="font-bold text-slate-800 dark:text-white">{cnvModal.headcount}</span></div>
                  <div><span className="font-semibold text-slate-500">Type:</span> <span className="font-bold text-slate-800 dark:text-white">{cnvModal.requisitionType === "REPLACEMENT" ? "Replacement" : "New Requirement"}</span></div>
                  {cnvModal.experienceRequired > 0 && <div><span className="font-semibold text-slate-500">Min. Exp:</span> <span className="font-bold text-slate-800 dark:text-white">{cnvModal.experienceRequired} yr(s)</span></div>}
                  <div><span className="font-semibold text-slate-500">Raised By:</span> <span className="font-bold text-slate-800 dark:text-white">{cnvModal.raisedBy}</span></div>
                </div>
                {cnvModal.cnvExchangeOffice && (
                  <div className="text-xs mt-1"><span className="font-semibold text-slate-500">Exchange / Authority:</span> <span className="font-medium text-indigo-700 dark:text-indigo-300">{cnvModal.cnvExchangeOffice}</span></div>
                )}
              </div>

              {/* Workflow Stepper */}
              {(() => {
                const status = cnvData?.cnvStatus || cnvModal.cnvStatus || "PENDING_NOTIFICATION";
                const steps = [
                  { key: "PENDING_NOTIFICATION", label: "Pending", icon: Landmark, color: "amber" },
                  { key: "NOTIFIED", label: "Notified", icon: Send, color: "indigo" },
                  { key: "ACKNOWLEDGED", label: "Acknowledged", icon: CheckCircle, color: "emerald" },
                ];
                const currentIdx = steps.findIndex(s => s.key === status);
                return (
                  <div className="flex items-center justify-between px-2">
                    {steps.map((step, i) => {
                      const isCompleted = i < currentIdx;
                      const isCurrent = i === currentIdx;
                      const StepIcon = step.icon;
                      const colorMap = {
                        amber: { active: "bg-amber-500 text-white border-amber-500", done: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 border-amber-300", inactive: "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700" },
                        indigo: { active: "bg-indigo-500 text-white border-indigo-500", done: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 border-indigo-300", inactive: "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700" },
                        emerald: { active: "bg-emerald-500 text-white border-emerald-500", done: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300", inactive: "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700" },
                      };
                      const cls = isCompleted ? colorMap[step.color].done : isCurrent ? colorMap[step.color].active : colorMap.amber.inactive;
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${cls}`}>
                              <StepIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-[10px] font-bold ${isCurrent ? "text-slate-800 dark:text-white" : isCompleted ? "text-slate-600 dark:text-slate-300" : "text-slate-400"}`}>{step.label}</span>
                          </div>
                          {i < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${isCompleted ? "bg-indigo-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {cnvLoading ? (
                <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Loading CNV details…</span>
                </div>
              ) : (
                <>
                  {/* Action Section */}
                  {cnvSection === "overview" && (() => {
                    const status = cnvData?.cnvStatus || cnvModal.cnvStatus || "PENDING_NOTIFICATION";
                    return (
                      <div className="space-y-3">
                        {/* Current Status Info */}
                        {status === "PENDING_NOTIFICATION" && (
                          <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Vacancy notification has not been submitted to the Employment Exchange / Designated Authority yet.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                type="button"
                                onClick={generateCnvNotificationHandler}
                                disabled={cnvSubmitting}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-9 flex items-center gap-2"
                              >
                                {cnvSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                                Generate & Print CNV Notification
                              </Button>
                              <Button
                                type="button"
                                onClick={() => setCnvSection("submit")}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold h-9 flex items-center gap-2"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Record Submission
                              </Button>
                            </div>
                            {cnvData?.notificationGeneratedAt && (
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Notification generated on {new Date(cnvData.notificationGeneratedAt).toLocaleDateString("en-IN")}
                              </p>
                            )}
                          </div>
                        )}

                        {status === "NOTIFIED" && (
                          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-950/20 p-4 space-y-3">
                            <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                              <Send className="w-4 h-4" />
                              CNV Submitted — Awaiting Acknowledgement
                            </div>
                            {cnvData && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {cnvData.employmentExchangeOffice && <div><span className="font-semibold text-slate-500">Authority:</span> <span className="font-medium text-indigo-700 dark:text-indigo-300">{cnvData.employmentExchangeOffice}</span></div>}
                                {cnvData.notificationDate && <div><span className="font-semibold text-slate-500">Notified On:</span> <span className="font-medium">{new Date(cnvData.notificationDate).toLocaleDateString("en-IN")}</span></div>}
                                {cnvData.submissionMode && <div><span className="font-semibold text-slate-500">Mode:</span> <span className="font-medium">{cnvData.submissionMode.replace("_", " ")}</span></div>}
                                {cnvData.referenceNumber && <div><span className="font-semibold text-slate-500">Ref No.:</span> <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">#{cnvData.referenceNumber}</span></div>}
                              </div>
                            )}
                            <Button
                              type="button"
                              onClick={() => setCnvSection("acknowledge")}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 flex items-center gap-2"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Record Acknowledgement from Authority
                            </Button>
                          </div>
                        )}

                        {status === "ACKNOWLEDGED" && (
                          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2">
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              CNV Compliance Complete — Acknowledged ✓
                            </div>
                            {cnvData && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {cnvData.employmentExchangeOffice && <div><span className="font-semibold text-slate-500">Authority:</span> <span className="font-medium">{cnvData.employmentExchangeOffice}</span></div>}
                                {cnvData.notificationDate && <div><span className="font-semibold text-slate-500">Submitted On:</span> <span className="font-medium">{new Date(cnvData.notificationDate).toLocaleDateString("en-IN")}</span></div>}
                                {cnvData.submissionMode && <div><span className="font-semibold text-slate-500">Mode:</span> <span className="font-medium">{cnvData.submissionMode.replace("_", " ")}</span></div>}
                                {cnvData.referenceNumber && <div><span className="font-semibold text-slate-500">Ref No.:</span> <span className="font-mono font-bold">#{cnvData.referenceNumber}</span></div>}
                                {cnvData.acknowledgementNumber && <div><span className="font-semibold text-slate-500">Ack. No.:</span> <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">#{cnvData.acknowledgementNumber}</span></div>}
                                {cnvData.acknowledgementDate && <div><span className="font-semibold text-slate-500">Ack. Date:</span> <span className="font-medium">{new Date(cnvData.acknowledgementDate).toLocaleDateString("en-IN")}</span></div>}
                                {cnvData.acknowledgedBy && <div className="col-span-2"><span className="font-semibold text-slate-500">Acknowledged By:</span> <span className="font-medium">{cnvData.acknowledgedBy}</span></div>}
                                {cnvData.cnvRemarks && <div className="col-span-2"><span className="font-semibold text-slate-500">Remarks:</span> <span className="font-medium italic text-slate-600 dark:text-slate-400">{cnvData.cnvRemarks}</span></div>}
                              </div>
                            )}
                            {cnvData?.acknowledgementDocumentUrl && (
                              <a href={`${backendUrl}${cnvData.acknowledgementDocumentUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">
                                <FileUp className="w-3.5 h-3.5" />
                                View Acknowledgement Document
                              </a>
                            )}
                          </div>
                        )}

                        {/* CNV History / Audit Trail */}
                        {cnvData?.history && cnvData.history.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <History className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Compliance Audit Trail</span>
                            </div>
                            <div className="space-y-2">
                              {[...cnvData.history].reverse().map((h, i) => {
                                const actionColor = h.action === "ACKNOWLEDGED" || h.action === "ACKNOWLEDGEMENT_RECORDED" ? "emerald"
                                  : h.action === "SUBMISSION_RECORDED" ? "indigo"
                                  : h.action === "NOTIFICATION_GENERATED" ? "sky"
                                  : "slate";
                                const colorMap2 = {
                                  emerald: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
                                  indigo: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400",
                                  sky: "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400",
                                  slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                                };
                                return (
                                  <div key={h.id || i} className="flex gap-3 items-start">
                                    <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${colorMap2[actionColor]}`}>
                                      <ChevronRight className="w-2.5 h-2.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${colorMap2[actionColor]}`}>{h.action.replace(/_/g, " ")}</span>
                                        <span className="text-[9.5px] text-slate-400 dark:text-slate-500">{new Date(h.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                                        {h.performedBy && <span className="text-[9.5px] text-slate-500 dark:text-slate-400">by {h.performedBy}</span>}
                                      </div>
                                      <p className="text-[10.5px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{h.description}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Record Submission Form */}
                  {cnvSection === "submit" && (
                    <form onSubmit={handleCnvSubmit} className="space-y-3" noValidate>
                      <div className="flex items-center gap-2 mb-1">
                        <Send className="w-4 h-4 text-amber-500" />
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Record CNV Submission</h3>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Employment Exchange / Designated Authority <span className="text-rose-500">*</span></Label>
                        <Input
                          placeholder="e.g. District Employment Exchange, Industrial Area"
                          className="h-9 text-xs"
                          value={cnvSubmitForm.employmentExchangeOffice}
                          onChange={e => { setCnvSubmitForm(p => ({ ...p, employmentExchangeOffice: e.target.value })); setCnvFormErrors(p => ({ ...p, employmentExchangeOffice: null })); }}
                        />
                        {cnvFormErrors.employmentExchangeOffice && <span className="text-rose-500 text-[10.5px] font-bold">{cnvFormErrors.employmentExchangeOffice}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Notification Date <span className="text-rose-500">*</span></Label>
                          <DateTimePicker type="date" date={cnvSubmitForm.notificationDate} setDate={val => { setCnvSubmitForm(p => ({ ...p, notificationDate: val })); setCnvFormErrors(p => ({ ...p, notificationDate: null })); }} />
                          {cnvFormErrors.notificationDate && <span className="text-rose-500 text-[10.5px] font-bold">{cnvFormErrors.notificationDate}</span>}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Submission Mode <span className="text-rose-500">*</span></Label>
                          <Select value={cnvSubmitForm.submissionMode} onValueChange={val => { setCnvSubmitForm(p => ({ ...p, submissionMode: val })); setCnvFormErrors(p => ({ ...p, submissionMode: null })); }}>
                            <SelectTrigger className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-full">
                              <SelectValue placeholder="Select mode..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              <SelectItem value="ONLINE_PORTAL">Online Portal</SelectItem>
                              <SelectItem value="EMAIL">Email</SelectItem>
                              <SelectItem value="PHYSICAL">Physical / In-Person</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {cnvFormErrors.submissionMode && <span className="text-rose-500 text-[10.5px] font-bold">{cnvFormErrors.submissionMode}</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Reference No. <span className="text-slate-400 font-normal">(optional)</span></Label>
                          <Input placeholder="e.g. CNV-EE-2026/09" className="h-9 text-xs" value={cnvSubmitForm.referenceNumber} onChange={e => setCnvSubmitForm(p => ({ ...p, referenceNumber: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Submitted By <span className="text-slate-400 font-normal">(optional)</span></Label>
                          <Input placeholder="e.g. HR Manager" className="h-9 text-xs" value={cnvSubmitForm.submittedBy} onChange={e => setCnvSubmitForm(p => ({ ...p, submittedBy: e.target.value }))} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Remarks <span className="text-slate-400 font-normal">(optional)</span></Label>
                        <textarea placeholder="Any additional notes..." className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs h-16 resize-none" value={cnvSubmitForm.cnvRemarks} onChange={e => setCnvSubmitForm(p => ({ ...p, cnvRemarks: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Attach Document <span className="text-slate-400 font-normal">(PDF, max 5MB, optional)</span></Label>
                        <input type="file" accept="application/pdf" className="text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/40 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 w-full" onChange={e => setCnvSubmitFile(e.target.files[0] || null)} />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={() => { setCnvSection("overview"); setCnvFormErrors({}); }} className="flex-1 rounded-xl font-bold text-xs h-9">Cancel</Button>
                        <Button type="submit" disabled={cnvSubmitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs h-9 flex items-center gap-2">
                          {cnvSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Record Submission
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Record Acknowledgement Form */}
                  {cnvSection === "acknowledge" && (
                    <form onSubmit={handleCnvAcknowledge} className="space-y-3" noValidate>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Record Acknowledgement</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Acknowledgement No. <span className="text-rose-500">*</span></Label>
                          <Input placeholder="e.g. EE/ACK/2026/0042" className="h-9 text-xs" value={cnvAckForm.acknowledgementNumber} onChange={e => { setCnvAckForm(p => ({ ...p, acknowledgementNumber: e.target.value })); setCnvFormErrors(p => ({ ...p, acknowledgementNumber: null })); }} />
                          {cnvFormErrors.acknowledgementNumber && <span className="text-rose-500 text-[10.5px] font-bold">{cnvFormErrors.acknowledgementNumber}</span>}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Acknowledgement Date <span className="text-rose-500">*</span></Label>
                          <DateTimePicker type="date" date={cnvAckForm.acknowledgementDate} setDate={val => { setCnvAckForm(p => ({ ...p, acknowledgementDate: val })); setCnvFormErrors(p => ({ ...p, acknowledgementDate: null })); }} />
                          {cnvFormErrors.acknowledgementDate && <span className="text-rose-500 text-[10.5px] font-bold">{cnvFormErrors.acknowledgementDate}</span>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Acknowledged By <span className="text-slate-400 font-normal">(optional)</span></Label>
                        <Input placeholder="e.g. Employment Exchange Officer" className="h-9 text-xs" value={cnvAckForm.acknowledgedBy} onChange={e => setCnvAckForm(p => ({ ...p, acknowledgedBy: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Remarks <span className="text-slate-400 font-normal">(optional)</span></Label>
                        <textarea placeholder="Any additional notes..." className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs h-16 resize-none" value={cnvAckForm.cnvRemarks} onChange={e => setCnvAckForm(p => ({ ...p, cnvRemarks: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Attach Acknowledgement Document <span className="text-slate-400 font-normal">(PDF, max 5MB, optional)</span></Label>
                        <input type="file" accept="application/pdf" className="text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 dark:file:bg-emerald-950/40 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 w-full" onChange={e => setCnvAckFile(e.target.files[0] || null)} />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" onClick={() => { setCnvSection("overview"); setCnvFormErrors({}); }} className="flex-1 rounded-xl font-bold text-xs h-9">Cancel</Button>
                        <Button type="submit" disabled={cnvSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-9 flex items-center gap-2">
                          {cnvSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Record Acknowledgement
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offer Letter Preview & Print Modal */}
      {viewOfferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-4 sm:p-6 max-w-3xl w-full space-y-4 shadow-2xl relative my-auto print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-500" />
                Offer Letter - {viewOfferModal.candidate?.name || 'Preview'}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePrintOfferLetter(viewOfferModal)}
                  className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl text-xs h-8 px-3 gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </Button>
                {viewOfferModal.id && (
                  <Button
                    onClick={() => handleDownloadOfferPdf(viewOfferModal.id)}
                    variant="outline"
                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs h-8 px-3 gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                )}
                <button
                  onClick={() => setViewOfferModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Letterhead Preview Container */}
            <div className="overflow-x-auto">
              <div
                id="printable-offer-letter"
                className="relative bg-white text-slate-900 mx-auto w-full max-w-[650px] min-h-[880px] shadow-sm border border-slate-200 rounded-lg flex flex-col justify-between overflow-hidden font-sans text-[11px] leading-[1.42] select-text"
              >
                {/* Center Watermark */}
                <img
                  src="/aspino-logo.png"
                  alt="Watermark"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] opacity-[0.06] pointer-events-none select-none z-0"
                />

                {/* Top Section */}
                <div className="relative z-10">
                  {/* Top Header Shapes */}
                  <div className="relative w-full h-[32px]">
                    <div className="absolute top-0 left-0 w-[160px] h-[24px] bg-[#1b75bb] rounded-br-[24px]"></div>
                    <svg className="absolute top-0 right-0 w-[100px] h-[95px]" viewBox="0 0 120 115" fill="none">
                      <path d="M120 0C100 35 60 25 40 50C25 68 35 90 60 115C75 98 70 78 85 62C105 40 115 20 120 0Z" fill="#38bdf8" fillOpacity="0.85"/>
                      <path d="M120 10C105 45 70 38 50 62C35 80 45 98 70 115C60 98 55 82 70 70C90 50 110 32 120 10Z" fill="#1b75bb"/>
                      <path d="M120 22C110 50 78 48 62 70C48 88 58 102 78 115C68 100 64 86 78 76C96 60 112 40 120 22Z" fill="#173660"/>
                    </svg>
                  </div>

                  {/* Logo Row */}
                  <div className="px-7 pt-0">
                    <div className="flex justify-between items-end pb-3">
                      <img src="/aspino-logo.png" alt="Aspino Logo" className="w-[125px] h-auto select-none" />
                      <div className="text-[8.5px] font-bold text-slate-800 tracking-wider pb-0.5">
                        CIN: U20297GJ2024PTC150782
                      </div>
                    </div>
                  </div>

                  {/* Letter Body */}
                  <div className="px-7 space-y-3">
                    {/* Recipient & Reference Meta */}
                    <div className="text-[11px] leading-tight space-y-0.5 text-slate-800">
                      <div className="font-medium text-slate-900">
                        Ref.ASCPL/OL-{new Date().getFullYear()}-{String(viewOfferModal.id || '1').slice(-3).padStart(3, '0')}
                      </div>
                      <div className="text-slate-700">
                        Dt. {formatOfferDate(viewOfferModal.createdAt || new Date())}
                      </div>
                      <div className="font-medium text-slate-900 pt-1">
                        Mr./ Miss {viewOfferModal.candidate?.name || "Ravi Babariya"},
                      </div>
                      <div className="text-slate-700">{viewOfferModal.candidate?.address || "Dadri, Kosamba Tarsadi"}</div>
                      <div className="text-slate-700">{viewOfferModal.candidate?.city || "Surat"}</div>
                      <div className="text-slate-700">{viewOfferModal.candidate?.state || "Gujarat- 394 120"}</div>
                    </div>

                    {/* Centered Document Title */}
                    <div className="text-center font-black underline text-sm tracking-wider text-[#162a55] py-1.5">
                      OFFER LETTER
                    </div>

                    {/* Introductory statement */}
                    <p className="text-[10.5px] font-bold text-justify leading-relaxed text-[#162a55]">
                      This has reference to your application and the subsequent interview you had with us, we are pleased to confirm our decision wherein we have mutually agreed upon the following:
                    </p>

                    {/* Numbered Terms */}
                    <ol className="space-y-1.5 text-[10.5px] leading-relaxed text-slate-800 list-none pl-0">
                      <li>
                        <strong>1.</strong> You shall be designated as &quot;<strong>{(viewOfferModal.role || "PACKING SUPERVISOR").toUpperCase()}</strong>&quot;.
                      </li>
                      <li>
                        <strong>2.</strong> {viewOfferModal.salary ? `Your annual salary package shall be mutually agreed at Rs. ${Number(viewOfferModal.salary).toLocaleString('en-IN')}/- per annum at the time of an Interview.` : "Your annual salary package shall be mutually agreed at the time of an Interview."}
                      </li>
                      <li>
                        <strong>3.</strong> Acceptance of the offer would automatically bind you to agree with all the terms and conditions of the employment as discussed during the interview.
                      </li>
                      <li>
                        <strong>4.</strong> You will come to finish all formalities and collect appointment letter on or before <strong>{formatJoiningDateFull(viewOfferModal.joiningDate || new Date())}</strong>
                      </li>
                    </ol>

                    {/* Document Checklist */}
                    <div className="pt-1">
                      <div className="font-bold text-[10.5px] text-[#162a55] mb-1">
                        Kindly bring the following documents on the date of joining:
                      </div>
                      <ul className="space-y-0.5 text-[10px] text-slate-700 list-none pl-0">
                        <li className="relative pl-3 before:content-['-'] before:absolute before:left-0 before:font-bold">
                          Copies of all education certificates for the purpose of admitting the date of birth and all mark sheets of all academic qualifications and achievements.
                        </li>
                        <li className="relative pl-3 before:content-['-'] before:absolute before:left-0 before:font-bold">
                          Copy Experience Certificates
                        </li>
                        <li className="relative pl-3 before:content-['-'] before:absolute before:left-0 before:font-bold">
                          Proof of past employments.
                        </li>
                        <li className="relative pl-3 before:content-['-'] before:absolute before:left-0 before:font-bold">
                          Relieving letter from your current employer
                        </li>
                        <li className="relative pl-3 before:content-['-'] before:absolute before:left-0 before:font-bold">
                          Photocopy of last salary slip.
                        </li>
                        <li className="relative pl-3 before:content-['-'] before:absolute before:left-0 before:font-bold">
                          Four copies of passport size photographs
                        </li>
                        <li className="relative pl-3 before:content-['-'] before:absolute before:left-0 before:font-bold">
                          Photocopy of driving license and your blood group details
                        </li>
                        <li className="relative pl-3 before:content-['-'] before:absolute before:left-0 before:font-bold">
                          Two References.
                        </li>
                      </ul>
                    </div>

                    {/* Closing statement */}
                    <p className="text-[10.5px] text-justify leading-relaxed text-slate-800 pt-0.5">
                      With best wishes for an enjoyable, exciting and prosperous career association with Aspino Specialty Chemicals Private Limited.
                    </p>

                    {/* Sign-off */}
                    <div className="pt-1 text-[10.5px] space-y-1 text-slate-800">
                      <div className="font-bold text-[#162a55]">Thankfully yours,</div>
                      <div className="font-bold text-[#162a55]">For Aspino Speciality Chemicals Pvt.Ltd.</div>
                    </div>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="relative z-10 w-full mt-4">
                  <div className="px-7 pb-2 text-[8.5px] font-bold text-slate-800 flex items-center justify-center gap-1">
                    <span>Registered office</span>
                    <span>📍</span>
                    <span>SRN-271,BLK-314, Nakoda Road, Ta-Mangrol, Hathuran, Surat, 394125, Gujarat - India.</span>
                  </div>
                  <div className="bg-[#173660] text-white px-7 py-2.5 flex justify-between items-center text-[8.5px] font-medium tracking-tight">
                    <span>📞 +91 98259 57173</span>
                    <span>✉ info@aspinochemicals.com</span>
                    <span>🌐 www.aspinochemicals.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
