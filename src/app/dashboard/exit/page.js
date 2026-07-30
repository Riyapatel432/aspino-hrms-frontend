"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import {
  FileWarning,
  ClipboardList,
  Calculator,
  FileCheck,
  Plus,
  Loader2,
  CheckCircle,
  HelpCircle,
  Download,
  Printer,
  Edit2,
  Trash2
} from "lucide-react";

export default function ExitPage() {
  const [activeTab, setActiveTab] = useState("exits");
  const [employees, setEmployees] = useState([]);
  const [exits, setExits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExit, setSelectedExit] = useState(null);
  const [editingExitId, setEditingExitId] = useState(null);

  // Forms state
  const [newExit, setNewExit] = useState({ employeeId: "", type: "RESIGNATION", resignationDate: new Date().toISOString().split('T')[0], noticePeriodDays: 30, lastWorkingDay: "", reason: "" });
  const [settlement, setSettlement] = useState({ pendingSalary: 50000, leaveEncashment: 15000, bonus: 10000, recoveries: 2000 });
  const [letterTemplate, setLetterTemplate] = useState("relieving"); // relieving or experience

  const [formErrors, setFormErrors] = useState({});

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, exitRes] = await Promise.all([
        fetch(`${backendUrl}/staff-hrms/onboarding/employees?limit=1000`),
        fetch(`${backendUrl}/staff-hrms/exit/exits`),
      ]);

      const empData = await empRes.json();
      const exitList = await exitRes.json();

      const validEmployees = Array.isArray(empData.data) ? empData.data : [];
      const validExits = Array.isArray(exitList) ? exitList : (exitList?.data && Array.isArray(exitList.data) ? exitList.data : []);

      setEmployees(validEmployees);
      setExits(validExits);
      
      if (validExits.length > 0 && !selectedExit) {
        setSelectedExit(validExits[0]);
      } else if (validExits.length > 0) {
        const updated = validExits.find(e => e.id === selectedExit?.id);
        setSelectedExit(updated || validExits[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Validation Helpers ---
  const validateExit = () => {
    const errs = {};
    if (!newExit.employeeId) errs.employeeId = "Please select an employee.";
    if (!newExit.type) errs.type = "Please select exit type.";
    if (!newExit.resignationDate) errs.resignationDate = "Resignation/Termination date is required.";
    if (newExit.noticePeriodDays === undefined || newExit.noticePeriodDays === null || newExit.noticePeriodDays < 0) {
      errs.noticePeriodDays = "Notice period days must be 0 or more.";
    }
    if (!newExit.reason?.trim()) errs.reason = "Reason for exit is required.";
    else if (newExit.reason.trim().length < 5) errs.reason = "Reason must be at least 5 characters.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSettlement = () => {
    const errs = {};
    if (settlement.pendingSalary === undefined || settlement.pendingSalary === null || settlement.pendingSalary < 0) {
      errs.pendingSalary = "Pending salary must be 0 or more.";
    }
    if (settlement.leaveEncashment === undefined || settlement.leaveEncashment === null || settlement.leaveEncashment < 0) {
      errs.leaveEncashment = "Leave encashment must be 0 or more.";
    }
    if (settlement.bonus === undefined || settlement.bonus === null || settlement.bonus < 0) {
      errs.bonus = "Bonus must be 0 or more.";
    }
    if (settlement.recoveries === undefined || settlement.recoveries === null || settlement.recoveries < 0) {
      errs.recoveries = "Recoveries must be 0 or more.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInitiateExit = async (e) => {
    e.preventDefault();
    if (!validateExit()) return;
    try {
      let lwd = newExit.lastWorkingDay;
      if (!lwd) {
        const dateObj = new Date(newExit.resignationDate);
        dateObj.setDate(dateObj.getDate() + Number(newExit.noticePeriodDays));
        lwd = dateObj.toISOString().split('T')[0];
      }

      const url = editingExitId 
        ? `${backendUrl}/staff-hrms/exit/exits/${editingExitId}`
        : `${backendUrl}/staff-hrms/exit/exits/initiate`;
        
      const method = editingExitId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newExit, lastWorkingDay: lwd }),
      });
      if (res.ok) {
        setNewExit({ employeeId: "", type: "RESIGNATION", resignationDate: new Date().toISOString().split('T')[0], noticePeriodDays: 30, lastWorkingDay: "", reason: "" });
        setEditingExitId(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExit = async (id) => {
    if (!confirm("Are you sure you want to delete this exit record?")) return;
    try {
      const res = await fetch(`${backendUrl}/staff-hrms/exit/exits/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedExit?.id === id) setSelectedExit(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateClearance = async (taskId, status) => {
    try {
      const res = await fetch(`${backendUrl}/staff-hrms/exit/clearances/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, clearedBy: "HR Manager" }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessSettlement = async (e) => {
    e.preventDefault();
    if (!selectedExit) return;
    if (!validateSettlement()) return;
    try {
      const res = await fetch(`${backendUrl}/staff-hrms/exit/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitProcessId: selectedExit.id, ...settlement }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteExit = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/staff-hrms/exit/exits/${id}/complete`, {
        method: "POST",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto print:hidden">
        {[
          { id: "exits", label: "Resignation & clearance", icon: FileWarning },
          { id: "settlement", label: "F&F Settlement", icon: Calculator },
          { id: "letters", label: "Relieving / Experience Letters", icon: FileCheck },
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
        <div className="flex justify-center items-center py-20 print:hidden">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: RESIGNATIONS & CLEARANCES */}
          {activeTab === "exits" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
              {/* Form Side */}
              <div className="space-y-6 h-fit">
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-500" />
                    {editingExitId ? "Edit Exit Details" : "Register Resignation"}
                  </h3>
                  <form onSubmit={handleInitiateExit} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee</Label>
                      <Select value={newExit.employeeId} onValueChange={(val) => {
                        setNewExit({ ...newExit, employeeId: val });
                        if (formErrors.employeeId) setFormErrors({ ...formErrors, employeeId: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {employees.filter(e => e.status === 'ACTIVE').map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.employeeId && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.employeeId}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Type</Label>
                      <Select value={newExit.type} onValueChange={(val) => {
                        setNewExit({ ...newExit, type: val });
                        if (formErrors.type) setFormErrors({ ...formErrors, type: null });
                      }}>
                        <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="RESIGNATION">RESIGNATION</SelectItem>
                          <SelectItem value="TERMINATION">TERMINATION</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.type && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.type}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Resignation Date</Label>
                      <DateTimePicker type="date" date={newExit.resignationDate} setDate={(val) => {
                        setNewExit({ ...newExit, resignationDate: val });
                        if (formErrors.resignationDate) setFormErrors({ ...formErrors, resignationDate: null });
                      }} />
                      {formErrors.resignationDate && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.resignationDate}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Notice Days</Label>
                        <Input
                          type="number"
                          value={newExit.noticePeriodDays}
                          onChange={(e) => {
                            setNewExit({ ...newExit, noticePeriodDays: Number(e.target.value) });
                            if (formErrors.noticePeriodDays) setFormErrors({ ...formErrors, noticePeriodDays: null });
                          }}
                        />
                        {formErrors.noticePeriodDays && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.noticePeriodDays}</span>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Last Working Day</Label>
                        <DateTimePicker type="date" date={newExit.lastWorkingDay} setDate={(val) => setNewExit({ ...newExit, lastWorkingDay: val })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Reason</Label>
                      <Textarea
                        placeholder="Reason for exit..."
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm dark:bg-slate-950 h-16"
                        value={newExit.reason}
                        onChange={(e) => {
                          setNewExit({ ...newExit, reason: e.target.value });
                          if (formErrors.reason) setFormErrors({ ...formErrors, reason: null });
                        }}
                      />
                      {formErrors.reason && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.reason}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl">
                        {editingExitId ? "Update Exit" : "Initiate Exit Process"}
                      </Button>
                      {(editingExitId || Object.keys(formErrors).length > 0) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingExitId(null);
                            setNewExit({ employeeId: "", type: "RESIGNATION", resignationDate: new Date().toISOString().split('T')[0], noticePeriodDays: 30, lastWorkingDay: "", reason: "" });
                            setFormErrors({});
                          }}
                          className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* List & Details Side */}
              <div className="lg:col-span-2 space-y-6">
                <DataTable
                  title="Active Exits & Clearance Workflow"
                  data={exits}
                  emptyMessage="No employee exit processes logged."
                  columns={[
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
                      key: "type",
                      label: "Type",
                      render: (row) => <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{row.type}</span>,
                    },
                    {
                      key: "resignationDate",
                      label: "Resignation Date",
                      render: (row) => (
                        <span className="text-xs text-slate-500">
                          {row.resignationDate ? new Date(row.resignationDate).toLocaleDateString() : "—"}
                        </span>
                      ),
                    },
                    {
                      key: "lastWorkingDay",
                      label: "Last Working Day",
                      render: (row) => (
                        <span className="text-xs font-bold text-sky-500">
                          {row.lastWorkingDay ? new Date(row.lastWorkingDay).toLocaleDateString() : "—"}
                        </span>
                      ),
                    },
                    {
                      key: "noticePeriodDays",
                      label: "Notice Days",
                    },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => (
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          row.status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                          : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}>
                          {row.status}
                        </span>
                      ),
                    },
                    {
                      key: "clearances",
                      label: "Clearances",
                      sortable: false,
                      render: (row) => (
                        <div className="space-y-1.5">
                          {(row.clearances || []).map((task) => (
                            <div key={task.id} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{task.department}</span>
                              {task.status === "PENDING" ? (
                                <button
                                  onClick={() => handleUpdateClearance(task.id, "CLEARED")}
                                  className="bg-emerald-500 dark:bg-emerald-600 text-white text-[9px] font-bold rounded px-1.5 py-0.5 cursor-pointer"
                                >
                                  Clear
                                </button>
                              ) : (
                                <span className="text-[9px] text-emerald-500 font-black">CLEARED</span>
                              )}
                            </div>
                          ))}
                        </div>
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
                              setEditingExitId(row.id);
                              setNewExit({
                                employeeId: String(row.employeeId),
                                type: row.type,
                                resignationDate: row.resignationDate ? new Date(row.resignationDate).toISOString().split('T')[0] : "",
                                noticePeriodDays: row.noticePeriodDays || 0,
                                lastWorkingDay: row.lastWorkingDay ? new Date(row.lastWorkingDay).toISOString().split('T')[0] : "",
                                reason: row.reason || "",
                              });
                            }}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExit(row.id)}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-500 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    }
                  ]}
                  searchKeys={["employee.firstName", "employee.lastName", "type", "status"]}
                />
              </div>
            </div>
          )}

          {/* TAB 2: FULL & FINAL SETTLEMENT */}
          {activeTab === "settlement" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
              {/* Select Exit Profile */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 h-fit">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-sky-500" />
                  Select Profile
                </h3>
                {exits.length === 0 ? (
                  <p className="text-slate-500 text-xs">No active exits logged.</p>
                ) : (
                  <div className="space-y-2">
                    {exits.map((exit) => (
                      <button
                        key={exit.id}
                        onClick={() => setSelectedExit(exit)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                          selectedExit?.id === exit.id
                            ? "border-sky-50 dark:border-sky-500/200 bg-sky-50 dark:bg-sky-500/10/70 text-sky-600 dark:text-sky-400 dark:bg-sky-950/40"
                            : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-slate-850"
                        }`}
                      >
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                          {exit.employee?.firstName} {exit.employee?.lastName}
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-400">LWD: {new Date(exit.lastWorkingDay).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settlement Form and Details */}
              <div className="lg:col-span-2 space-y-6">
                {selectedExit ? (
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6">
                    <div className="space-y-1">
                      <h3 className="font-black text-slate-800 dark:text-white text-lg">
                        Full & Final Settlement: {selectedExit.employee?.firstName} {selectedExit.employee?.lastName}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        Exit status: <strong>{selectedExit.status}</strong>
                      </p>
                    </div>

                    <form onSubmit={handleProcessSettlement} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Pending Salary Dues (INR)</Label>
                        <Input
                          type="number"
                          value={settlement.pendingSalary}
                          onChange={(e) => {
                            setSettlement({ ...settlement, pendingSalary: Number(e.target.value) });
                            if (formErrors.pendingSalary) setFormErrors({ ...formErrors, pendingSalary: null });
                          }}
                        />
                        {formErrors.pendingSalary && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.pendingSalary}</span>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Leave Encashment (INR)</Label>
                        <Input
                          type="number"
                          value={settlement.leaveEncashment}
                          onChange={(e) => {
                            setSettlement({ ...settlement, leaveEncashment: Number(e.target.value) });
                            if (formErrors.leaveEncashment) setFormErrors({ ...formErrors, leaveEncashment: null });
                          }}
                        />
                        {formErrors.leaveEncashment && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.leaveEncashment}</span>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Performance Bonus (INR)</Label>
                        <Input
                          type="number"
                          value={settlement.bonus}
                          onChange={(e) => {
                            setSettlement({ ...settlement, bonus: Number(e.target.value) });
                            if (formErrors.bonus) setFormErrors({ ...formErrors, bonus: null });
                          }}
                        />
                        {formErrors.bonus && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.bonus}</span>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Recoveries / Asset Damage (INR)</Label>
                        <Input
                          type="number"
                          value={settlement.recoveries}
                          onChange={(e) => {
                            setSettlement({ ...settlement, recoveries: Number(e.target.value) });
                            if (formErrors.recoveries) setFormErrors({ ...formErrors, recoveries: null });
                          }}
                        />
                        {formErrors.recoveries && <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5">{formErrors.recoveries}</span>}
                      </div>

                      <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Estimated Net Payable: <strong className="text-emerald-500">₹{(settlement.pendingSalary + settlement.leaveEncashment + settlement.bonus - settlement.recoveries).toLocaleString('en-IN')}</strong>
                        </div>
                        <Button type="submit" className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl h-10 px-6">
                          Record Final Dues
                        </Button>
                      </div>
                    </form>

                    {selectedExit.settlement && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                        <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-200">SAVED SETTLEMENT SUMMARY:</h4>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 space-y-1 grid grid-cols-2">
                          <div>Net Dues: <strong>₹{selectedExit.settlement.netPayable.toLocaleString('en-IN')}</strong></div>
                          <div>Status: <strong>{selectedExit.settlement.paymentStatus}</strong></div>
                        </div>
                        {selectedExit.status === 'SETTLED' && (
                          <div className="pt-2">
                            <Button
                              onClick={() => handleCompleteExit(selectedExit.id)}
                              className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl h-9"
                            >
                              Finalize Exit & Approve Relieving Letter
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Select an exit profile to manage settlement.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LETTER TEMPLATE PRINT GENERATOR */}
          {activeTab === "letters" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-md flex flex-wrap justify-between items-center gap-4 print:hidden">
                <div className="flex gap-4 items-center">
                  <Label className="text-xs font-bold text-slate-650">Select Profile</Label>
                  <Select value={selectedExit?.id || ""} onValueChange={(val) => {
                      const exit = exits.find(ex => ex.id === Number(val));
                      if (exit) setSelectedExit(exit);
                    }}>
<SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
<SelectValue placeholder="Select..." />
</SelectTrigger>
<SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

                    
                    {exits.map((ex) => (
                      <SelectItem key={ex.id} value={String(ex.id)}>{ex.employee?.firstName} {ex.employee?.lastName}</SelectItem>
                    ))}
                  </SelectContent>
</Select>

                  <Select value={letterTemplate} onValueChange={(val) => setLetterTemplate(val)}>
<SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
<SelectValue placeholder="Select..." />
</SelectTrigger>
<SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">

                    <SelectItem value="relieving">Relieving Letter</SelectItem>
                    <SelectItem value="experience">Experience Letter</SelectItem>
                  </SelectContent>
</Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handlePrint} className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 h-10 px-4">
                    <Printer className="w-4 h-4" /> Print Document
                  </Button>
                </div>
              </div>

              {selectedExit ? (
                /* Print Letter Frame */
                <div className="bg-white dark:bg-slate-900 text-black dark:text-white p-8 sm:p-12 shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800 max-w-[800px] mx-auto min-h-[1000px] flex flex-col justify-between font-serif relative">
                  {/* Watermark Logo / Top Header */}
                  <div className="flex justify-between items-start border-b-2 border-[#1e40af] pb-6">
                    <div className="flex flex-col">
                      <h1 className="text-2xl font-black tracking-tight text-[#1e40af] font-sans leading-none">
                        Aspino Speciality Chemicals Pvt. Ltd.
                      </h1>
                      <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mt-1.5">
                        FDA & GMP Certified Manufacturing Facility | Corporate HQ
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 py-10 space-y-6 text-sm leading-relaxed">
                    <div className="flex justify-between text-xs font-sans font-bold text-slate-500">
                      <span>Ref: ASP/HR/EXIT/{selectedExit.id}</span>
                      <span>Date: {new Date().toLocaleDateString()}</span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-extrabold">TO WHOMSOEVER IT MAY CONCERN</div>
                    </div>

                    {letterTemplate === 'relieving' ? (
                      /* Relieving Letter template */
                      <div className="space-y-4 text-justify">
                        <p>
                          This is to confirm that <strong>{selectedExit.employee?.firstName} {selectedExit.employee?.lastName}</strong> (Employee ID: <strong>{selectedExit.employee?.employeeId}</strong>) was employed with Aspino Speciality Chemicals Private Limited as a <strong>{selectedExit.employee?.designation}</strong> from <strong>{new Date(selectedExit.employee?.dateOfJoining).toLocaleDateString()}</strong> to <strong>{new Date(selectedExit.lastWorkingDay).toLocaleDateString()}</strong>.
                        </p>
                        <p>
                          Consequent to their resignation dated <strong>{new Date(selectedExit.resignationDate).toLocaleDateString()}</strong>, we hereby confirm that they are relieved of all duties and responsibilities with effect from the close of business hours on <strong>{new Date(selectedExit.lastWorkingDay).toLocaleDateString()}</strong>.
                        </p>
                        <p>
                          We confirm that all departmental clearances (including IT assets, stores, library, and finance dues) have been completed successfully. Their Full & Final settlement has been processed and paid.
                        </p>
                        <p>
                          We wish them success in their future endeavors.
                        </p>
                      </div>
                    ) : (
                      /* Experience Letter template */
                      <div className="space-y-4 text-justify">
                        <p>
                          This is to certify that <strong>{selectedExit.employee?.firstName} {selectedExit.employee?.lastName}</strong> was employed with Aspino Speciality Chemicals Private Limited from <strong>{new Date(selectedExit.employee?.dateOfJoining).toLocaleDateString()}</strong> to <strong>{new Date(selectedExit.lastWorkingDay).toLocaleDateString()}</strong>.
                        </p>
                        <p>
                          During their tenure, they held the designation of <strong>{selectedExit.employee?.designation}</strong> in the <strong>{selectedExit.employee?.department}</strong> department.
                        </p>
                        <p>
                          Their duties included supervising and operating chemical processing units, quality control analysis, and maintaining regulatory GMP safety compliance records. They have consistently demonstrated a professional attitude and strong execution capability.
                        </p>
                        <p>
                          Their conduct was exemplary during their tenure. We wish them all the best in their future career.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sign-off */}
                  <div className="pt-12 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end text-xs font-sans">
                    <div className="flex flex-col space-y-1">
                      <span className="font-bold">Human Resources Dept.</span>
                      <span className="text-slate-500">Aspino Speciality Chemicals Pvt. Ltd.</span>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="w-32 h-10 border-b border-slate-350 flex items-center justify-center italic text-slate-400">
                        [Digital Signature]
                      </div>
                      <span className="font-bold">Authorized Signatory</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm print:hidden">Select an exit profile to display Relieving/Experience document preview.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
