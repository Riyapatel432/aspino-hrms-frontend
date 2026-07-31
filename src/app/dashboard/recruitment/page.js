"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
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
  Edit
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
} from "@/redux/slices/recruitmentSlice";
import { toast } from "sonner";

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState("requisitions");
  const dispatch = useDispatch();

  const {
    requisitions,
    candidates,
    schedules,
    offers,
    departments,
    loading
  } = useSelector((state) => state.recruitment);

  useEffect(() => {
    dispatch(fetchRequisitions());
    dispatch(fetchCandidates());
    dispatch(fetchSchedules());
    dispatch(fetchOffers());
    dispatch(fetchDepartments());
    
    // Fetch users for panel members dropdown
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${backendUrl}/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Failed to fetch users:", err));
  }, [dispatch]);

  const dropdownRequisitions = requisitions;

  const [users, setUsers] = useState([]); // Might need a RTK hook for users if we care

  // Requisition Form State
  const [newReq, setNewReq] = useState({ title: "", departmentId: "", headcount: 1, justification: "", raisedBy: "HR Manager" });
  // Candidate Form State
  const [newCand, setNewCand] = useState({ name: "", email: "", phone: "", source: "Portal", requisitionId: "", resumeUrl: "" });
  const [uploadingFile, setUploadingFile] = useState(false);
  // Schedule Form State
  const [newSched, setNewSched] = useState({ candidateId: "", roundName: "Technical Round 1", scheduledAt: "", panelists: "" });
  // Feedback Form State
  const [newFeedback, setNewFeedback] = useState({ scheduleId: "", panelistName: "", rating: 5, comments: "", recommendation: "SELECT" });
  const [feedbackCandidateId, setFeedbackCandidateId] = useState("ALL");
  // Offer Form State
  const [newOffer, setNewOffer] = useState({ candidateId: "", role: "", salary: 600000, joiningDate: "" });

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, type, label }
  const [deleting, setDeleting] = useState(false);
  
  // Edit States
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);

  const [formErrors, setFormErrors] = useState({});

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (departments.length > 0 && !newReq.departmentId) {
      setNewReq(prev => ({ ...prev, departmentId: departments[0].id }));
    }
  }, [departments]);

  // --- Validation Helpers ---
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
    
    if (!newCand.email?.trim()) errs.email = "Email address is required.";
    else {
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(newCand.email)) errs.email = "Please provide a valid email address.";
    }
    
    if (!newCand.id && !newCand.requisitionId) errs.requisitionId = "Please select a Job Requisition.";
    if (!newCand.resumeUrl) errs.resumeUrl = "Resume / CV (PDF) is required.";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSchedule = () => {
    const errs = {};
    if (!newSched.candidateId) errs.candidateId = "Please select a candidate.";
    if (!newSched.roundName?.trim()) errs.roundName = "Interview round name is required.";
    if (!newSched.scheduledAt) errs.scheduledAt = "Interview date and time is required.";
    if (!newSched.panelists?.trim()) errs.panelists = "At least one panelist is required.";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateFeedback = () => {
    const errs = {};
    if (!newFeedback.scheduleId) errs.scheduleId = "Please select an interview schedule.";
    if (!newFeedback.panelistName?.trim()) errs.panelistName = "Panelist name is required.";
    if (!newFeedback.rating || newFeedback.rating < 1 || newFeedback.rating > 10) errs.rating = "Rating must be between 1 and 10.";
    if (!newFeedback.comments?.trim()) errs.comments = "Feedback comments are required.";
    else if (newFeedback.comments.trim().length < 10) errs.comments = "Comments must be at least 10 characters.";
    
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateOffer = () => {
    const errs = {};
    if (!newOffer.candidateId) errs.candidateId = "Please select a candidate.";
    if (!newOffer.role?.trim()) errs.role = "Offered role / designation is required.";
    if (!newOffer.salary || Number(newOffer.salary) < 1) errs.salary = "Annual CTC must be greater than 0.";
    if (!newOffer.joiningDate) errs.joiningDate = "Expected joining date is required.";
    
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
          setNewReq({ title: "", departmentId: departments[0]?.id || "", headcount: 1, justification: "", raisedBy: "HR Manager" });
          toast.success("Requisition updated successfully");
        } else {
          toast.error("Failed to update requisition");
        }
      } else {
        // Create mode
        await dispatch(createRequisition(newReq)).unwrap();
        setNewReq({ title: "", departmentId: departments[0]?.id || "", headcount: 1, justification: "", raisedBy: "HR Manager" });
        toast.success("Requisition created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(newReq.id ? "Failed to update requisition" : "Failed to create requisition");
    }
  };

  const handleDeleteRequisition = async (reqId) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions/${reqId}`, {
        method: "DELETE",
      });
      if (res.ok) {
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
      }
    } catch (err) {
      console.error("Upload error:", err);
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
            phone: newCand.phone
          })
        });
        if (res.ok) {
          dispatch(fetchCandidates());
          setNewCand({ name: "", email: "", phone: "", source: "Portal", requisitionId: "", resumeUrl: "" });
          toast.success("Candidate updated successfully");
        } else {
          toast.error("Failed to update candidate");
        }
      } else {
        // Create mode
        await dispatch(createCandidate(newCand)).unwrap();
        setNewCand({ name: "", email: "", phone: "", source: "Portal", requisitionId: "", resumeUrl: "" });
        const fileInput = document.getElementById("resume-upload-input");
        if (fileInput) fileInput.value = "";
        toast.success("Candidate added successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(newCand.id ? "Failed to update candidate" : "Failed to add candidate");
    }
  };

  const handleDeleteCandidate = async (candId) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/candidates/${candId}`, {
        method: "DELETE",
      });
      if (res.ok) {
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
      if (newSched.id) {
        // Edit mode
        const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/schedules/${newSched.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId: newSched.candidateId,
            roundName: newSched.roundName,
            scheduledAt: newSched.scheduledAt,
            panelists: newSched.panelists
          })
        });
        if (res.ok) {
          dispatch(fetchSchedules());
          setNewSched({ candidateId: "", roundName: "Technical Round 1", scheduledAt: "", panelists: "" });
          toast.success("Schedule updated successfully");
        } else {
          toast.error("Failed to update schedule");
        }
      } else {
        // Create mode
        await dispatch(createSchedule(newSched)).unwrap();
        setNewSched({ candidateId: "", roundName: "Technical Round 1", scheduledAt: "", panelists: "" });
        toast.success("Schedule created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(newSched.id ? "Failed to update schedule" : "Failed to create schedule");
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/schedules/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
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
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/feedbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeedback),
      });
      if (res.ok) {
        setNewFeedback({ scheduleId: "", panelistName: "", rating: 5, comments: "", recommendation: "SELECT" });
        toast.success("Feedback submitted");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit feedback");
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
          setNewOffer({ candidateId: "", role: "", salary: 600000, joiningDate: "" });
          toast.success("Offer updated successfully");
        } else {
          toast.error("Failed to update offer");
        }
      } else {
        // Create mode
        await dispatch(createOffer(newOffer)).unwrap();
        setNewOffer({ candidateId: "", role: "", salary: 600000, joiningDate: "" });
        toast.success("Offer created successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error(newOffer.id ? "Failed to update offer" : "Failed to create offer");
    }
  };

  const handleDeleteOffer = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/recruitment/offers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
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
      toast.error("Failed to accept offer");
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
                <form onSubmit={handleSubmitRequisition} className="space-y-3">
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
                        {departments.map((dept) => (
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
                  data={requisitions}
                  emptyMessage="No job requisitions found."
                  searchKeys={["title", "justification", "raisedBy", "department.name", "status"]}
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
                      render: (row) => (
                        <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                          {row.department?.name || "Unknown"}
                        </span>
                      ),
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
                <form onSubmit={handleSubmitCandidate} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Full Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={newCand.name}
                      onChange={(e) => {
                        setNewCand({ ...newCand, name: e.target.value });
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
                      placeholder="+91..."
                      value={newCand.phone}
                      onChange={(e) => setNewCand({ ...newCand, phone: e.target.value })}
                    />
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
                    <Select value={newCand.source} onValueChange={(val) => setNewCand({ ...newCand, source: val })}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <SelectItem value="Portal">Portal</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Resume / CV (PDF)</Label>
                    <Input
                      id="resume-upload-input"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                    {uploadingFile && <span className="text-[10px] text-sky-500 font-semibold block">Uploading...</span>}
                    {newCand.resumeUrl && <span className="text-[10px] text-emerald-500 font-semibold block">Uploaded successfully</span>}
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
                  data={candidates}
                  emptyMessage="No candidates found."
                  searchKeys={["name", "email", "phone", "source", "status", "requisition.title"]}
                  columns={[
                    {
                      key: "name",
                      label: "Candidate",
                      render: (row) => (
                        <div>
                          <span className="text-sm font-bold text-slate-800 dark:text-white block">{row.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold block">Source: {row.source}</span>
                        </div>
                      ),
                    },
                    {
                      key: "email",
                      label: "Contact Info",
                      render: (row) => (
                        <div className="text-xs space-y-0.5">
                          <span className="text-slate-600 dark:text-slate-300 block font-medium">{row.email}</span>
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
                      render: (row) => (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-900/50">
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
                          {(row.status === "SOURCED" || row.status === "INTERVIEWING") && (
                            <>
                              <button
                                onClick={() => handleUpdateCandidateStatus(row.id, "SELECTED")}
                                className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-lg text-[9px] px-2 py-1 cursor-pointer transition-all"
                              >
                                Select
                              </button>
                              <button
                                onClick={() => handleUpdateCandidateStatus(row.id, "REJECTED")}
                                className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-[9px] px-2 py-1 cursor-pointer transition-all"
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
                      )
                    },
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
                  <form onSubmit={handleSubmitSchedule} className="space-y-3">
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
                          {candidates.filter(c => c.status !== 'SELECTED' && c.status !== 'ACCEPTED').map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.candidateId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.candidateId}</span>}
                    </div>
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
                        setDate={(val) => {
                          setNewSched({ ...newSched, scheduledAt: val });
                          if (formErrors.scheduledAt) setFormErrors({ ...formErrors, scheduledAt: null });
                        }}
                      />
                      {formErrors.scheduledAt && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.scheduledAt}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Panel Member</Label>
                      <Select value={newSched.panelists} onValueChange={(val) => {
                        setNewSched({ ...newSched, panelists: val });
                        if (formErrors.panelists) setFormErrors({ ...formErrors, panelists: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {users.map((u) => (
                            <SelectItem key={u.id} value={String(u.name)}>
                              {u.name} ({u.role?.toUpperCase()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.panelists && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.panelists}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {newSched.id && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setNewSched({ candidateId: "", roundName: "Technical Round 1", scheduledAt: "", panelists: "" });
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
                    Record Panelist Feedback
                  </h3>
                  <form onSubmit={handleCreateFeedback} className="space-y-3">
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
                        setNewFeedback({ ...newFeedback, scheduleId: val });
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
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Panelist Name</Label>
                      <Select value={newFeedback.panelistName} onValueChange={(val) => {
                        setNewFeedback({ ...newFeedback, panelistName: val });
                        if (formErrors.panelistName) setFormErrors({ ...formErrors, panelistName: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {users.map((u) => (
                            <SelectItem key={u.id} value={String(u.name)}>
                              {u.name} ({u.role?.toUpperCase()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.panelistName && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.panelistName}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Rating (1 to 10)</Label>
                      <Input
                        type="number"
                        value={newFeedback.rating}
                        onChange={(e) => {
                          setNewFeedback({ ...newFeedback, rating: Number(e.target.value) });
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
                      <Select value={newFeedback.recommendation} onValueChange={(val) => setNewFeedback({ ...newFeedback, recommendation: val })}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="SELECT">SELECT</SelectItem>
                          <SelectItem value="REJECT">REJECT</SelectItem>
                          <SelectItem value="HOLD">HOLD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-xl mt-2">
                      Submit Recommendation
                    </Button>
                  </form>
                </div>
              </div>

              {/* Schedules DataTable */}
              <div className="lg:col-span-2">
                <DataTable
                  title="Scheduled Interviews"
                  data={schedules}
                  emptyMessage="No scheduled interviews."
                  searchKeys={["candidate.name", "roundName", "panelists", "status"]}
                  columns={[
                    {
                      key: "candidate.name",
                      label: "Candidate & Round",
                      render: (row) => (
                        <div>
                          <span className="text-sm font-bold text-slate-800 dark:text-white block">{row.candidate?.name}</span>
                          <span className="text-[10px] text-sky-500 font-extrabold uppercase block mt-0.5">Round: {row.roundName}</span>
                        </div>
                      ),
                    },
                    {
                      key: "panelists",
                      label: "Panelists",
                      render: (row) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{row.panelists}</span>,
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
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                  f.recommendation === "SELECT" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500 dark:bg-emerald-600/10 dark:text-emerald-400"
                                  : f.recommendation === "REJECT" ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 dark:bg-red-50 dark:bg-red-500/100/10 dark:text-red-400"
                                  : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-50 dark:bg-amber-500/100/10 dark:text-amber-400"
                                }`}>
                                  {f.recommendation} ({f.rating}/10)
                                </span>
                              </div>
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
                                panelists: row.panelists
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
                  <form onSubmit={handleSubmitOffer} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Select Selected Candidate</Label>
                      <Select value={newOffer.candidateId} onValueChange={(val) => {
                          const selectedCandId = val;
                          const cand = candidates.find(c => c.id === selectedCandId);
                          setNewOffer({
                            ...newOffer,
                            candidateId: selectedCandId,
                            role: cand ? cand.requisition?.title || "" : ""
                          });
                          if (formErrors.candidateId) setFormErrors({ ...formErrors, candidateId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {candidates.filter(c => c.status === 'SELECTED' || c.status === 'INTERVIEWING' || c.status === 'SOURCED').map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name} ({c.requisition?.title}) - {c.status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  data={offers}
                  emptyMessage="No offer letters generated yet."
                  searchKeys={["candidate.name", "role", "status"]}
                  columns={[
                    {
                      key: "candidate.name",
                      label: "Candidate",
                      render: (row) => (
                        <div>
                          <span className="text-sm font-bold text-slate-800 dark:text-white block">{row.candidate?.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 block">Status: {row.status}</span>
                        </div>
                      ),
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
                        <a
                          href={`${backendUrl}/staff-hrms/recruitment/offers/${row.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-500 hover:text-sky-600 dark:text-sky-400 font-extrabold text-xs"
                        >
                          Download PDF
                        </a>
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
                              setNewOffer({
                                id: row.id,
                                candidateId: row.candidateId,
                                role: row.role,
                                salary: row.salary,
                                joiningDate: row.joiningDate ? row.joiningDate.split('T')[0] : ""
                              });
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
    </div>
  );
}
