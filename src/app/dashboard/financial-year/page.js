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
import { Calendar, Plus, Trash2, Edit, Loader2 } from "lucide-react";

export default function FinancialYearPage() {
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Server-side Data Handling state
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [totalRecords, setTotalRecords] = useState(0);

  // Form state
  const [formName, setFormName] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

      const fyRes = await apiFetch(`${API_URL}/staff-hrms/recruitment/fiscal-years?${params.toString()}`);
      const data = await fyRes.json();

      if (data && data.data) {
        setFiscalYears(Array.isArray(data.data) ? data.data : []);
        setTotalRecords(data.total || 0);
      } else {
        setFiscalYears(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error loading financial years:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [page, rows, search, sortBy, sortOrder]);

  function startEditing(item) {
    setEditingId(item.id);
    setFormName(item.name);
    setFormIsActive(item.isActive !== false);
    setNameError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setFormName("");
    setFormIsActive(true);
    setNameError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formName.trim()) {
      setNameError("Financial Year name is required (e.g. FY 2025-26).");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `${API_URL}/staff-hrms/recruitment/fiscal-years/${editingId}`
        : `${API_URL}/staff-hrms/recruitment/fiscal-years`;
      const method = editingId ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), isActive: formIsActive }),
      });

      if (res.ok) {
        toast.success(editingId ? "Financial Year updated successfully" : "Financial Year created successfully");
        cancelEdit();
        fetchData();
      } else {
        const msg = await getErrorMessage(res, "Financial Year save failed");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Financial Year save error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/recruitment/fiscal-years/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Financial Year deleted successfully");
        cancelEdit();
        setDeleteTarget(null);
        fetchData();
      } else {
        const msg = await getErrorMessage(res, "Failed to delete Financial Year");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Financial Year delete error:", err);
      toast.error("Failed to delete Financial Year");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleStatus(row) {
    const nextStatus = row.isActive !== false ? false : true;
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/recruitment/fiscal-years/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Financial Year "${row.name}" set to ${nextStatus ? 'Active' : 'Inactive'}`);
        fetchData();
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      console.error("Status update error:", e);
      toast.error("Status update failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-sky-500" aria-hidden="true" />
          Financial Year Master
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" aria-hidden="true" />
              {editingId ? "Edit Financial Year" : "Create Financial Year"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="space-y-1">
                <Label htmlFor="fy-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Financial Year Name
                </Label>
                <Input
                  id="fy-name"
                  placeholder="e.g. FY 2025-26"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                />
                {nameError && (
                  <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5" role="alert">
                    {nameError}
                  </span>
                )}
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
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update" : "Save"}
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

          {/* List Card */}
          <div className="lg:col-span-2">
            <DataTable
              title="All Financial Years"
              lazy
              value={fiscalYears}
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
              emptyMessage="No financial years registered."
              columns={[
                {
                  key: "name",
                  label: "Financial Year Name",
                  render: (row) => (
                    <span className="text-sm font-black text-slate-800 dark:text-white">{row.name}</span>
                  ),
                },
                {
                  key: "requisitions",
                  label: "Active Requisitions",
                  sortable: false,
                  render: (row) => (
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 px-2.5 py-1 rounded-full">
                      {row.activeRequisitions || 0}
                    </span>
                  ),
                },
                {
                  key: "isActive",
                  label: "Status",
                  sortable: false,
                  render: (row) => (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      row.isActive !== false
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}>
                      {row.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  sortable: false,
                  render: (row) => (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEditing(row)}
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all cursor-pointer"
                        title={`Edit financial year ${row.name}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
                        title={`Delete financial year ${row.name}`}
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Financial Year"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
