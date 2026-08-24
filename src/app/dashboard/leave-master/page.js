"use client";

import { useState } from "react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
} from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { Switch } from "@/components/ui/switch";
import {
  fetchLeaveMasters,
  createLeaveMaster,
  updateLeaveMaster,
  deleteLeaveMaster,
} from "@/features/leave/store/leaveSlice";
import { fetchDepartments } from "@/features/recruitment/store/recruitmentSlice";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function LeaveMasterPage() {
  const dispatch = useDispatch();
  
  const { leaveMasters = [], totalLeaveMasters = 0, loading: isLoadingLM } = useSelector((state) => state.leave);
  const { departments = [], loading: isLoadingDept } = useSelector((state) => state.recruitment);

  // Server-side Data Handling state
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("department");
  const [sortOrder, setSortOrder] = useState("asc");

  const [localDepts, setLocalDepts] = useState([]);
  const [fiscalYearOptions, setFiscalYearOptions] = useState([]);
  const [requisitions, setRequisitions] = useState([]);

  useEffect(() => {
    dispatch(fetchLeaveMasters({ page, limit: rows, search, sortBy, sortOrder }));
    dispatch(fetchDepartments());

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    apiFetch(`${backendUrl}/staff-hrms/recruitment/departments`)
      .then(res => res.json())
      .then(data => setLocalDepts(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    apiFetch(`${backendUrl}/staff-hrms/recruitment/fiscal-years`)
      .then(res => res.json())
      .then(data => setFiscalYearOptions(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch fiscal years:", err));

    apiFetch(`${backendUrl}/staff-hrms/recruitment/requisitions`)
      .then(res => res.json())
      .then(data => setRequisitions(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(err => console.error("Failed to fetch requisitions:", err));
  }, [dispatch, page, rows, search, sortBy, sortOrder]);

  const deptOptions = departments.length > 0 ? departments : localDepts;
  const loading = isLoadingLM;

  const [editingId, setEditingId] = useState(null);
  const [newLeaveMaster, setNewLeaveMaster] = useState({ 
    department: "", 
    fiscalYear: "", 
    casualLeave: "", 
    sickLeave: "", 
    earnedLeave: "", 
    otherLeave: "", 
    effectiveFrom: "",
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  const startEditing = (row) => {
    setEditingId(row.id);
    const deptVal = typeof row.department === 'object' && row.department ? row.department.id : row.department;
    const fyObj = typeof row.fiscalYear === 'object' && row.fiscalYear ? row.fiscalYear : null;
    const fyRaw = fyObj ? (fyObj.id || fyObj.name) : row.fiscalYear;

    const matchedFy = fiscalYearOptions.find(
      (f) => String(f.id) === String(fyRaw) || String(f.name) === String(fyRaw) || String(f.code) === String(fyRaw) || (fyObj && (String(f.id) === String(fyObj.id) || String(f.name) === String(fyObj.name)))
    );

    const targetFyId = matchedFy ? matchedFy.id : fyRaw;

    setNewLeaveMaster({
      department: deptVal,
      fiscalYear: targetFyId,
      casualLeave: String(row.casualLeave),
      sickLeave: String(row.sickLeave),
      earnedLeave: String(row.earnedLeave),
      otherLeave: String(row.otherLeave || 0),
      effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom).toISOString().split('T')[0] : "",
      isActive: row.isActive !== false,
    });
    setFormErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewLeaveMaster({ department: "", fiscalYear: "", casualLeave: "", sickLeave: "", earnedLeave: "", otherLeave: "", effectiveFrom: "", isActive: true });
    setFormErrors({});
  };

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  const validateLeaveMaster = () => {
    const errs = {};
    if (!newLeaveMaster.department) errs.department = "Please select a department.";
    if (!newLeaveMaster.fiscalYear) errs.fiscalYear = "Please select a fiscal year.";
    if (newLeaveMaster.casualLeave === "" || newLeaveMaster.casualLeave === undefined || newLeaveMaster.casualLeave === null) {
      errs.casualLeave = "Casual leave is required.";
    } else if (Number(newLeaveMaster.casualLeave) < 0) {
      errs.casualLeave = "Casual leave must be 0 or more.";
    }
    if (newLeaveMaster.sickLeave === "" || newLeaveMaster.sickLeave === undefined || newLeaveMaster.sickLeave === null) {
      errs.sickLeave = "Sick leave is required.";
    } else if (Number(newLeaveMaster.sickLeave) < 0) {
      errs.sickLeave = "Sick leave must be 0 or more.";
    }
    if (newLeaveMaster.earnedLeave === "" || newLeaveMaster.earnedLeave === undefined || newLeaveMaster.earnedLeave === null) {
      errs.earnedLeave = "Earned leave is required.";
    } else if (Number(newLeaveMaster.earnedLeave) < 0) {
      errs.earnedLeave = "Earned leave must be 0 or more.";
    }
    if (newLeaveMaster.otherLeave === "" || newLeaveMaster.otherLeave === undefined || newLeaveMaster.otherLeave === null) {
      errs.otherLeave = "Other leave is required.";
    } else if (Number(newLeaveMaster.otherLeave) < 0) {
      errs.otherLeave = "Other leave must be 0 or more.";
    }
    if (!newLeaveMaster.effectiveFrom) errs.effectiveFrom = "Effective From date is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveLeaveMaster = async (e) => {
    e.preventDefault();
    if (!validateLeaveMaster()) return;
    try {
      const payload = {
        ...newLeaveMaster,
        casualLeave: Number(newLeaveMaster.casualLeave),
        sickLeave: Number(newLeaveMaster.sickLeave),
        earnedLeave: Number(newLeaveMaster.earnedLeave),
        otherLeave: Number(newLeaveMaster.otherLeave),
        isActive: newLeaveMaster.isActive !== false
      };

      if (editingId) {
        await dispatch(updateLeaveMaster({ id: editingId, data: payload })).unwrap();
        toast.success("Leave Master updated successfully");
      } else {
        await dispatch(createLeaveMaster(payload)).unwrap();
        toast.success("Leave Master created successfully");
      }
      
      cancelEdit();
      dispatch(fetchLeaveMasters({ page, limit: rows, search, sortBy, sortOrder }));
    } catch (err) {
      console.error(err);
      toast.error(typeof err === "string" ? err : "Failed to save Leave Master");
    }
  };

  const handleDeleteLeaveMaster = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteLeaveMaster(deleteTarget.id)).unwrap();
      cancelEdit();
      setDeleteTarget(null);
      toast.success("Leave Master deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Leave Master");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (row) => {
    const nextStatus = row.isActive !== false ? false : true;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await apiFetch(`${backendUrl}/staff-hrms/leave/leave-master/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Leave Master "${row.department} (${row.fiscalYear})" set to ${nextStatus ? 'Active' : 'Inactive'}`);
        dispatch(fetchLeaveMasters({ page, limit: rows, search, sortBy, sortOrder }));
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      console.error("Status update error:", e);
      toast.error("Status update failed");
    }
  };

  const leaveMasterColumns = [
    { 
      key: "department", 
      label: "Department", 
      render: (row) => {
        const deptVal = typeof row.department === 'object' && row.department ? row.department.name : row.department;
        const deptId = typeof row.department === 'object' && row.department ? row.department.id : row.department;
        const deptObj = deptOptions.find((d) => String(d.id) === String(deptId) || String(d.name).toLowerCase() === String(deptVal).toLowerCase());
        return <span className="font-extrabold text-slate-800 dark:text-white">{deptObj ? deptObj.name : deptVal}</span>;
      } 
    },
    { 
      key: "fiscalYear", 
      label: "Fiscal Year", 
      render: (row) => {
        const fyVal = typeof row.fiscalYear === 'object' && row.fiscalYear ? row.fiscalYear.name : row.fiscalYear;
        const fyId = typeof row.fiscalYear === 'object' && row.fiscalYear ? row.fiscalYear.id : row.fiscalYear;
        const fyObj = fiscalYearOptions.find((f) => String(f.id) === String(fyId) || String(f.code) === String(fyVal) || String(f.name).toLowerCase() === String(fyVal).toLowerCase());
        return <span className="text-xs font-bold text-sky-500">{fyObj ? fyObj.name : fyVal}</span>;
      } 
    },
    {
      key: "requisitions",
      label: "Active Requisitions",
      sortable: false,
      render: (row) => {
        const deptVal = typeof row.department === 'object' && row.department ? row.department.name : row.department;
        const deptId = typeof row.department === 'object' && row.department ? row.department.id : row.department;
        const deptObj = deptOptions.find((d) => String(d.id) === String(deptId) || String(d.name).toLowerCase() === String(deptVal).toLowerCase());
        const targetDeptId = deptObj ? deptObj.id : deptId;
        const targetDeptName = deptObj ? deptObj.name : deptVal;

        const count = requisitions.filter((r) => 
          (r.departmentId && String(r.departmentId) === String(targetDeptId)) ||
          (r.department?.id && String(r.department.id) === String(targetDeptId)) ||
          (r.department?.name && String(r.department.name).toLowerCase() === String(targetDeptName).toLowerCase()) ||
          (typeof r.department === "string" && String(r.department).toLowerCase() === String(targetDeptName).toLowerCase())
        ).length;

        return (
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 px-2.5 py-1 rounded-full">
            {count}
          </span>
        );
      },
    },
    { key: "totalLeave", label: "Total Quota", render: (row) => <span className="text-xs font-black">{row.totalLeave} days</span> },
    {
      key: "details",
      label: "Breakdown",
      render: (row) => (
        <div className="text-[10px] text-slate-500 font-medium">
          Casual: {row.casualLeave} | Sick: {row.sickLeave} | Earned: {row.earnedLeave} | Other: {row.otherLeave}
        </div>
      ),
    },
    {
      key: "effectiveFrom",
      label: "Effective From",
      render: (row) => <span className="text-xs text-slate-500">{new Date(row.effectiveFrom).toLocaleDateString()}</span>
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
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
            title="Edit Leave Master"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const deptName = typeof row.department === 'object' && row.department ? row.department.name : row.department;
              const fyName = typeof row.fiscalYear === 'object' && row.fiscalYear ? row.fiscalYear.name : row.fiscalYear;
              setDeleteTarget({ id: row.id, name: `${deptName} (${fyName})` });
            }}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all"
            title="Delete Leave Master"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 border dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Department Leave Master</h2>
          <span className="text-xs font-semibold text-slate-400">Configure yearly leave quotas across departments.</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Master Form */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-sky-500" />
            {editingId ? "Edit Leave Master" : "Define Leave Master"}
          </h3>
          <form onSubmit={handleSaveLeaveMaster} className="space-y-3" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Department</Label>
                <SearchableSelect
                  options={deptOptions.filter(d => d.isActive !== false).map(d => ({
                    value: String(d.id),
                    label: d.name
                  }))}
                  value={newLeaveMaster.department}
                  onValueChange={(val) => {
                    setNewLeaveMaster({ ...newLeaveMaster, department: val });
                    if (formErrors.department) setFormErrors({ ...formErrors, department: null });
                  }}
                  placeholder="Select department..."
                  searchPlaceholder="Search departments..."
                  className={formErrors.department ? "border-rose-500 border-2" : ""}
                />
                {formErrors.department && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.department}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Fiscal Year</Label>
                <Select value={newLeaveMaster.fiscalYear} onValueChange={(val) => {
                  setNewLeaveMaster({ ...newLeaveMaster, fiscalYear: val });
                  if (formErrors.fiscalYear) setFormErrors({ ...formErrors, fiscalYear: null });
                }}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {(fiscalYearOptions.length > 0 ? fiscalYearOptions : [
                      { id: "FY25", name: "FY 2024-25", code: "FY25" },
                      { id: "FY26", name: "FY 2025-26", code: "FY26" },
                      { id: "FY27", name: "FY 2026-27", code: "FY27" },
                      { id: "FY28", name: "FY 2027-28", code: "FY28" }
                    ]).filter(fy => fy.isActive !== false).map(fy => (
                      <SelectItem key={fy.id || fy.code || fy.name} value={String(fy.id)}>
                        {fy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.fiscalYear && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.fiscalYear}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Casual Leave</Label>
                <Input type="number" min="0" value={newLeaveMaster.casualLeave} onChange={(e) => {
                  setNewLeaveMaster({ ...newLeaveMaster, casualLeave: e.target.value });
                  if (formErrors.casualLeave) setFormErrors({ ...formErrors, casualLeave: null });
                }} />
                {formErrors.casualLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.casualLeave}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Sick Leave</Label>
                <Input type="number" min="0" value={newLeaveMaster.sickLeave} onChange={(e) => {
                  setNewLeaveMaster({ ...newLeaveMaster, sickLeave: e.target.value });
                  if (formErrors.sickLeave) setFormErrors({ ...formErrors, sickLeave: null });
                }} />
                {formErrors.sickLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.sickLeave}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Earned Leave</Label>
                <Input type="number" min="0" value={newLeaveMaster.earnedLeave} onChange={(e) => {
                  setNewLeaveMaster({ ...newLeaveMaster, earnedLeave: e.target.value });
                  if (formErrors.earnedLeave) setFormErrors({ ...formErrors, earnedLeave: null });
                }} />
                {formErrors.earnedLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.earnedLeave}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Other Leave</Label>
                <Input type="number" min="0" value={newLeaveMaster.otherLeave} onChange={(e) => {
                  setNewLeaveMaster({ ...newLeaveMaster, otherLeave: e.target.value });
                  if (formErrors.otherLeave) setFormErrors({ ...formErrors, otherLeave: null });
                }} />
                {formErrors.otherLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.otherLeave}</span>}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Effective From</Label>
              <DateTimePicker type="date" date={newLeaveMaster.effectiveFrom} setDate={(val) => {
                setNewLeaveMaster({ ...newLeaveMaster, effectiveFrom: val });
                if (formErrors.effectiveFrom) setFormErrors({ ...formErrors, effectiveFrom: null });
              }} />
              {formErrors.effectiveFrom && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.effectiveFrom}</span>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Status</Label>
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
                <Switch
                  checked={newLeaveMaster.isActive !== false}
                  onCheckedChange={(val) => setNewLeaveMaster({ ...newLeaveMaster, isActive: val })}
                />
                <span className={`text-xs font-bold ${newLeaveMaster.isActive !== false ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                  {newLeaveMaster.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl">
                {editingId ? "Update Master" : "Save Master"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" className="rounded-xl font-bold" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
        {/* Leave Master DataTable */}
        <div className="lg:col-span-2">
          <DataTable
            title="Active Leave Master Quotas"
            lazy
            value={leaveMasters}
            totalRecords={totalLeaveMasters}
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
            columns={leaveMasterColumns}
            emptyMessage="No leave master entries configured."
          />
        </div>
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteLeaveMaster}
        loading={deleting}
        title="Delete Leave Master"
        description={
          deleteTarget
            ? `Are you sure you want to delete the leave master for "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
