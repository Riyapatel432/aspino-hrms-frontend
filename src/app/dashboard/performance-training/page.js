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
import { toast } from "sonner";
import {
  GraduationCap,
  Award,
  Plus,
  Loader2,
  Edit,
  Trash2,
  FileBadge,
  X
} from "lucide-react";

export default function PerformanceTrainingPage() {
  const [activeTab, setActiveTab] = useState("appraisal");
  const [employees, setEmployees] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [newCycle, setNewCycle] = useState({ name: "", startDate: "", endDate: "" });
  const [newGoal, setNewGoal] = useState({ employeeId: "", cycleId: "", title: "", description: "", weightage: "" });
  const [newReview, setNewReview] = useState({ employeeId: "", cycleId: "", selfRating: "", selfComments: "", managerRating: "", managerComments: "", finalRating: "", status: "" });
  const [newTraining, setNewTraining] = useState({ id: null, employeeId: "", trainingName: "", trainingType: "", completionDate: "", expiryDate: "" });
  const [certificateData, setCertificateData] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, type, label }
  const [deleting, setDeleting] = useState(false);

  const [formErrors, setFormErrors] = useState({});

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Pagination states
  const [cyclePage, setCyclePage] = useState(1);
  const [cycleRows, setCycleRows] = useState(10);
  const [cycleSearch, setCycleSearch] = useState("");
  const [cycleSortBy, setCycleSortBy] = useState("startDate");
  const [cycleSortOrder, setCycleSortOrder] = useState("desc");
  const [totalCycles, setTotalCycles] = useState(0);

  const [goalPage, setGoalPage] = useState(1);
  const [goalRows, setGoalRows] = useState(10);
  const [goalSearch, setGoalSearch] = useState("");
  const [goalSortBy, setGoalSortBy] = useState("title");
  const [goalSortOrder, setGoalSortOrder] = useState("asc");
  const [totalGoals, setTotalGoals] = useState(0);

  const [reviewPage, setReviewPage] = useState(1);
  const [reviewRows, setReviewRows] = useState(10);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewSortBy, setReviewSortBy] = useState("status");
  const [reviewSortOrder, setReviewSortOrder] = useState("asc");
  const [totalReviews, setTotalReviews] = useState(0);

  const [trainPage, setTrainPage] = useState(1);
  const [trainRows, setTrainRows] = useState(10);
  const [trainSearch, setTrainSearch] = useState("");
  const [trainSortBy, setTrainSortBy] = useState("completionDate");
  const [trainSortOrder, setTrainSortOrder] = useState("desc");
  const [totalTrainings, setTotalTrainings] = useState(0);

  const [dropdownCycles, setDropdownCycles] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const cycleParams = new URLSearchParams({ page: String(cyclePage), limit: String(cycleRows) });
      if (cycleSearch) cycleParams.append("search", cycleSearch);
      if (cycleSortBy) cycleParams.append("sortBy", cycleSortBy);
      if (cycleSortOrder) cycleParams.append("sortOrder", cycleSortOrder);

      const goalParams = new URLSearchParams({ page: String(goalPage), limit: String(goalRows) });
      if (goalSearch) goalParams.append("search", goalSearch);
      if (goalSortBy) goalParams.append("sortBy", goalSortBy);
      if (goalSortOrder) goalParams.append("sortOrder", goalSortOrder);

      const reviewParams = new URLSearchParams({ page: String(reviewPage), limit: String(reviewRows) });
      if (reviewSearch) reviewParams.append("search", reviewSearch);
      if (reviewSortBy) reviewParams.append("sortBy", reviewSortBy);
      if (reviewSortOrder) reviewParams.append("sortOrder", reviewSortOrder);

      const trainParams = new URLSearchParams({ page: String(trainPage), limit: String(trainRows) });
      if (trainSearch) trainParams.append("search", trainSearch);
      if (trainSortBy) trainParams.append("sortBy", trainSortBy);
      if (trainSortOrder) trainParams.append("sortOrder", trainSortOrder);

      const safeJson = async (res) => { try { return await res.json(); } catch { return null; } };

      const results = await Promise.allSettled([
        apiFetch(`${backendUrl}/staff-hrms/onboarding/employees`),
        apiFetch(`${backendUrl}/staff-hrms/performance/appraisal-cycles?${cycleParams.toString()}`),
        apiFetch(`${backendUrl}/staff-hrms/performance/goals?${goalParams.toString()}`),
        apiFetch(`${backendUrl}/staff-hrms/performance/reviews?${reviewParams.toString()}`),
        apiFetch(`${backendUrl}/staff-hrms/training/trainings?${trainParams.toString()}`),
        apiFetch(`${backendUrl}/staff-hrms/recruitment/trainingTypes`),
        apiFetch(`${backendUrl}/staff-hrms/performance/appraisal-cycles`),
      ]);

      const [empRes, cycleRes, goalRes, reviewRes, trainRes, typeRes, allCycleRes] = results;

      const empData   = empRes.status === "fulfilled"      ? await safeJson(empRes.value)      : null;
      const cycleData = cycleRes.status === "fulfilled"    ? await safeJson(cycleRes.value)    : null;
      const goalData  = goalRes.status === "fulfilled"     ? await safeJson(goalRes.value)     : null;
      const reviewData= reviewRes.status === "fulfilled"   ? await safeJson(reviewRes.value)   : null;
      const trainData = trainRes.status === "fulfilled"    ? await safeJson(trainRes.value)    : null;
      const typeData  = typeRes.status === "fulfilled"     ? await safeJson(typeRes.value)     : null;
      const allCycleData = allCycleRes.status === "fulfilled" ? await safeJson(allCycleRes.value) : null;

      if (empData)      setEmployees(Array.isArray(empData?.data) ? empData.data : Array.isArray(empData) ? empData : []);
      if (cycleData)  { setCycles(Array.isArray(cycleData?.data) ? cycleData.data : Array.isArray(cycleData) ? cycleData : []); setTotalCycles(cycleData?.pagination?.total || 0); }
      if (goalData)   { setGoals(Array.isArray(goalData?.data) ? goalData.data : Array.isArray(goalData) ? goalData : []);   setTotalGoals(goalData?.pagination?.total || 0); }
      if (reviewData) { setReviews(Array.isArray(reviewData?.data) ? reviewData.data : Array.isArray(reviewData) ? reviewData : []); setTotalReviews(reviewData?.pagination?.total || 0); }
      if (trainData)  { setTrainings(Array.isArray(trainData?.data) ? trainData.data : Array.isArray(trainData) ? trainData : []); setTotalTrainings(trainData?.pagination?.total || 0); }
      if (typeData)     setTrainingTypes(Array.isArray(typeData?.data) ? typeData.data : Array.isArray(typeData) ? typeData : []);
      if (allCycleData) setDropdownCycles(Array.isArray(allCycleData?.data) ? allCycleData.data : Array.isArray(allCycleData) ? allCycleData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    cyclePage, cycleRows, cycleSearch, cycleSortBy, cycleSortOrder,
    goalPage, goalRows, goalSearch, goalSortBy, goalSortOrder,
    reviewPage, reviewRows, reviewSearch, reviewSortBy, reviewSortOrder,
    trainPage, trainRows, trainSearch, trainSortBy, trainSortOrder,
  ]);

  // --- Validation Helpers ---
  const validateCycle = () => {
    const errs = {};
    if (!newCycle.name?.trim()) errs.cycleName = "Cycle name is required.";
    else if (newCycle.name.trim().length < 3) errs.cycleName = "Cycle name must be at least 3 characters.";
    if (!newCycle.startDate) errs.startDate = "Cycle start date is required.";
    if (!newCycle.endDate) errs.endDate = "Cycle end date is required.";
    if (newCycle.startDate && newCycle.endDate && new Date(newCycle.endDate) < new Date(newCycle.startDate)) {
      errs.endDate = "End date cannot be before start date.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateGoal = () => {
    const errs = {};
    if (!newGoal.employeeId) errs.employeeId = "Please select an employee.";
    if (!newGoal.cycleId) errs.cycleId = "Please select an appraisal cycle.";
    if (!newGoal.title?.trim()) errs.goalTitle = "Goal title is required.";
    else if (newGoal.title.trim().length < 3) errs.goalTitle = "Goal title must be at least 3 characters.";
    if (!newGoal.description?.trim()) errs.goalDesc = "Goal description / key results are required.";
    else if (newGoal.description.trim().length < 10) errs.goalDesc = "Goal description must be at least 10 characters.";
    if (newGoal.weightage === undefined || newGoal.weightage === null || newGoal.weightage < 1 || newGoal.weightage > 100) {
      errs.weightage = "Weightage must be between 1% and 100%.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateReview = () => {
    const errs = {};
    if (!newReview.employeeId) errs.employeeId = "Please select an employee.";
    if (!newReview.cycleId) errs.cycleId = "Please select an appraisal cycle.";
    if (newReview.selfRating === "" || newReview.selfRating == null || Number(newReview.selfRating) < 1 || Number(newReview.selfRating) > 10) {
      errs.selfRating = "Self rating must be between 1 and 10.";
    }
    if (newReview.managerRating === "" || newReview.managerRating == null || Number(newReview.managerRating) < 1 || Number(newReview.managerRating) > 10) {
      errs.managerRating = "Manager rating must be between 1 and 10.";
    }
    if (!newReview.status) errs.status = "Please select review status.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateTraining = () => {
    const errs = {};
    if (!newTraining.employeeId) errs.employeeId = "Please select an employee.";
    if (!newTraining.trainingName?.trim()) errs.trainingName = "Training name is required.";
    if (!newTraining.trainingType) errs.trainingType = "Training type is required.";
    if (!newTraining.completionDate) errs.completionDate = "Training completion date is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitCycle = async (e) => {
    e.preventDefault();
    if (!validateCycle()) return;
    try {
      const isUpdate = !!newCycle.id;
      const url = isUpdate 
        ? `${backendUrl}/staff-hrms/performance/appraisal-cycles/${newCycle.id}`
        : `${backendUrl}/staff-hrms/performance/appraisal-cycles`;
      const res = await apiFetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCycle),
      });
      if (res.ok) {
        setNewCycle({ id: null, name: "", startDate: "", endDate: "" });
        fetchData();
        toast.success(isUpdate ? "Cycle updated" : "Cycle created");
      } else {
        const msg = await getErrorMessage(res, isUpdate ? "Failed to update cycle" : "Failed to create cycle");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteCycle = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/performance/appraisal-cycles/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        toast.success("Cycle deleted");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    if (!validateGoal()) return;
    try {
      const isUpdate = !!newGoal.id;
      const url = isUpdate 
        ? `${backendUrl}/staff-hrms/performance/goals/${newGoal.id}`
        : `${backendUrl}/staff-hrms/performance/goals`;
      const res = await apiFetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGoal),
      });
      if (res.ok) {
        setNewGoal({ id: null, employeeId: "", cycleId: "", title: "", description: "", weightage: "" });
        fetchData();
        toast.success(isUpdate ? "Goal updated" : "Goal created");
      } else {
        const msg = await getErrorMessage(res, isUpdate ? "Failed to update goal" : "Failed to create goal");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/performance/goals/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        toast.success("Goal deleted");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!validateReview()) return;
    try {
      const isUpdate = !!newReview.id;
      const url = isUpdate 
        ? `${backendUrl}/staff-hrms/performance/reviews/${newReview.id}`
        : `${backendUrl}/staff-hrms/performance/reviews`;

      // Convert rating fields to numbers; omit finalRating if empty
      const payload = {
        employeeId: newReview.employeeId,
        cycleId: newReview.cycleId,
        selfRating: newReview.selfRating !== "" ? Number(newReview.selfRating) : undefined,
        selfComments: newReview.selfComments || undefined,
        managerRating: newReview.managerRating !== "" ? Number(newReview.managerRating) : undefined,
        managerComments: newReview.managerComments || undefined,
        finalRating: newReview.finalRating !== "" && newReview.finalRating != null ? Number(newReview.finalRating) : undefined,
        status: newReview.status,
      };

      const res = await apiFetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setNewReview({ id: null, employeeId: "", cycleId: "", selfRating: "", selfComments: "", managerRating: "", managerComments: "", finalRating: "", status: "" });
        fetchData();
        toast.success(isUpdate ? "Review updated" : "Review created");
      } else {
        const msg = await getErrorMessage(res, isUpdate ? "Failed to update review" : "Failed to create review");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteReview = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/performance/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        toast.success("Review deleted");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitTraining = async (e) => {
    e.preventDefault();
    if (!validateTraining()) return;
    try {
      const isUpdate = !!newTraining.id;
      const url = isUpdate 
        ? `${backendUrl}/staff-hrms/training/trainings/${newTraining.id}`
        : `${backendUrl}/staff-hrms/training/trainings`;
      const res = await apiFetch(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTraining),
      });
      if (res.ok) {
        setNewTraining({ id: null, employeeId: "", trainingName: "", trainingType: "", completionDate: "", expiryDate: "" });
        fetchData();
        toast.success(isUpdate ? "Training updated" : "Training created");
      } else {
        const msg = await getErrorMessage(res, isUpdate ? "Failed to update training" : "Failed to create training");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteTraining = async (id) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/training/trainings/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
        toast.success("Training deleted");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "cycle") {
        await handleDeleteCycle(deleteTarget.id);
      } else if (deleteTarget.type === "goal") {
        await handleDeleteGoal(deleteTarget.id);
      } else if (deleteTarget.type === "review") {
        await handleDeleteReview(deleteTarget.id);
      } else if (deleteTarget.type === "training") {
        await handleDeleteTraining(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  // DataTable column definitions
  const cycleColumns = [
    { key: "name", label: "Cycle Name" },
    {
      key: "startDate",
      label: "Start Date",
      render: (row) => <span className="text-xs">{new Date(row.startDate).toLocaleDateString()}</span>,
    },
    {
      key: "endDate",
      label: "End Date",
      render: (row) => <span className="text-xs">{new Date(row.endDate).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewCycle({
                id: row.id,
                name: row.name,
                startDate: row.startDate ? new Date(row.startDate).toISOString().split('T')[0] : "",
                endDate: row.endDate ? new Date(row.endDate).toISOString().split('T')[0] : ""
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: `cycle "${row.name}"`, type: "cycle", label: "Appraisal Cycle" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const goalColumns = [
    {
      key: "title",
      label: "Goal Title",
      render: (row) => (
        <div>
          <span className="font-black text-slate-800 dark:text-white text-xs block">{row.title}</span>
          <span className="text-[10px] text-slate-400 block italic">"{row.description}"</span>
        </div>
      ),
    },
    {
      key: "employee.firstName",
      label: "Employee",
      render: (row) => (
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {row.employee?.firstName} {row.employee?.lastName}
        </span>
      ),
    },
    {
      key: "cycle.name",
      label: "Appraisal Cycle",
      render: (row) => <span className="text-xs text-sky-600 dark:text-sky-400 font-bold">{row.cycle?.name || "—"}</span>,
    },
    {
      key: "weightage",
      label: "Weightage",
      render: (row) => (
        <span className="text-[10px] font-extrabold bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-full border border-sky-100 dark:border-sky-500/20">
          {row.weightage}%
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
              setNewGoal({
                id: row.id,
                employeeId: row.employeeId,
                cycleId: row.cycleId,
                title: row.title,
                description: row.description,
                weightage: row.weightage
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: `goal "${row.title}"`, type: "goal", label: "Performance Goal" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const reviewColumns = [
    {
      key: "employee.firstName",
      label: "Employee",
      render: (row) => (
        <span className="text-xs font-bold text-slate-700 dark:text-white">
          {row.employee?.firstName} {row.employee?.lastName}
        </span>
      ),
    },
    { key: "selfRating", label: "Self Rating" },
    { key: "managerRating", label: "Manager Rating" },
    // { key: "finalRating", label: "Final Rating" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
          row.status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
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
              setNewReview({
                id: row.id,
                employeeId: row.employeeId,
                cycleId: row.cycleId,
                selfRating: row.selfRating,
                selfComments: row.selfComments || "",
                managerRating: row.managerRating,
                managerComments: row.managerComments || "",
                finalRating: row.finalRating,
                status: row.status
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: `review for ${row.employee?.firstName || 'employee'}`, type: "review", label: "Performance Review" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  const trainingColumns = [
    {
      key: "employee.firstName",
      label: "Employee",
      render: (row) => (
        <div>
          <span className="text-xs font-extrabold text-slate-800 dark:text-white block">
            {row.employee?.firstName} {row.employee?.lastName}
          </span>
          <span className="text-[10px] text-slate-400">{row.employee?.employeeId}</span>
        </div>
      ),
    },
    {
      key: "trainingName",
      label: "Training Name",
      render: (row) => <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{row.trainingName}</span>,
    },
    {
      key: "trainingType",
      label: "Type",
      render: (row) => (
        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
          row.trainingType === "COMPLIANCE" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"
          : "bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300"
        }`}>
          {row.trainingType}
        </span>
      ),
    },
    {
      key: "completionDate",
      label: "Completed",
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {new Date(row.completionDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "expiryDate",
      label: "Expires",
      render: (row) => row.expiryDate ? (
        <span className="text-xs font-bold text-amber-500">
          {new Date(row.expiryDate).toLocaleDateString()}
        </span>
      ) : <span className="text-slate-300 text-xs">—</span>,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewTraining({
                id: row.id,
                employeeId: row.employeeId,
                trainingName: row.trainingName,
                trainingType: row.trainingType,
                completionDate: row.completionDate ? new Date(row.completionDate).toISOString().split('T')[0] : "",
                expiryDate: row.expiryDate ? new Date(row.expiryDate).toISOString().split('T')[0] : ""
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: `training "${row.trainingName}"`, type: "training", label: "Training Log" })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {row.trainingType === "COMPLIANCE" && row.status === "COMPLETED" && (
            <button
              onClick={() => setCertificateData(row)}
              className="p-1.5 bg-white dark:bg-slate-800 text-indigo-400 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 dark:hover:bg-indigo-500 rounded-lg transition-all"
              title="View Certificate"
            >
              <FileBadge className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto">
        {[
          { id: "appraisal", label: "Appraisal Cycles & Goals", icon: Award },
          { id: "training", label: "GMP & Compliance Training", icon: GraduationCap },
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
          {/* TAB 1: APPRAISAL */}
          {activeTab === "appraisal" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Forms */}
              <div className="space-y-6 h-fit">
                {/* Create Cycle */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-500" />
                    Create Appraisal Cycle
                  </h3>
                  <form onSubmit={handleSubmitCycle} className="space-y-3" noValidate>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Cycle Name</Label>
                      <Input
                        value={newCycle.name}
                        onChange={(e) => {
                          setNewCycle({ ...newCycle, name: e.target.value });
                          if (formErrors.cycleName) setFormErrors({ ...formErrors, cycleName: null });
                        }}
                      />
                      {formErrors.cycleName && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.cycleName}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Start Date</Label>
                        <DateTimePicker type="date" date={newCycle.startDate} setDate={(val) => {
                          setNewCycle({ ...newCycle, startDate: val });
                          if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: null });
                        }} />
                        {formErrors.startDate && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.startDate}</span>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">End Date</Label>
                        <DateTimePicker type="date" date={newCycle.endDate} setDate={(val) => {
                          setNewCycle({ ...newCycle, endDate: val });
                          if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: null });
                        }} />
                        {formErrors.endDate && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.endDate}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl">
                        {newCycle.id ? "Update Cycle" : "Create Cycle"}
                      </Button>
                      {newCycle.id && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNewCycle({ id: null, name: "Annual Appraisal Cycle FY26", startDate: "", endDate: "" });
                            setFormErrors({});
                          }}
                          className="rounded-xl border-slate-200 dark:border-slate-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Set Goals */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-500" />
                    Set Employee Goal
                  </h3>
                  <form onSubmit={handleSubmitGoal} className="space-y-3" noValidate>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee</Label>
                      <Select value={newGoal.employeeId} onValueChange={(val) => {
                        setNewGoal({ ...newGoal, employeeId: val });
                        if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.employeeId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.employeeId}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Appraisal Cycle</Label>
                      <Select value={newGoal.cycleId} onValueChange={(val) => {
                        setNewGoal({ ...newGoal, cycleId: val });
                        if (formErrors.cycleId) setFormErrors({ ...formErrors, cycleId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {(dropdownCycles.length > 0 ? dropdownCycles : cycles).map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.cycleId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.cycleId}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Goal Title</Label>
                      <Input
                        placeholder="e.g. Audit Compliance"
                        value={newGoal.title}
                        onChange={(e) => {
                          setNewGoal({ ...newGoal, title: e.target.value });
                          if (formErrors.goalTitle) setFormErrors({ ...formErrors, goalTitle: null });
                        }}
                      />
                      {formErrors.goalTitle && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.goalTitle}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Description</Label>
                      <Textarea
                        placeholder="Key Results metrics..."
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:bg-slate-950 h-16"
                        value={newGoal.description}
                        onChange={(e) => {
                          setNewGoal({ ...newGoal, description: e.target.value });
                          if (formErrors.goalDesc) setFormErrors({ ...formErrors, goalDesc: null });
                        }}
                      />
                      {formErrors.goalDesc && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.goalDesc}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Weightage (%)</Label>
                      <Input
                        type="number"
                        value={newGoal.weightage}
                        onChange={(e) => {
                          setNewGoal({ ...newGoal, weightage: e.target.value });
                          if (formErrors.weightage) setFormErrors({ ...formErrors, weightage: null });
                        }}
                      />
                      {formErrors.weightage && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.weightage}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl">
                        {newGoal.id ? "Update Goal" : "Assign Goal"}
                      </Button>
                      {newGoal.id && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNewGoal({ id: null, employeeId: "", cycleId: "", title: "", description: "", weightage: 50 });
                            setFormErrors({});
                          }}
                          className="rounded-xl border-slate-200 dark:border-slate-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Performance Review */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-500" />
                    Performance Review
                  </h3>
                  <form onSubmit={handleSubmitReview} className="space-y-3" noValidate>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee</Label>
                      <Select value={newReview.employeeId} onValueChange={(val) => {
                        setNewReview({ ...newReview, employeeId: val });
                        if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.employeeId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.employeeId}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Appraisal Cycle</Label>
                      <Select value={newReview.cycleId} onValueChange={(val) => {
                        setNewReview({ ...newReview, cycleId: val });
                        if (formErrors.cycleId) setFormErrors({ ...formErrors, cycleId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {(dropdownCycles.length > 0 ? dropdownCycles : cycles).map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.cycleId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.cycleId}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Self Rating (1-10)</Label>
                        <Input
                          type="number"
                          value={newReview.selfRating}
                          onChange={(e) => {
                            setNewReview({ ...newReview, selfRating: e.target.value });
                            if (formErrors.selfRating) setFormErrors({ ...formErrors, selfRating: null });
                          }}
                        />
                        {formErrors.selfRating && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.selfRating}</span>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Manager Rating</Label>
                        <Input
                          type="number"
                          value={newReview.managerRating}
                          onChange={(e) => {
                            setNewReview({ ...newReview, managerRating: e.target.value });
                            if (formErrors.managerRating) setFormErrors({ ...formErrors, managerRating: null });
                          }}
                        />
                        {formErrors.managerRating && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.managerRating}</span>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Status</Label>
                      <Select value={newReview.status} onValueChange={(val) => {
                        setNewReview({ ...newReview, status: val });
                        if (formErrors.status) setFormErrors({ ...formErrors, status: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.status && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.status}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl">
                        {newReview.id ? "Update Review" : "Create Review"}
                      </Button>
                      {newReview.id && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNewReview({ id: null, employeeId: "", cycleId: "", selfRating: 8, selfComments: "", managerRating: 8, managerComments: "", finalRating: 8, status: "COMPLETED" });
                            setFormErrors({});
                          }}
                          className="rounded-xl border-slate-200 dark:border-slate-700"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* DataTables Column */}
              <div className="lg:col-span-2 space-y-6">
                <DataTable
                  title="Appraisal Cycles"
                  lazy
                  value={cycles}
                  totalRecords={totalCycles}
                  page={cyclePage}
                  rows={cycleRows}
                  loading={loading}
                  search={cycleSearch}
                  sortBy={cycleSortBy}
                  sortOrder={cycleSortOrder}
                  onPageChange={(p) => setCyclePage(p)}
                  onRowsChange={(r) => { setCycleRows(r); setCyclePage(1); }}
                  onSortChange={(k, dir) => { setCycleSortBy(k); setCycleSortOrder(dir); setCyclePage(1); }}
                  onSearchChange={(s) => { setCycleSearch(s); setCyclePage(1); }}
                  columns={cycleColumns}
                  emptyMessage="No appraisal cycles created."
                />
                <DataTable
                  title="Assigned Goals"
                  lazy
                  value={goals}
                  totalRecords={totalGoals}
                  page={goalPage}
                  rows={goalRows}
                  loading={loading}
                  search={goalSearch}
                  sortBy={goalSortBy}
                  sortOrder={goalSortOrder}
                  onPageChange={(p) => setGoalPage(p)}
                  onRowsChange={(r) => { setGoalRows(r); setGoalPage(1); }}
                  onSortChange={(k, dir) => { setGoalSortBy(k); setGoalSortOrder(dir); setGoalPage(1); }}
                  onSearchChange={(s) => { setGoalSearch(s); setGoalPage(1); }}
                  columns={goalColumns}
                  emptyMessage="No goals assigned for this cycle."
                />
                <DataTable
                  title="Performance Reviews"
                  lazy
                  value={reviews}
                  totalRecords={totalReviews}
                  page={reviewPage}
                  rows={reviewRows}
                  loading={loading}
                  search={reviewSearch}
                  sortBy={reviewSortBy}
                  sortOrder={reviewSortOrder}
                  onPageChange={(p) => setReviewPage(p)}
                  onRowsChange={(r) => { setReviewRows(r); setReviewPage(1); }}
                  onSortChange={(k, dir) => { setReviewSortBy(k); setReviewSortOrder(dir); setReviewPage(1); }}
                  onSearchChange={(s) => { setReviewSearch(s); setReviewPage(1); }}
                  columns={reviewColumns}
                  emptyMessage="No performance reviews recorded."
                />
              </div>
            </div>
          )}

          {/* TAB 2: TRAINING */}
          {activeTab === "training" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Card */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-sky-500" />
                  Log Compliance Training
                </h3>
                <form onSubmit={handleSubmitTraining} className="space-y-3" noValidate>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee</Label>
                    <Select value={newTraining.employeeId} onValueChange={(val) => {
                      setNewTraining({ ...newTraining, employeeId: val });
                      if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
                    }}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.employeeId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.employeeId}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Training Name (Pharma GMP)</Label>
                    <Input
                      placeholder="e.g. GMP Regulatory compliance"
                      value={newTraining.trainingName}
                      onChange={(e) => {
                        setNewTraining({ ...newTraining, trainingName: e.target.value });
                        if (formErrors.trainingName) setFormErrors({ ...formErrors, trainingName: null });
                      }}
                    />
                    {formErrors.trainingName && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.trainingName}</span>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Training Type</Label>
                    <Select value={newTraining.trainingType} onValueChange={(val) => {
                      setNewTraining({ ...newTraining, trainingType: val });
                      if (formErrors.trainingType) setFormErrors({ ...formErrors, trainingType: null });
                    }}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                       <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {trainingTypes.length > 0 ? (
                          trainingTypes.map((t) => (
                            <SelectItem key={t.id} value={t.name}>{t.name.toUpperCase()}</SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="COMPLIANCE">COMPLIANCE (FDA/GMP)</SelectItem>
                            <SelectItem value="TECHNICAL">TECHNICAL SKILLS</SelectItem>
                            <SelectItem value="SOFT_SKILLS">SOFT SKILLS</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    {formErrors.trainingType && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.trainingType}</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Completion Date</Label>
                      <DateTimePicker type="date" date={newTraining.completionDate} setDate={(val) => {
                        setNewTraining({ ...newTraining, completionDate: val });
                        if (formErrors.completionDate) setFormErrors({ ...formErrors, completionDate: null });
                      }} />
                      {formErrors.completionDate && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.completionDate}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Expiry Date</Label>
                      <DateTimePicker type="date" date={newTraining.expiryDate} setDate={(val) => setNewTraining({ ...newTraining, expiryDate: val })} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl">
                      {newTraining.id ? "Update Training" : "Log Training"}
                    </Button>
                    {newTraining.id && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setNewTraining({ id: null, employeeId: "", trainingName: "GMP Standard Operating Procedures", trainingType: "COMPLIANCE", completionDate: "", expiryDate: "" });
                          setFormErrors({});
                        }}
                        className="rounded-xl border-slate-200 dark:border-slate-700"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              {/* Training DataTable */}
              <div className="lg:col-span-2">
                <DataTable
                  title="FDA & GMP Training Records"
                  lazy
                  value={trainings}
                  totalRecords={totalTrainings}
                  page={trainPage}
                  rows={trainRows}
                  loading={loading}
                  search={trainSearch}
                  sortBy={trainSortBy}
                  sortOrder={trainSortOrder}
                  onPageChange={(p) => setTrainPage(p)}
                  onRowsChange={(r) => { setTrainRows(r); setTrainPage(1); }}
                  onSortChange={(k, dir) => { setTrainSortBy(k); setTrainSortOrder(dir); setTrainPage(1); }}
                  onSearchChange={(s) => { setTrainSearch(s); setTrainPage(1); }}
                  columns={trainingColumns}
                  emptyMessage="No training records logged yet."
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificate Modal */}
      {certificateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border-[8px] border-double border-indigo-200 dark:border-indigo-900 rounded-lg shadow-2xl w-full max-w-2xl relative overflow-hidden">
            <button
              onClick={() => setCertificateData(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-12 text-center space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10">
              <div className="flex justify-center">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-full border border-indigo-100 dark:border-indigo-800">
                  <Award className="w-16 h-16 text-indigo-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-widest">
                  Certificate of Completion
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                  This certifies that
                </p>
              </div>
              <h3 className="text-3xl font-bold text-sky-600 dark:text-sky-400 font-serif italic border-b-2 border-indigo-100 dark:border-indigo-800/50 inline-block px-10 pb-2">
                {certificateData.employee?.firstName} {certificateData.employee?.lastName}
              </h3>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-300">
                  has successfully completed the compliance training for:
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  {certificateData.trainingName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 text-sm">
                <div>
                  <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider">Completed On</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {new Date(certificateData.completionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider">Valid Until</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {certificateData.expiryDate ? new Date(certificateData.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-center opacity-50">
                <div className="w-32 h-32 border-4 border-indigo-500 rounded-full flex flex-col items-center justify-center -rotate-12">
                  <span className="text-indigo-500 font-black uppercase text-xs">Official</span>
                  <span className="text-indigo-500 font-black text-lg">GMP</span>
                  <span className="text-indigo-500 font-black uppercase text-[10px]">Certified</span>
                </div>
              </div>
            </div>
          </div>
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
