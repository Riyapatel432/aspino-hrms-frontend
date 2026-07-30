"use client";

import { useState } from "react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  fetchLeaveMasters,
  createLeaveMaster,
  deleteLeaveMaster,
} from "@/redux/slices/leaveSlice";
import { fetchDepartments } from "@/redux/slices/recruitmentSlice";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

export default function LeaveMasterPage() {
  const dispatch = useDispatch();
  
  const { leaveMasters = [], loading: isLoadingLM } = useSelector((state) => state.leave);
  const { departments = [], loading: isLoadingDept } = useSelector((state) => state.recruitment);

  useEffect(() => {
    dispatch(fetchLeaveMasters());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const loading = isLoadingLM || isLoadingDept;

  const [newLeaveMaster, setNewLeaveMaster] = useState({ 
    department: "", 
    fiscalYear: "FY26", 
    casualLeave: 12, 
    sickLeave: 10, 
    earnedLeave: 15, 
    otherLeave: 0, 
    effectiveFrom: new Date().toISOString().split('T')[0] 
  });
  const [formErrors, setFormErrors] = useState({});

  const validateLeaveMaster = () => {
    const errs = {};
    if (!newLeaveMaster.department) errs.department = "Please select a department.";
    if (!newLeaveMaster.fiscalYear) errs.fiscalYear = "Please select a fiscal year.";
    if (newLeaveMaster.casualLeave === undefined || newLeaveMaster.casualLeave === null || newLeaveMaster.casualLeave < 0) {
      errs.casualLeave = "Casual leave must be 0 or more.";
    }
    if (newLeaveMaster.sickLeave === undefined || newLeaveMaster.sickLeave === null || newLeaveMaster.sickLeave < 0) {
      errs.sickLeave = "Sick leave must be 0 or more.";
    }
    if (newLeaveMaster.earnedLeave === undefined || newLeaveMaster.earnedLeave === null || newLeaveMaster.earnedLeave < 0) {
      errs.earnedLeave = "Earned leave must be 0 or more.";
    }
    if (!newLeaveMaster.effectiveFrom) errs.effectiveFrom = "Effective From date is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateLeaveMaster = async (e) => {
    e.preventDefault();
    if (!validateLeaveMaster()) return;
    try {
      await dispatch(createLeaveMaster({
        ...newLeaveMaster,
        casualLeave: Number(newLeaveMaster.casualLeave),
        sickLeave: Number(newLeaveMaster.sickLeave),
        earnedLeave: Number(newLeaveMaster.earnedLeave),
        otherLeave: Number(newLeaveMaster.otherLeave),
      })).unwrap();
      
      setNewLeaveMaster({ department: "", fiscalYear: "FY26", casualLeave: 12, sickLeave: 10, earnedLeave: 15, otherLeave: 0, effectiveFrom: new Date().toISOString().split('T')[0] });
      setFormErrors({});
      toast.success("Leave Master created successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create Leave Master");
    }
  };

  const handleDeleteLeaveMaster = async (id) => {
    try {
      await dispatch(deleteLeaveMaster(id)).unwrap();
      toast.success("Leave Master deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete Leave Master");
    }
  };

  const leaveMasterColumns = [
    { key: "department", label: "Department", render: (row) => <span className="font-extrabold text-slate-800 dark:text-white">{row.department}</span> },
    { key: "fiscalYear", label: "Fiscal Year", render: (row) => <span className="text-xs font-bold text-sky-500">{row.fiscalYear}</span> },
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
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (row) => (
        <button
          onClick={() => handleDeleteLeaveMaster(row.id)}
          className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
            Define Leave Master
          </h3>
          <form onSubmit={handleCreateLeaveMaster} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Department</Label>
                <Select value={newLeaveMaster.department} onValueChange={(val) => {
                  setNewLeaveMaster({ ...newLeaveMaster, department: val });
                  if (formErrors.department) setFormErrors({ ...formErrors, department: null });
                }}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {departments.map(d => (
                      <SelectItem key={d.id} value={String(d.name)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="FY24">FY24</SelectItem>
                    <SelectItem value="FY25">FY25</SelectItem>
                    <SelectItem value="FY26">FY26</SelectItem>
                    <SelectItem value="FY27">FY27</SelectItem>
                    <SelectItem value="FY28">FY28</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.fiscalYear && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.fiscalYear}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Casual Leave</Label>
                <Input type="number" value={newLeaveMaster.casualLeave} onChange={(e) => {
                  setNewLeaveMaster({ ...newLeaveMaster, casualLeave: Number(e.target.value) });
                  if (formErrors.casualLeave) setFormErrors({ ...formErrors, casualLeave: null });
                }} />
                {formErrors.casualLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.casualLeave}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Sick Leave</Label>
                <Input type="number" value={newLeaveMaster.sickLeave} onChange={(e) => {
                  setNewLeaveMaster({ ...newLeaveMaster, sickLeave: Number(e.target.value) });
                  if (formErrors.sickLeave) setFormErrors({ ...formErrors, sickLeave: null });
                }} />
                {formErrors.sickLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.sickLeave}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Earned Leave</Label>
                <Input type="number" value={newLeaveMaster.earnedLeave} onChange={(e) => {
                  setNewLeaveMaster({ ...newLeaveMaster, earnedLeave: Number(e.target.value) });
                  if (formErrors.earnedLeave) setFormErrors({ ...formErrors, earnedLeave: null });
                }} />
                {formErrors.earnedLeave && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.earnedLeave}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Other Leave</Label>
                <Input type="number" value={newLeaveMaster.otherLeave} onChange={(e) => setNewLeaveMaster({ ...newLeaveMaster, otherLeave: Number(e.target.value) })} />
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
            <Button type="submit" className="w-full bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl mt-2">Save Master</Button>
          </form>
        </div>
        {/* Leave Master DataTable */}
        <div className="lg:col-span-2">
          <DataTable
            title="Department Leave Master"
            data={leaveMasters}
            columns={leaveMasterColumns}
            searchKeys={["department", "fiscalYear"]}
            emptyMessage="No leave master configured."
          />
        </div>
      </div>
    </div>
  );
}
