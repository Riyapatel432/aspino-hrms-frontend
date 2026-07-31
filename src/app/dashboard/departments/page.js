"use client";

import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------
const DEPT_NAME_MIN_LENGTH = 2;

function validateDepartmentName(name) {
  if (!name?.trim()) return "Department name is required.";
  if (name.trim().length < DEPT_NAME_MIN_LENGTH)
    return `Department name must be at least ${DEPT_NAME_MIN_LENGTH} characters.`;
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formName, setFormName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  async function fetchData() {
    setLoading(true);
    try {
      const [deptRes, reqRes] = await Promise.all([
        apiFetch(`${API_URL}/staff-hrms/recruitment/departments`),
        apiFetch(`${API_URL}/staff-hrms/recruitment/requisitions?limit=1000`),
      ]);

      const deptData = await deptRes.json();
      const reqData = await reqRes.json();

      setDepartments(Array.isArray(deptData) ? deptData : []);
      setRequisitions(Array.isArray(reqData.data) ? reqData.data : []);
    } catch (e) {
      console.error("Error loading department data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function load() { await fetchData(); }
    load();
  }, []);


  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------
  function startEditing(dept) {
    setEditingId(dept.id);
    setFormName(dept.name);
    setNameError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setFormName("");
    setNameError(null);
  }

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    const error = validateDepartmentName(formName);
    if (error) {
      setNameError(error);
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId
        ? `${API_URL}/staff-hrms/recruitment/departments/${editingId}`
        : `${API_URL}/staff-hrms/recruitment/departments`;
      const method = editingId ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim() }),
      });

      if (res.ok) {
        cancelEdit();
        fetchData();
      } else {
        console.error("Department save failed:", await res.text());
      }
    } catch (err) {
      console.error("Department save error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`${API_URL}/staff-hrms/recruitment/departments/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchData();
      } else {
        console.error("Department delete failed:", await res.text());
      }
    } catch (err) {
      console.error("Department delete error:", err);
    } finally {
      setDeleting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FolderTree className="w-6 h-6 text-sky-500" aria-hidden="true" />
          Department Master
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20" aria-label="Loading departments">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" aria-hidden="true" />
              {editingId ? "Edit Department" : "Create Department"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="space-y-1">
                <Label htmlFor="dept-name" className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Department Name
                </Label>
                <Input
                  id="dept-name"
                  placeholder="e.g. Quality Control"
                  value={formName}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "dept-name-error" : undefined}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                />
                {nameError && (
                  <span id="dept-name-error" className="text-rose-500 text-[10.5px] font-bold block mt-0.5" role="alert">
                    {nameError}
                  </span>
                )}
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
              title="All Departments"
              data={departments}
              searchKeys={["name"]}
              emptyMessage="No departments registered."
              columns={[
                {
                  key: "name",
                  label: "Department Name",
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
                      {requisitions.filter((r) => r.departmentId === row.id).length}
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
                        title={`Edit department ${row.name}`}
                        aria-label={`Edit department ${row.name}`}
                      >
                        <Edit className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: row.id, name: row.name })}
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
                        title={`Delete department ${row.name}`}
                        aria-label={`Delete department ${row.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
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
        title="Delete Department"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
