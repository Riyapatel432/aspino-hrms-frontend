"use client";

import { useEffect, useState } from "react";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
  Eye
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
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]); // Might need a RTK hook for users if we care

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

  const [schedPage, setSchedPage] = useState(1);
  const [schedRows, setSchedRows] = useState(10);
  const [schedSearch, setSchedSearch] = useState("");
  const [schedSortBy, setSchedSortBy] = useState("scheduledAt");
  const [schedSortOrder, setSchedSortOrder] = useState("desc");

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
    dispatch(fetchCandidates({ page: candPage, limit: candRows, search: candSearch, sortBy: candSortBy, sortOrder: candSortOrder }));
  }, [dispatch, activeTab, candPage, candRows, candSearch, candSortBy, candSortOrder]);

  useEffect(() => {
    if (activeTab !== "interviews") return;
    dispatch(fetchSchedules({ page: schedPage, limit: schedRows, search: schedSearch, sortBy: schedSortBy, sortOrder: schedSortOrder }));
  }, [dispatch, activeTab, schedPage, schedRows, schedSearch, schedSortBy, schedSortOrder]);

  useEffect(() => {
    if (activeTab !== "offers") return;
    dispatch(fetchOffers({ page: offerPage, limit: offerRows, search: offerSearch, sortBy: offerSortBy, sortOrder: offerSortOrder }));
  }, [dispatch, activeTab, offerPage, offerRows, offerSearch, offerSortBy, offerSortOrder]);

  const [dropdownRequisitions, setDropdownRequisitions] = useState([]);
  const [dropdownCandidates, setDropdownCandidates] = useState([]);

  // Departments: needed on Job Requisitions tab (form dropdown)
  useEffect(() => {
    if (activeTab !== "requisitions") return;
    dispatch(fetchDepartments());
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
  const [newReq, setNewReq] = useState({ title: "", departmentId: "", headcount: "", justification: "", raisedBy: "" });
  // Candidate Form State
  const [newCand, setNewCand] = useState({ name: "", email: "", phone: "", source: "", requisitionId: "", resumeUrl: "" });
  const [uploadingFile, setUploadingFile] = useState(false);
  // Schedule Form State
  const [newSched, setNewSched] = useState({ candidateId: "", roundName: "", scheduledAt: "", panelists: "" });
  // Feedback Form State
  const [newFeedback, setNewFeedback] = useState({ id: "", scheduleId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
  const [feedbackCandidateId, setFeedbackCandidateId] = useState("ALL");
  // Offer Form State
  const [newOffer, setNewOffer] = useState({ candidateId: "", role: "", salary: "", joiningDate: "" });

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, type, label }
  const [deleting, setDeleting] = useState(false);
  
  // Edit States
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);

  const [formErrors, setFormErrors] = useState({});

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";



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
    
    if (!newReq.justification?.trim()) errs.justification = "Justification / business reason is required.";
    else if (newReq.justification.trim().length < 10) errs.justification = "Justification must be at least 10 characters.";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCandidate = () => {
    const errs = {};
    if (!newCand.name?.trim()) errs.name = "Candidate full name is required.";
    else if (newCand.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    else if (/\d/.test(newCand.name)) errs.name = "Numbers are not allowed in full name.";
    
    if (!newCand.email?.trim()) errs.email = "Email address is required.";
    else {
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(newCand.email)) errs.email = "Please provide a valid email address.";
    }
    
    if (!newCand.phone?.trim()) {
      errs.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(newCand.phone.trim())) {
      errs.phone = "Phone number must be exactly 10 digits.";
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
      const cand = candidates.find(c => String(c.id) === String(newSched.candidateId));
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
    if (!newSched.scheduledAt) errs.scheduledAt = "Interview date and time is required.";
    else if (new Date(newSched.scheduledAt) < new Date()) {
      errs.scheduledAt = "Interview date and time cannot be in the past.";
    }
    const panelistsList = Array.isArray(newSched.panelists)
      ? newSched.panelists
      : typeof newSched.panelists === 'string'
      ? newSched.panelists.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    if (panelistsList.length === 0) errs.panelists = "At least one panelist is required.";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateFeedback = () => {
    const errs = {};
    if (!newFeedback.scheduleId) errs.scheduleId = "Please select an interview schedule.";
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
            headcount: Number(newReq.headcount),
            justification: newReq.justification
          })
        });
        if (res.ok) {
          dispatch(fetchRequisitions());
          setNewReq({ title: "", departmentId: "", headcount: "", justification: "", raisedBy: "" });
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
          raisedBy: newReq.raisedBy?.trim() || "HR Manager",
        })).unwrap();
        dispatch(fetchRequisitions({ page: reqPage, limit: reqRows, search: reqSearch, sortBy: reqSortBy, sortOrder: reqSortOrder }));
        setNewReq({ title: "", departmentId: "", headcount: "", justification: "", raisedBy: "" });
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
          setNewReq({ title: "", departmentId: "", headcount: "", justification: "", raisedBy: "" });
          setFormErrors({});
        }
        dispatch(fetchRequisitions());
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
            name: newCand.name,
            email: newCand.email,
            phone: newCand.phone,
            resumeUrl: newCand.resumeUrl || undefined,
          })
        });
        if (res.ok) {
          dispatch(fetchCandidates());
          setNewCand({ name: "", email: "", phone: "", source: "", requisitionId: "", resumeUrl: "" });
          toast.success("Candidate updated successfully");
        } else {
          const msg = await getErrorMessage(res, "Failed to update candidate");
          toast.error(msg);
        }
      } else {
        // Create mode
        await dispatch(createCandidate({
          ...newCand,
          source: newCand.source || "Portal",
        })).unwrap();
        setNewCand({ name: "", email: "", phone: "", source: "", requisitionId: "", resumeUrl: "" });
        const fileInput = document.getElementById("resume-upload-input");
        if (fileInput) fileInput.value = "";
        toast.success("Candidate added successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : (newCand.id ? "Failed to update candidate" : "Failed to add candidate"));
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
        dispatch(fetchCandidates());
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
      const panelistsPayload = Array.isArray(newSched.panelists)
        ? (newSched.panelists.length > 0 ? newSched.panelists.join(', ') : "")
        : (typeof newSched.panelists === 'string' ? newSched.panelists : "");
      if (newSched.id) {
        // Edit mode
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/schedules/${newSched.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: newSched.candidateId,
            roundName: newSched.roundName,
            scheduledAt: newSched.scheduledAt,
            panelists: panelistsPayload
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
          panelists: panelistsPayload,
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
            rating: Number(newFeedback.rating),
            comments: newFeedback.comments,
            recommendation: newFeedback.recommendation,
          }),
        });
        if (res.ok) {
          setNewFeedback({ id: "", scheduleId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
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
          setNewFeedback({ id: "", scheduleId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
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

  const handlePrintOfferLetter = (offer) => {
    if (!offer) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to print/download offer letter");
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offer Letter - ${offer.candidate?.name || 'Candidate'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0.8cm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 0;
              color: #0f172a;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .offer-card {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 32px;
              max-width: 720px;
              margin: 0 auto;
              background: #ffffff;
              box-sizing: border-box;
            }
            .header-title {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 16px;
            }
            .header-title h1 {
              margin: 0;
              font-size: 22px;
              color: #0f172a;
              font-weight: 900;
              letter-spacing: 1px;
            }
            .header-title p.subtitle {
              margin: 4px 0 0 0;
              font-size: 11px;
              font-weight: bold;
              color: #0ea5e9;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header-title p.address {
              margin: 4px 0 0 0;
              font-size: 10px;
              color: #64748b;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              font-size: 11.5px;
              margin-bottom: 20px;
            }
            .subject-box {
              background: #f8fafc;
              border-left: 4px solid #0ea5e9;
              padding: 10px 14px;
              border-radius: 0 8px 8px 0;
              margin-bottom: 20px;
              font-size: 11.5px;
              font-weight: bold;
              color: #0f172a;
            }
            .body-text {
              font-size: 11.5px;
              line-height: 1.6;
              color: #334155;
              text-align: justify;
              margin-bottom: 20px;
            }
            .body-text p {
              margin: 0 0 12px 0;
            }
            .table-title {
              font-weight: bold;
              font-size: 11.5px;
              margin-bottom: 8px;
              color: #0f172a;
            }
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11.5px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            .details-table td {
              padding: 9px 14px;
              border-bottom: 1px solid #e2e8f0;
            }
            .details-table tr:nth-child(odd) {
              background: #f8fafc;
            }
            .details-table tr:nth-child(even) {
              background: #ffffff;
            }
            .details-table td.label {
              font-weight: bold;
              color: #475569;
              width: 42%;
            }
            .details-table td.val {
              font-weight: bold;
              color: #0f172a;
            }
            .terms-section {
              font-size: 11px;
              color: #475569;
              margin-bottom: 35px;
            }
            .terms-section h4 {
              margin: 0 0 8px 0;
              font-size: 11.5px;
              color: #0f172a;
              font-weight: bold;
            }
            .terms-section ol {
              margin: 0;
              padding-left: 18px;
            }
            .terms-section li {
              margin-bottom: 6px;
              text-align: justify;
              line-height: 1.5;
            }
            .sig-grid {
              display: flex;
              justify-content: space-between;
              margin-top: 35px;
              font-size: 11.5px;
            }
            .sig-col {
              width: 45%;
            }
            .sig-line {
              border-top: 1px solid #cbd5e1;
              margin-top: 45px;
              padding-top: 4px;
              font-weight: bold;
              color: #0f172a;
            }
            .sig-sub {
              font-size: 10.5px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="offer-card">
            <div class="header-title">
              <h1>ASPINO CHEMICALS CORP</h1>
              <p class="subtitle">GMP Certified Pharmaceutical & Chemical Unit</p>
              <p class="address">HQ: Industrial Estate, Sector 5, India | Email: hr@aspinochemicals.com</p>
            </div>
            <div class="meta-row">
              <div>
                <strong>To,</strong><br/>
                <strong style="font-size: 13px; color: #0f172a;">${offer.candidate?.name || ''}</strong><br/>
                <span style="color: #64748b;">Email: ${offer.candidate?.email || ''}</span>
              </div>
              <div>
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div class="subject-box">
              Subject: Appointment & Offer of Employment
            </div>
            <div class="body-text">
              <p>Dear ${offer.candidate?.name || ''},</p>
              <p>We are pleased to extend to you a formal offer of employment for the position of <strong>${offer.role || ''}</strong> at Aspino Chemicals Corp. Following our comprehensive interview process and review of your professional accomplishments, we are confident that your technical expertise, qualifications, and industry knowledge will make a substantial contribution to the success and strategic objectives of our organization.</p>
              <p>Under this appointment, your Annual CTC (Cost to Company) will be <strong>Rs. ${Number(offer.salary || 0).toLocaleString('en-IN')} per annum</strong>, subject to statutory deductions as applicable. The detailed breakdown and joining requirements are outlined below.</p>
            </div>
            <div class="table-title">Position Details:</div>
            <table class="details-table">
              <tr>
                <td class="label">Offered Designation</td>
                <td class="val">${offer.role || ''}</td>
              </tr>
              <tr>
                <td class="label">Annual CTC (INR)</td>
                <td class="val">Rs. ${Number(offer.salary || 0).toLocaleString('en-IN')} / annum</td>
              </tr>
              <tr>
                <td class="label">Expected Joining Date</td>
                <td class="val">${offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
              </tr>
            </table>
            <div class="terms-section">
              <h4>Terms & Conditions:</h4>
              <ol>
                <li><strong>Credential Verification:</strong> This offer of employment is contingent upon successful completion of background checks, reference verifications, and submission of academic & professional credentials.</li>
                <li><strong>Probationary Period:</strong> Upon commencement, you will undergo a probationary period of six (6) months. Confirmation is subject to satisfactory performance appraisals.</li>
                <li><strong>Acceptance of Offer:</strong> Please indicate formal acceptance by signing and returning the duplicate copy of this letter on or before your scheduled joining date.</li>
              </ol>
            </div>
            <div class="sig-grid">
              <div class="sig-col">
                <strong>Sincerely,</strong>
                <div class="sig-line">Authorized Signatory</div>
                <div class="sig-sub">HR Director, Aspino Chemicals Corp</div>
              </div>
              <div class="sig-col">
                <strong>Accepted & Agreed,</strong>
                <div class="sig-line">Candidate Signature & Date</div>
                <div class="sig-sub">${offer.candidate?.name || ''}</div>
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
                    <Select value={newReq.departmentId} onValueChange={(val) => {
                      setNewReq({ ...newReq, departmentId: val });
                      if (formErrors.departmentId) setFormErrors({ ...formErrors, departmentId: null });
                    }}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {departments.filter(dept => dept.isActive !== false || (newReq.id && String(dept.id) === String(newReq.departmentId))).map((dept) => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.departmentId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.departmentId}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Headcount Required</Label>
                    <Input
                      type="number"
                      value={newReq.headcount}
                      onChange={(e) => {
                        setNewReq({ ...newReq, headcount: Number(e.target.value) });
                        if (formErrors.headcount) setFormErrors({ ...formErrors, headcount: null });
                      }}
                    />
                    {formErrors.headcount && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.headcount}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Justification</Label>
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
                  <div className="flex gap-2 mt-2">
                    {newReq.id && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setNewReq({ title: "", departmentId: departments[0]?.id || "", headcount: 1, justification: "", raisedBy: "HR Manager" });
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
                      label: "Job Title",
                      render: (row) => (
                        <div>
                          <span className="text-sm font-bold text-slate-800 dark:text-white block">{row.title}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[220px]">{row.justification}</span>
                        </div>
                      ),
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setNewReq({
                                id: row.id,
                                title: row.title,
                                departmentId: row.departmentId,
                                headcount: row.headcount,
                                justification: row.justification,
                                raisedBy: row.raisedBy
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
                      )
                    }
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
                          <SelectItem key={r.id} value={String(r.id)}>{r.title} ({r.department?.name || "Unknown"})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.requisitionId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.requisitionId}</span>}
                  </div>
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
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Resume / CV (PDF)</Label>
                    {newCand.id && newCand.resumeUrl && (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                        <a
                          href={`${backendUrl}${newCand.resumeUrl}`}
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
                          setNewCand({ name: "", email: "", phone: "", source: "Portal", requisitionId: "", resumeUrl: "" });
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
                            <span className="text-[10px] text-slate-400 font-bold block">Source: {row.source}</span>
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
                      render: (row) => (
                        <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                          {row.requisition?.title || "Unknown"}
                        </span>
                      ),
                    },
                    {
                      key: "resumeUrl",
                      label: "Resume",
                      sortable: false,
                      render: (row) => row.resumeUrl ? (
                        <a
                          href={`${backendUrl}${row.resumeUrl}`}
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
                                  phone: row.phone,
                                  source: row.source,
                                  requisitionId: row.requisitionId || "",
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
                      <Select value={newSched.candidateId} onValueChange={(val) => {
                        setNewSched({ ...newSched, candidateId: val });
                        if (formErrors.candidateId) setFormErrors({ ...formErrors, candidateId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {candidates.filter(c => c.status !== 'SELECTED' && c.status !== 'ACCEPTED').map((c) => {
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
                      {formErrors.candidateId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.candidateId}</span>}
                    </div>

                    {newSched.candidateId && (() => {
                      const selCand = candidates.find(c => String(c.id) === String(newSched.candidateId));
                      if (!selCand) return null;
                      const coolOff = getCandidateCoolOffInfo(selCand);
                      const reHist = getReInterviewHistory(selCand);
                      const dbDaysLeft = selCand.coolOffDaysLeft ?? (coolOff.isCoolingOff ? coolOff.daysLeft : 0);
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
                      <DateTimePicker
                        date={newSched.scheduledAt}
                        disablePast={true}
                        setDate={(val) => {
                          setNewSched({ ...newSched, scheduledAt: val });
                          if (formErrors.scheduledAt) setFormErrors({ ...formErrors, scheduledAt: null });
                        }}
                      />
                      {formErrors.scheduledAt && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.scheduledAt}</span>}
                    </div>
                    {/* Panel Members (Multi-Select) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Panel Members (Multi-Select)
                      </Label>
                      {(() => {
                        const selectedUserIds = Array.isArray(newSched.panelists)
                          ? newSched.panelists
                          : (typeof newSched.panelists === 'string'
                            ? (newSched.panelists.trim().startsWith('[')
                              ? ( () => { try { return JSON.parse(newSched.panelists); } catch(e) { return []; } } )()
                              : newSched.panelists.split(',').map((s) => s.trim()).filter(Boolean))
                            : []);
                        return (
                          <>
                            {selectedUserIds.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                                {selectedUserIds.map((uId) => {
                                  const userObj = users.find((u) => String(u.id) === String(uId) || u.name === uId);
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
                      <Select value={feedbackCandidateId} onValueChange={(val) => { setFeedbackCandidateId(val); setNewFeedback({ ...newFeedback, scheduleId: "" }); }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="All Candidates" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="ALL">All Candidates</SelectItem>
                          {candidates.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Select Schedule</Label>
                      <Select value={newFeedback.scheduleId} onValueChange={(val) => {
                        const selSched = schedules.find(s => String(s.id) === String(val));
                        let assigned = [];
                        if (selSched?.panelists) {
                          if (Array.isArray(selSched.panelists)) assigned = selSched.panelists;
                          else if (typeof selSched.panelists === 'string') {
                            const trimmed = selSched.panelists.trim();
                            if (trimmed.startsWith('[')) { try { assigned = JSON.parse(trimmed); } catch(e) {} }
                            else { assigned = trimmed.split(',').map(s => s.trim()).filter(Boolean); }
                          }
                        }
                        const firstUser = users.find(u => String(u.id) === String(assigned[0]) || u.name === assigned[0]);
                        setNewFeedback({
                          ...newFeedback,
                          scheduleId: val,
                          panelistName: firstUser ? firstUser.name : (assigned[0] || "")
                        });
                        if (formErrors.scheduleId) setFormErrors({ ...formErrors, scheduleId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select a schedule..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {schedules
                            .filter(s => feedbackCandidateId === 'ALL' || s.candidateId === feedbackCandidateId)
                            .map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.candidate?.name} - {s.roundName} ({new Date(s.scheduledAt).toLocaleDateString()})
                              </SelectItem>
                            ))}
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
                        let assignedIdsOrNames = [];
                        if (currentSchedule?.panelists) {
                          if (Array.isArray(currentSchedule.panelists)) assignedIdsOrNames = currentSchedule.panelists;
                          else if (typeof currentSchedule.panelists === 'string') {
                            const trimmed = currentSchedule.panelists.trim();
                            if (trimmed.startsWith('[')) { try { assignedIdsOrNames = JSON.parse(trimmed); } catch(e) {} }
                            else { assignedIdsOrNames = trimmed.split(',').map(s => s.trim()).filter(Boolean); }
                          }
                        }

                        const panelistOptions = assignedIdsOrNames.map((item) => {
                          const userMatch = users.find((u) => String(u.id) === String(item) || u.name?.toLowerCase() === item.toLowerCase());
                          return {
                            id: userMatch ? userMatch.id : item,
                            name: userMatch ? userMatch.name : item,
                            role: userMatch?.role ? userMatch.role.toUpperCase() : "PANELIST",
                          };
                        });

                        let selectedPanelistValue = newFeedback.panelistName || "";

                        if (newFeedback.panelistName) {
                          const exactOrPartialMatch = panelistOptions.find(p => 
                            p.name.toLowerCase() === newFeedback.panelistName.toLowerCase() ||
                            p.name.toLowerCase().includes(newFeedback.panelistName.toLowerCase()) ||
                            newFeedback.panelistName.toLowerCase().includes(p.name.toLowerCase())
                          );
                          if (exactOrPartialMatch) {
                            selectedPanelistValue = exactOrPartialMatch.name;
                          } else {
                            panelistOptions.unshift({
                              id: newFeedback.panelistName,
                              name: newFeedback.panelistName,
                              role: "PANELIST",
                            });
                            selectedPanelistValue = newFeedback.panelistName;
                          }
                        }

                        return (
                          <Select
                            disabled={!newFeedback.scheduleId}
                            value={selectedPanelistValue}
                            onValueChange={(val) => {
                              setNewFeedback({ ...newFeedback, panelistName: val });
                              if (formErrors.panelistName) setFormErrors({ ...formErrors, panelistName: null });
                            }}
                          >
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                              <SelectValue placeholder={!newFeedback.scheduleId ? "Select a schedule first" : "Select assigned panelist..."} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                              {panelistOptions.length > 0 ? (
                                panelistOptions.map((p) => (
                                  <SelectItem key={p.id} value={p.name}>
                                    {p.name} ({p.role})
                                  </SelectItem>
                                ))
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
                            setNewFeedback({ id: "", scheduleId: "", panelistName: "", rating: "", comments: "", recommendation: "" });
                            setFormErrors({});
                          }}
                          className="w-1/3 rounded-xl font-bold"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" className={`bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl ${newFeedback.id ? 'w-2/3' : 'w-full'}`}>
                        {newFeedback.id ? "Update Feedback" : "Submit Recommendation"}
                      </Button>
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
                  columns={[
                    {
                      key: "candidate",
                      label: "Candidate & Round",
                      render: (row) => {
                        const cand = row.candidate || candidates.find(c => String(c.id) === String(row.candidateId));
                        const reHist = getReInterviewHistory(cand);
                        return (
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 flex-wrap">
                              {row.candidate?.name}
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
                            <span className="text-[10px] text-sky-500 font-extrabold uppercase block mt-0.5">Round: {row.roundName}</span>
                          </div>
                        );
                      },
                    },
                    {
                      key: "panelists",
                      label: "Panelists",
                      render: (row) => {
                        if (!row.panelists) return <span className="text-xs text-slate-400">—</span>;
                        let items = [];
                        if (Array.isArray(row.panelists)) items = row.panelists;
                        else if (typeof row.panelists === 'string') {
                          const trimmed = row.panelists.trim();
                          if (trimmed.startsWith('[')) { try { items = JSON.parse(trimmed); } catch(e) {} }
                          else { items = trimmed.split(',').map(s => s.trim()).filter(Boolean); }
                        }
                        const names = items.map((item) => {
                          const found = users.find((u) => String(u.id) === String(item) || u.name?.toLowerCase() === item.toLowerCase());
                          return found ? found.name : item;
                        }).filter(Boolean);

                        if (names.length === 0) return <span className="text-xs text-slate-400">—</span>;

                        const chunkSize = 2;
                        const chunks = [];
                        for (let i = 0; i < names.length; i += chunkSize) {
                          chunks.push(names.slice(i, i + chunkSize).join(', '));
                        }

                        return (
                          <div className="flex flex-col gap-0.5">
                            {chunks.map((chunk, idx) => (
                              <span key={idx} className="text-xs font-semibold text-slate-600 dark:text-slate-300 block leading-tight">
                                {chunk}
                              </span>
                            ))}
                          </div>
                        );
                      },
                    },
                    {
                      key: "scheduledAt",
                      label: "Scheduled Time",
                      render: (row) => (
                        <span className="text-xs text-slate-600 dark:text-slate-300">{new Date(row.scheduledAt).toLocaleString()}</span>
                      ),
                    },
                    {
                      key: "feedbacks",
                      label: "Panel Feedback",
                      sortable: false,
                      render: (row) => row.feedbacks && row.feedbacks.length > 0 ? (
                        <div className="space-y-1.5">
                          {row.feedbacks.map((f, fi) => (
                            <div key={fi} className="text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 space-y-0.5">
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-extrabold text-slate-700 dark:text-slate-200">{f.panelistName}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                    f.recommendation === "SELECT" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                    : f.recommendation === "REJECT" ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                                    : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                  }`}>
                                    {f.recommendation} ({f.rating}/10)
                                  </span>
                                  <button
                                    type="button"
                                    title="Edit Feedback"
                                    onClick={() => {
                                      setFeedbackCandidateId(row.candidateId || "ALL");
                                      setNewFeedback({
                                        id: f.id,
                                        scheduleId: row.id,
                                        panelistName: f.panelistName,
                                        rating: f.rating !== undefined && f.rating !== null ? String(f.rating) : "",
                                        comments: f.comments || "",
                                        recommendation: f.recommendation || "",
                                      });
                                      setFormErrors({});
                                    }}
                                    className="p-1 text-slate-400 hover:text-sky-500 rounded-md transition-colors"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              {f.comments && (
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 italic line-clamp-2 mt-1">{f.comments}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : <span className="text-slate-400 text-xs">Pending</span>,
                    },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => (
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                          row.status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500 dark:bg-emerald-600/10 dark:text-emerald-400 dark:border-emerald-50 dark:border-emerald-500/200/20"
                          : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20 dark:bg-blue-50 dark:bg-blue-500/100/10 dark:text-blue-400 dark:border-blue-50 dark:border-blue-500/200/20"
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
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => {
                              setNewSched({
                                id: row.id,
                                candidateId: row.candidateId,
                                roundName: row.roundName,
                                scheduledAt: row.scheduledAt,
                                panelists: Array.isArray(row.panelists) ? row.panelists : (typeof row.panelists === 'string' ? (row.panelists.trim().startsWith('[') ? JSON.parse(row.panelists) : row.panelists.split(',').map(s => s.trim()).filter(Boolean)) : [])
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: row.id, name: `interview round "${row.roundName}" for ${row.candidate?.name || 'candidate'}`, type: "schedule", label: "Interview Schedule" })}
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
                              setNewOffer({
                                ...newOffer,
                                candidateId: selectedCandId,
                                role: cand ? cand.requisition?.title || newOffer.role : newOffer.role
                              });
                              if (formErrors.candidateId) setFormErrors({ ...formErrors, candidateId: null });
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
                        return (
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white block">{cand?.name}</span>
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

      {/* Offer Letter Preview & Print Modal */}
      {viewOfferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <style>{`
            @media print {
              @page {
                size: A4 portrait !important;
                margin: 0.8cm !important;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-offer-letter, #printable-offer-letter * {
                visibility: visible !important;
              }
              #printable-offer-letter {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: black !important;
                border: none !important;
                box-shadow: none !important;
              }
            }
          `}</style>

          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl relative print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-500" />
                Offer Letter Preview
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePrintOfferLetter(viewOfferModal)}
                  className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl text-xs h-9 px-4 gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </Button>
                <button
                  onClick={() => setViewOfferModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Printable Single-Page Letter Card */}
            <div id="printable-offer-letter" className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 space-y-6 text-slate-800 dark:text-slate-100 font-sans print:border-none print:p-0 print:space-y-4">
              {/* Header Bar */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                  ASPINO CHEMICALS CORP
                </h1>
                <p className="text-xs font-bold text-sky-600 dark:text-sky-400 tracking-wider uppercase">
                  GMP Certified Pharmaceutical & Chemical Unit
                </p>
                <p className="text-[11px] text-slate-400">
                  HQ: Industrial Estate, Sector 5, India | Email: hr@aspinochemicals.com
                </p>
              </div>

              {/* Date & Candidate Details */}
              <div className="flex justify-between items-start text-xs font-medium pt-2">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">To,</p>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {viewOfferModal.candidate?.name}
                  </p>
                  <p className="text-slate-500">Email: {viewOfferModal.candidate?.email}</p>
                </div>
                <p className="text-slate-500 font-bold">
                  Date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Subject */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border-l-4 border-sky-500 rounded-r-xl">
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  Subject: Appointment & Offer of Employment
                </p>
              </div>

              {/* Body */}
              <div className="text-xs space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                <p>Dear {viewOfferModal.candidate?.name},</p>
                <p>
                  We are pleased to extend to you a formal offer of employment for the position of{" "}
                  <strong className="text-slate-900 dark:text-white">{viewOfferModal.role}</strong> at Aspino Chemicals Corp. Following our comprehensive interview process and review of your professional accomplishments, we are confident that your technical expertise, qualifications, and industry knowledge will make a substantial contribution to the success and strategic objectives of our organization.
                </p>
                <p>
                  Under this appointment, your Annual CTC (Cost to Company) will be{" "}
                  <strong className="text-slate-900 dark:text-white">Rs. {viewOfferModal.salary?.toLocaleString("en-IN")} per annum</strong>, subject to statutory deductions as applicable. The detailed breakdown and joining requirements are outlined below.
                </p>
              </div>

              {/* Position Details Table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Position Details:</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-2 p-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Offered Designation</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{viewOfferModal.role}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Annual CTC (INR)</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">Rs. {viewOfferModal.salary?.toLocaleString("en-IN")} / annum</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5 bg-slate-50 dark:bg-slate-900">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Expected Joining Date</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {viewOfferModal.joiningDate ? new Date(viewOfferModal.joiningDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-2 pt-2 text-xs">
                <h4 className="font-extrabold text-slate-900 dark:text-white">Terms & Conditions:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 text-justify">
                  <li><strong>Credential Verification:</strong> This offer of employment is contingent upon successful completion of background checks, reference verifications, and submission of academic & professional credentials.</li>
                  <li><strong>Probationary Period:</strong> Upon commencement, you will undergo a probationary period of six (6) months. Confirmation is subject to satisfactory performance appraisals.</li>
                  <li><strong>Acceptance of Offer:</strong> Please indicate formal acceptance by signing and returning the duplicate copy of this letter on or before your scheduled joining date.</li>
                </ol>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-xs">
                <div className="space-y-8">
                  <p className="font-bold text-slate-900 dark:text-white">Sincerely,</p>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-1 space-y-0.5">
                    <p className="font-extrabold text-slate-900 dark:text-white">Authorized Signatory</p>
                    <p className="text-slate-500">HR Director, Aspino Chemicals Corp</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <p className="font-bold text-slate-900 dark:text-white">Accepted & Agreed,</p>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-1 space-y-0.5">
                    <p className="font-extrabold text-slate-900 dark:text-white">Candidate Signature & Date</p>
                    <p className="text-slate-500">{viewOfferModal.candidate?.name}</p>
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
