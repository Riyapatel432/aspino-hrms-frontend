"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import {
  FolderTree,
  Plus,
  Trash2,
  Edit,
  Loader2
} from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newDeptName, setNewDeptName] = useState("");
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const validateDepartment = (name) => {
    const errs = {};
    if (!name?.trim()) errs.name = "Department name is required.";
    else if (name.trim().length < 2) errs.name = "Department name must be at least 2 characters.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, reqRes] = await Promise.all([
        fetch(`${backendUrl}/staff-hrms/recruitment/departments`),
        fetch(`${backendUrl}/staff-hrms/recruitment/requisitions?limit=1000`),
      ]);

      setDepartments(await deptRes.json());
      const reqData = await reqRes.json();
      setRequisitions(reqData.data || []);
    } catch (e) {
      console.error("Error loading department data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!validateDepartment(newDeptName)) return;
    try {
      const res = await fetch(`${backendUrl}/staff-hrms/recruitment/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDeptName }),
      });
      if (res.ok) {
        setNewDeptName("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    if (!editingDeptId || !validateDepartment(editingDeptName)) return;
    try {
      const res = await fetch(`${backendUrl}/staff-hrms/recruitment/departments/${editingDeptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingDeptName }),
      });
      if (res.ok) {
        setEditingDeptId(null);
        setEditingDeptName("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDepartment = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/staff-hrms/recruitment/departments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FolderTree className="w-6 h-6 text-sky-500" />
          Department Master
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
              <Plus className="w-5 h-5 text-sky-500" />
              {editingDeptId ? "Edit Department" : "Create Department"}
            </h3>
            <form onSubmit={editingDeptId ? handleUpdateDepartment : handleCreateDepartment} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Department Name</Label>
                <Input
                  placeholder="e.g. Quality Control"
                  value={editingDeptId ? editingDeptName : newDeptName}
                  onChange={(e) => {
                    if (editingDeptId) {
                      setEditingDeptName(e.target.value);
                    } else {
                      setNewDeptName(e.target.value);
                    }
                    if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                  }}
                />
                {formErrors.name && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.name}</span>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl">
                  {editingDeptId ? "Update" : "Save"}
                </Button>
                {editingDeptId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl font-bold"
                    onClick={() => {
                      setEditingDeptId(null);
                      setEditingDeptName("");
                      setFormErrors({});
                    }}
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
                        onClick={() => {
                          setEditingDeptId(row.id);
                          setEditingDeptName(row.name);
                        }}
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(row.id)}
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all cursor-pointer"
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
  );
}
