"use client";

import { useEffect, useState } from "react";
import { API_URL, apiFetch, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { RouteGuard, usePermissions } from "@/context/PermissionContext";
import {
  ListChecks,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Calendar,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------
const ROUND_NAME_MIN_LENGTH = 2;

function validateRoundName(name) {
  if (!name?.trim()) return "Interview round name is required.";
  if (name.trim() === "0" || /^0+$/.test(name.trim())) return "Round name cannot be 0.";
  if (name.trim().length < ROUND_NAME_MIN_LENGTH)
    return `Round name must be at least ${ROUND_NAME_MIN_LENGTH} characters.`;
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function InterviewRoundsPage() {
  return (
    <RouteGuard subject="interview-rounds" action="read">
      <InterviewRoundsContent />
    </RouteGuard>
  );
}

function InterviewRoundsContent() {
  const { can, isSuperAdmin } = usePermissions();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Permission guards
  const canCreate = isSuperAdmin || can("create", "recruitment") || can("create", "interview-rounds") || can("create", "interview_round") || can("create", "interview_rounds");
  const canUpdate = isSuperAdmin || can("update", "recruitment") || can("update", "interview-rounds") || can("update", "interview_round") || can("update", "interview_rounds");
  const canDelete = isSuperAdmin || can("delete", "recruitment") || can("delete", "interview-rounds") || can("delete", "interview_round") || can("delete", "interview_rounds");

  // Server-side Data Handling state
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [sortOrder, setSortOrder] = useState("asc");
  const [totalRecords, setTotalRecords] = useState(0);

  // Form state — unified for both create and edit
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOrder, setFormOrder] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showForm = canCreate || (editingId && canUpdate);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(rows),
      });
      if (search) params.append("search", search);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);

      const res = await apiFetch(`${API_URL}/staff-hrms/recruitment/interview-rounds?${params.toString()}`);
      const data = await res.json();

      if (data && data.data) {
        setRounds(Array.isArray(data.data) ? data.data : []);
        setTotalRecords(data.pagination?.total ?? data.total ?? (Array.isArray(data.data) ? data.data.length : 0));
      } else {
        const list = Array.isArray(data) ? data : [];
        setRounds(list);
        setTotalRecords(list.length);
      }
    } catch (e) {
      console.error("Error loading interview rounds:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [page, rows, search, sortBy, sortOrder]);

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------
  function startEditing(round) {
    if (!canUpdate) {
      toast.error("You do not have permission to edit interview rounds");
      return;
    }
    setEditingId(round.id);
    setFormName(round.name || "");
    setFormDescription(round.description || "");
    setFormOrder(round.order || 1);
    setFormIsActive(round.isActive !== false);
    setNameError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setFormName("");
    setFormDescription("");
    setFormOrder((rounds.length || 0) + 1);
    setFormIsActive(true);
    setNameError(null);
  }

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId ? !canUpdate : !canCreate) {
      toast.error(`You do not have permission to ${editingId ? "update" : "create"} interview rounds.`);
      return;
    }
    const error = validateRoundName(formName);
    if (error) {
      setNameError(error);
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `${API_URL}/staff-hrms/recruitment/interview-rounds/${editingId}`
        : `${API_URL}/staff-hrms/recruitment/interview-rounds`;
      const method = editingId ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription?.trim() || null,
          order: Number(formOrder) || 1,
          isActive: formIsActive,
        }),
      });

      if (res.ok) {
        toast.success(editingId ? "Interview round updated successfully" : "Interview round created successfully");
        cancelEdit();
        fetchData();
      } else {
        const msg = await getErrorMessage(res, "Interview round save failed");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Interview round save error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !canDelete) {
      toast.error("You do not have permission to delete interview rounds");
      return;
    }
    setDeleting(true);
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/recruitment/interview-rounds/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Interview round deleted successfully");
        cancelEdit();
        setDeleteTarget(null);
        fetchData();
      } else {
        const msg = await getErrorMessage(res, "Failed to delete interview round");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Interview round delete error:", err);
      toast.error("Failed to delete interview round");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleStatus(row) {
    if (!canUpdate) {
      toast.error("You do not have permission to update status");
      return;
    }
    const nextStatus = row.isActive !== false ? false : true;
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/recruitment/interview-rounds/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Round "${row.name}" set to ${nextStatus ? "Active" : "Inactive"}`);
        fetchData();
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      console.error("Status update error:", e);
      toast.error("Status update failed");
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-sky-500" aria-hidden="true" />
            Interview Round Master
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure standardized interview stages, round names, and sequences for recruitment.
          </p>
        </div>
      </div>

      <div className={showForm ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "space-y-6"}>
          {/* Form Card */}
          {showForm && (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-500" aria-hidden="true" />
                {editingId ? "Edit Interview Round" : "Create Interview Round"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                <div className="space-y-1">
                  <Label htmlFor="round-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Round Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="round-name"
                    placeholder="e.g. Technical Round 1, HR Round"
                    value={formName}
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? "round-name-error" : undefined}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                  />
                  {nameError && (
                    <span id="round-name-error" className="text-rose-500 text-[10.5px] font-bold block mt-0.5" role="alert">
                      {nameError}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="round-desc" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Description / Focus Area
                  </Label>
                  <Input
                    id="round-desc"
                    placeholder="e.g. Assessment of algorithms & problem solving"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="round-order" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Sequence / Order
                  </Label>
                  <Input
                    id="round-order"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Status
                  </Label>
                  <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                    <Switch
                      checked={formIsActive}
                      onCheckedChange={setFormIsActive}
                    />
                    <span className={`text-xs font-bold ${formIsActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                      {formIsActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Round" : "Save Round"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl font-bold"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* List Card */}
          <div className={showForm ? "lg:col-span-2" : "w-full"}>
            <DataTable
              title="Configured Interview Rounds"
              lazy
              value={rounds}
              totalRecords={totalRecords}
              page={page}
              rows={rows}
              loading={loading}
              search={search}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onPageChange={(p) => setPage(p)}
              onRowsChange={(r) => { setRows(r); setPage(1); }}
              onSortChange={(k, dir) => { setSortBy(k); setSortOrder(dir); setPage(1); }}
              onSearchChange={(s) => { setSearch(s); setPage(1); }}
              emptyMessage="No interview rounds configured."
              columns={[
                {
                  key: "order",
                  label: "Seq",
                  render: (row) => (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      #{row.order || 1}
                    </span>
                  ),
                },
                {
                  key: "name",
                  label: "Round Name",
                  render: (row) => (
                    <div>
                      <span className="text-sm font-black text-slate-800 dark:text-white block">
                        {row.name}
                      </span>
                      {row.description && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[220px]">
                          {row.description}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: "activeInterviews",
                  label: "Scheduled",
                  sortable: false,
                  render: (row) => (
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 w-fit">
                      <Calendar className="w-3 h-3" />
                      {row.activeInterviews || 0}
                    </span>
                  ),
                },
                {
                  key: "isActive",
                  label: "Status",
                  sortable: false,
                  render: (row) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={row.isActive !== false}
                        disabled={!canUpdate}
                        onCheckedChange={() => handleToggleStatus(row)}
                      />
                      <span className={`text-xs font-bold ${
                        row.isActive !== false
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400"
                      }`}>
                        {row.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    <div className="flex items-center gap-1.5">
                      {canUpdate && (
                        <button
                          onClick={() => startEditing(row)}
                          className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all cursor-pointer"
                          title={`Edit round ${row.name}`}
                          aria-label={`Edit round ${row.name}`}
                        >
                          <Edit className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                          className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
                          title={`Delete round ${row.name}`}
                          aria-label={`Delete round ${row.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Interview Round"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
