import { useState, useRef, useEffect } from "react";
import { API_URL, apiFetch, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Exit form default state helpers
// ---------------------------------------------------------------------------
const DEFAULT_NOTICE_DAYS = 30;

/**
 * Calculates the Last Working Day by adding notice period days to the
 * resignation date. Returns ISO date string (YYYY-MM-DD) or empty string.
 */
export function calculateLwd(resignationDate, noticeDays) {
  if (!resignationDate) return "";
  const dateObj = new Date(resignationDate);
  if (isNaN(dateObj.getTime())) return "";
  dateObj.setDate(dateObj.getDate() + Number(noticeDays || 0));
  return dateObj.toISOString().split("T")[0];
}

function buildDefaultExitForm() {
  return {
    employeeId: "",
    type: "",
    resignationDate: "",
    noticePeriodDays: "",
    lastWorkingDay: "",
    reason: "",
  };
}

const DEFAULT_SETTLEMENT = {
  pendingSalary: "",
  leaveEncashment: "",
  bonus: "",
  recoveries: "",
};

// ---------------------------------------------------------------------------
// Validation helpers (pure functions — no side effects)
// ---------------------------------------------------------------------------
export function validateExitForm(form) {
  const errs = {};
  if (!form.employeeId) errs.employeeId = "Please select an employee.";
  if (!form.type) errs.type = "Please select exit type.";
  if (!form.resignationDate) errs.resignationDate = "Resignation/Termination date is required.";
  if (form.noticePeriodDays === "" || form.noticePeriodDays == null || Number(form.noticePeriodDays) < 0) {
    errs.noticePeriodDays = "Notice period days is required (0 or more).";
  }
  if (!form.lastWorkingDay) {
    errs.lastWorkingDay = "Last working day is required.";
  } else if (
    form.resignationDate &&
    new Date(form.lastWorkingDay) < new Date(form.resignationDate)
  ) {
    errs.lastWorkingDay = "Last working day cannot be before resignation/termination date.";
  }
  if (!form.reason?.trim()) {
    errs.reason = "Reason for exit is required.";
  } else if (form.reason.trim().length < 5) {
    errs.reason = "Reason must be at least 5 characters.";
  }
  return errs;
}

export function validateSettlementForm(settlement) {
  const errs = {};
  const fields = {
    pendingSalary: "Pending salary",
    leaveEncashment: "Leave encashment",
    bonus: "Bonus",
    recoveries: "Recoveries",
  };
  for (const [key, label] of Object.entries(fields)) {
    if (settlement[key] === "" || settlement[key] == null || Number(settlement[key]) < 0) {
      errs[key] = `${label} is required (0 or more).`;
    }
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Custom hook — encapsulates all exit-management state & API calls
// ---------------------------------------------------------------------------
export function useExitWorkflow() {
  const [employees, setEmployees] = useState([]);
  const [exits, setExits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExit, setSelectedExit] = useState(null);

  const [exitForm, setExitForm] = useState(buildDefaultExitForm);
  const [editingExitId, setEditingExitId] = useState(null);
  const [exitFormErrors, setExitFormErrors] = useState({});

  const [settlement, setSettlement] = useState(DEFAULT_SETTLEMENT);
  const [settlementFormErrors, setSettlementFormErrors] = useState({});

  const [letterTemplate, setLetterTemplate] = useState("relieving");

  // Delete dialog state — exposed to the page so it can render the dialog UI
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  // Stable ref to track current selectedExit inside callbacks without stale closure
  const selectedExitRef = useRef(selectedExit);
  
  useEffect(() => {
    selectedExitRef.current = selectedExit;
  }, [selectedExit]);

  // ---------------------------------------------------------------------------
  // Data fetching — plain async function; called by the page's useEffect on mount
  // and re-called after any mutation to keep the list fresh.
  // ---------------------------------------------------------------------------
  async function fetchData() {
    setLoading(true);
    try {
      const [empRes, exitRes] = await Promise.all([
        apiFetch(`${API_URL}/staff-hrms/onboarding/employees?limit=1000`),
        apiFetch(`${API_URL}/staff-hrms/exit/exits`),
      ]);

      const empData = await empRes.json();
      const exitList = await exitRes.json();

      const validEmployees = Array.isArray(empData.data) ? empData.data : [];
      const validExits = Array.isArray(exitList)
        ? exitList
        : Array.isArray(exitList?.data)
        ? exitList.data
        : [];

      setEmployees(validEmployees);
      setExits(validExits);

      // Re-sync selectedExit after refresh
      if (validExits.length > 0) {
        const current = selectedExitRef.current;
        const refreshed = current ? validExits.find((e) => e.id === current.id) : null;
        setSelectedExit(refreshed ?? validExits[0]);
      } else {
        setSelectedExit(null);
      }
    } catch (e) {
      console.error("Error loading exit data:", e);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Exit form helpers
  // ---------------------------------------------------------------------------
  function resetExitForm() {
    setExitForm(buildDefaultExitForm());
    setEditingExitId(null);
    setExitFormErrors({});
  }

  function startEditingExit(row) {
    setEditingExitId(row.id);
    setExitForm({
      employeeId: String(row.employeeId),
      type: row.type,
      resignationDate: row.resignationDate
        ? new Date(row.resignationDate).toISOString().split("T")[0]
        : "",
      noticePeriodDays: row.noticePeriodDays ?? 0,
      lastWorkingDay: row.lastWorkingDay
        ? new Date(row.lastWorkingDay).toISOString().split("T")[0]
        : "",
      reason: row.reason ?? "",
    });
    setExitFormErrors({});
  }

  function updateExitField(field, value) {
    setExitForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-recalculate LWD whenever resignation date or notice days change
      if (field === "resignationDate" || field === "noticePeriodDays") {
        updated.lastWorkingDay = calculateLwd(
          field === "resignationDate" ? value : prev.resignationDate,
          field === "noticePeriodDays" ? value : prev.noticePeriodDays
        );
      }
      return updated;
    });
    if (exitFormErrors[field]) {
      setExitFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  }

  function updateSettlementField(field, value) {
    setSettlement((prev) => ({ ...prev, [field]: value }));
    if (settlementFormErrors[field]) {
      setSettlementFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  }

  // ---------------------------------------------------------------------------
  // API actions
  // ---------------------------------------------------------------------------
  async function handleInitiateExit(e) {
    e.preventDefault();
    const errs = validateExitForm(exitForm);
    if (Object.keys(errs).length > 0) {
      setExitFormErrors(errs);
      return;
    }

    const lwd =
      exitForm.lastWorkingDay ||
      calculateLwd(exitForm.resignationDate, exitForm.noticePeriodDays);

    const payload = {
      ...exitForm,
      noticePeriodDays: Number(exitForm.noticePeriodDays || 0),
      lastWorkingDay: lwd,
    };

    const url = editingExitId
      ? `${API_URL}/staff-hrms/exit/exits/${editingExitId}`
      : `${API_URL}/staff-hrms/exit/exits/initiate`;
    const method = editingExitId ? "PATCH" : "POST";

    try {
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingExitId ? "Exit process updated successfully" : "Exit process initiated successfully");
        resetExitForm();
        fetchData();
      } else {
        const msg = await getErrorMessage(res, "Exit operation failed");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Exit initiation error:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleDeleteExit() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/exit/exits/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedExitRef.current?.id === deleteTarget.id) setSelectedExit(null);
        setDeleteTarget(null);
        fetchData();
        toast.success("Exit process deleted successfully");
      } else {
        const msg = await getErrorMessage(res, "Delete failed");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Exit delete error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpdateClearance(taskId, status) {
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/exit/clearances/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // TODO (21 CFR Part 11 §11.30): replace hardcoded "HR Manager" with the
        // authenticated user's name retrieved from the session context.
        body: JSON.stringify({ status, clearedBy: "HR Manager" }),
      });
      if (res.ok) {
        toast.success("Clearance status updated");
        fetchData();
      } else {
        const msg = await getErrorMessage(res, "Clearance update failed");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Clearance update error:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleProcessSettlement(e) {
    e.preventDefault();
    if (!selectedExit) return;
    const errs = validateSettlementForm(settlement);
    if (Object.keys(errs).length > 0) {
      setSettlementFormErrors(errs);
      return;
    }
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/exit/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitProcessId: selectedExit.id, ...settlement }),
      });
      if (res.ok) {
        toast.success("Settlement processed successfully");
        fetchData();
      } else {
        const msg = await getErrorMessage(res, "Settlement processing failed");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Settlement processing error:", err);
      toast.error("An unexpected error occurred");
    }
  }

  async function handleCompleteExit(id) {
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/exit/exits/${id}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Exit process completed");
        fetchData();
      } else {
        const msg = await getErrorMessage(res, "Complete exit failed");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Complete exit error:", err);
      toast.error("An unexpected error occurred");
    }
  }

  return {
    // Data
    employees,
    exits,
    loading,
    selectedExit,
    setSelectedExit,
    // Exit form
    exitForm,
    editingExitId,
    exitFormErrors,
    updateExitField,
    resetExitForm,
    startEditingExit,
    // Settlement
    settlement,
    settlementFormErrors,
    updateSettlementField,
    // Letter
    letterTemplate,
    setLetterTemplate,
    // Delete dialog
    deleteTarget,
    setDeleteTarget,
    deleting,
    // Actions
    fetchData,
    handleInitiateExit,
    handleDeleteExit,
    handleUpdateClearance,
    handleProcessSettlement,
    handleCompleteExit,
  };
}
