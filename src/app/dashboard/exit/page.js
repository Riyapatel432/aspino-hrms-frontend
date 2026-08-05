"use client";

import { useEffect, useState, useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  FileWarning,
  ClipboardList,
  Calculator,
  FileCheck,
  Plus,
  Loader2,
  Printer,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useExitWorkflow, calculateLwd } from "@/hooks/useExitWorkflow";

// ---------------------------------------------------------------------------
// Tab navigation configuration — avoids duplicated tab-ID magic strings
// ---------------------------------------------------------------------------
const TABS = [
  { id: "exits", label: "Resignation & clearance", icon: FileWarning },
  { id: "settlement", label: "F&F Settlement", icon: Calculator },
  { id: "letters", label: "Relieving / Experience Letters", icon: FileCheck },
];

// ---------------------------------------------------------------------------
// Field error display — DRY helper component
// ---------------------------------------------------------------------------
function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="text-rose-500 text-[10.5px] font-bold block mt-0.5" role="alert">
      {message}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge — isolated styling logic
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
  const isCompleted = status === "COMPLETED";
  return (
    <span
      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
        isCompleted
          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
          : "bg-rose-50 text-rose-600 border-rose-100"
      }`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Print-optimized CSS injected into document head for letter rendering
// This is isolated here so the main page is not polluted with raw CSS strings
// ---------------------------------------------------------------------------
const LETTER_PRINT_CSS = `
  @media print {
    @page {
      size: A4 portrait !important;
      margin: 1cm !important;
    }
    [data-slot="sidebar"],
    [data-slot="sidebar-container"],
    [data-slot="sidebar-gap"],
    aside, nav, header, footer, button, .print\\:hidden, [role="tablist"], [role="tab"] {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      visibility: hidden !important;
    }
    body, html {
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
      color: black !important;
      min-height: auto !important;
      box-shadow: none !important;
      width: 100% !important;
      overflow: visible !important;
    }
    main, .flex-1, .w-full, .bg-muted\\/20, [data-slot="sidebar-wrapper"] {
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
      width: 100% !important;
      max-width: 100% !important;
      display: block !important;
    }
    .print-letter-card {
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      min-height: 85vh !important;
      height: auto !important;
      padding: 1.5cm 1cm !important;
      margin: 0 auto !important;
      max-width: 100% !important;
      width: 100% !important;
      font-size: 11pt !important;
      line-height: 1.6 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
    }
    .print-letter-card h1 { color: #1e40af !important; }
    .print-signoff {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin-top: 1.5cm !important;
    }
  }
`;

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function ExitPage() {
  const {
    employees,
    exits,
    loading,
    selectedExit,
    setSelectedExit,
    page,
    setPage,
    rows,
    setRows,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    totalRecords,
    exitForm,
    editingExitId,
    exitFormErrors,
    updateExitField,
    resetExitForm,
    startEditingExit,
    settlement,
    settlementFormErrors,
    updateSettlementField,
    letterTemplate,
    setLetterTemplate,
    deleteTarget,
    setDeleteTarget,
    deleting,
    fetchData,
    handleInitiateExit,
    handleDeleteExit,
    handleUpdateClearance,
    handleProcessSettlement,
    handleCompleteExit,
  } = useExitWorkflow();

  const [activeTab, setActiveTab] = useState("exits");



  useEffect(() => {
    async function load() { await fetchData(); }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const netPayable =
    (Number(settlement.pendingSalary) || 0) +
    (Number(settlement.leaveEncashment) || 0) +
    (Number(settlement.bonus) || 0) -
    (Number(settlement.recoveries) || 0);

  // Active employees list — includes currently edited employee even if exiting
  const activeEmployees = employees.filter(
    (e) => e.status !== "RELIEVED" || String(e.id) === String(exitForm.employeeId)
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <nav className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto print:hidden" aria-label="Exit management tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              role="tab"
              className={`flex items-center gap-2 pb-3 font-semibold text-sm cursor-pointer whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-sky-500 text-sky-600 dark:text-sky-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="flex justify-center items-center py-20 print:hidden" aria-label="Loading">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ================================================================
              TAB 1 — RESIGNATIONS & CLEARANCES
          ================================================================ */}
          {activeTab === "exits" && (
            <div id="panel-exits" role="tabpanel" className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
              {/* --- Registration Form --- */}
              <div className="space-y-6 h-fit">
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-sky-500" aria-hidden="true" />
                    {editingExitId ? "Edit Exit Details" : "Register Resignation"}
                  </h3>

                  <form onSubmit={handleInitiateExit} className="space-y-3" noValidate>
                    {/* Employee select */}
                    <div className="space-y-1">
                      <Label htmlFor="exit-employee" className="text-xs font-bold text-slate-600 dark:text-slate-300">Employee</Label>
                      {editingExitId ? (
                        <div className="h-10 px-3 flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                          {(() => {
                            const emp = employees.find(e => String(e.id) === String(exitForm.employeeId)) || exits.find(ex => String(ex.id) === String(editingExitId))?.employee;
                            return emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeId || ''})` : `Employee ID: ${exitForm.employeeId}`;
                          })()}
                        </div>
                      ) : (
                        <Select
                          value={exitForm.employeeId}
                          onValueChange={(val) => updateExitField("employeeId", val)}
                        >
                          <SelectTrigger id="exit-employee" className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                            <SelectValue placeholder="Select employee..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            {activeEmployees.length > 0 ? (
                              activeEmployees.map((emp) => (
                                <SelectItem key={emp.id} value={String(emp.id)}>
                                  {emp.firstName} {emp.lastName} ({emp.employeeId || ''})
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-3 text-xs text-slate-400 italic text-center">
                                No active employees found.
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <FieldError message={exitFormErrors.employeeId} />
                    </div>

                    {/* Exit type */}
                    <div className="space-y-1">
                      <Label htmlFor="exit-type" className="text-xs font-bold text-slate-600 dark:text-slate-300">Type</Label>
                      <Select value={exitForm.type} onValueChange={(val) => updateExitField("type", val)}>
                        <SelectTrigger id="exit-type" className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          <SelectItem value="RESIGNATION">Resignation</SelectItem>
                          <SelectItem value="TERMINATION">Termination</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError message={exitFormErrors.type} />
                    </div>

                    {/* Resignation date */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Resignation Date</Label>
                      <DateTimePicker
                        type="date"
                        date={exitForm.resignationDate}
                        setDate={(val) => updateExitField("resignationDate", val)}
                      />
                      <FieldError message={exitFormErrors.resignationDate} />
                    </div>

                    {/* Notice days + LWD */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="exit-notice" className="text-xs font-bold text-slate-600 dark:text-slate-300">Notice Days</Label>
                        <Input
                          id="exit-notice"
                          type="number"
                          min={0}
                          value={exitForm.noticePeriodDays}
                          onChange={(e) => updateExitField("noticePeriodDays", e.target.value)}
                        />
                        <FieldError message={exitFormErrors.noticePeriodDays} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Last Working Day</Label>
                        <DateTimePicker
                          type="date"
                          date={exitForm.lastWorkingDay}
                          setDate={(val) => updateExitField("lastWorkingDay", val)}
                        />
                        <FieldError message={exitFormErrors.lastWorkingDay} />
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1">
                      <Label htmlFor="exit-reason" className="text-xs font-bold text-slate-600 dark:text-slate-300">Reason</Label>
                      <Textarea
                        id="exit-reason"
                        placeholder="Reason for exit..."
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm h-16"
                        value={exitForm.reason}
                        onChange={(e) => updateExitField("reason", e.target.value)}
                      />
                      <FieldError message={exitFormErrors.reason} />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Button type="submit" className="flex-1 bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl">
                        {editingExitId ? "Update Exit" : "Initiate Exit Process"}
                      </Button>
                      {editingExitId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetExitForm}
                          className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* --- Exits Table --- */}
              <div className="lg:col-span-2 space-y-6">
                <DataTable
                  title="Active Exits & Clearance Workflow"
                  lazy
                  value={exits}
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
                      render: (row) => (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{row.type}</span>
                      ),
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
                    { key: "noticePeriodDays", label: "Notice Days" },
                    {
                      key: "status",
                      label: "Status",
                      render: (row) => <StatusBadge status={row.status} />,
                    },
                    {
                      key: "clearances",
                      label: "Clearances",
                      sortable: false,
                      render: (row) => (
                        <div className="space-y-1.5">
                          {(row.clearances ?? []).map((task) => (
                            <div key={task.id} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{task.department}</span>
                              {task.status === "PENDING" ? (
                                <button
                                  onClick={() => handleUpdateClearance(task.id, "CLEARED")}
                                  className="bg-emerald-500 dark:bg-emerald-600 text-white text-[9px] font-bold rounded px-1.5 py-0.5 cursor-pointer"
                                  aria-label={`Mark ${task.department} clearance as cleared`}
                                >
                                  Clear
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateClearance(task.id, "PENDING")}
                                  className="cursor-pointer transition-colors"
                                  title="Accidentally cleared? Click to revert back to PENDING"
                                  aria-label={`Revert ${task.department} clearance to pending`}
                                >
                                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-black hover:bg-rose-100 dark:hover:bg-rose-950 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800 transition-all block">
                                    CLEARED ↩ (Undo)
                                  </span>
                                </button>
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
                            onClick={() => startEditingExit(row)}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 rounded-lg transition-all"
                            title="Edit exit record"
                            aria-label={`Edit exit record for ${row.employee?.firstName}`}
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: row.id, name: `${row.employee?.firstName || ""} ${row.employee?.lastName || ""}`.trim() || "this exit record" })}
                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-lg transition-all"
                            title="Delete exit record"
                            aria-label={`Delete exit record for ${row.employee?.firstName}`}
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

          {/* ================================================================
              TAB 2 — FULL & FINAL SETTLEMENT
          ================================================================ */}
          {activeTab === "settlement" && (
            <div id="panel-settlement" role="tabpanel" className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
              {/* Profile selector */}
              <div className="lg:col-span-1">
                <DataTable
                  title="Select Profile"
                  data={exits}
                  emptyMessage="No active exits logged."
                  pageSize={5}
                  searchKeys={["employee.firstName", "employee.lastName"]}
                  columns={[
                    {
                      key: "employee.firstName",
                      label: "Employee",
                      render: (row) => (
                        <div className="space-y-0.5">
                          <span className={`text-xs font-extrabold block ${
                            selectedExit?.id === row.id ? "text-sky-600 dark:text-sky-400" : "text-slate-800 dark:text-slate-200"
                          }`}>
                            {row.employee?.firstName} {row.employee?.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            LWD: {row.lastWorkingDay ? new Date(row.lastWorkingDay).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      ),
                    },
                    {
                      key: "actions",
                      label: "Action",
                      sortable: false,
                      render: (row) => (
                        <Button
                          type="button"
                          variant={selectedExit?.id === row.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedExit(row)}
                          className={`text-[10px] font-bold rounded-xl h-7 px-2.5 transition-all ${
                            selectedExit?.id === row.id
                              ? "bg-sky-500 hover:bg-sky-600 text-white"
                              : "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {selectedExit?.id === row.id ? "Selected" : "Select"}
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>

              {/* Settlement form */}
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

                    {/* Leave balance reference */}
                    {selectedExit.employee?.leaveBalances?.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Unused Leave Balances (Encashment Reference)
                        </span>
                        <div className="flex flex-wrap gap-3">
                          {selectedExit.employee.leaveBalances.map((bal) => {
                            const unused = Math.max(0, bal.allocated - bal.used);
                            return (
                              <div key={bal.id} className="text-xs bg-white dark:bg-slate-900 border dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
                                <span className="font-bold text-slate-700 dark:text-slate-200">{bal.leaveType}:</span>
                                <strong className="text-sky-500">{unused} Days</strong>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleProcessSettlement} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
                      {[
                        { key: "pendingSalary", label: "Pending Salary Dues (INR)" },
                        { key: "leaveEncashment", label: "Leave Encashment (INR)" },
                        { key: "bonus", label: "Performance Bonus (INR)" },
                        { key: "recoveries", label: "Recoveries / Asset Damage (INR)" },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <Label htmlFor={`settlement-${key}`} className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</Label>
                          <Input
                            id={`settlement-${key}`}
                            type="number"
                            min={0}
                            value={settlement[key]}
                            onChange={(e) => updateSettlementField(key, e.target.value)}
                          />
                          <FieldError message={settlementFormErrors[key]} />
                        </div>
                      ))}

                      <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Estimated Net Payable:{" "}
                          <strong className="text-emerald-500">
                            ₹{netPayable.toLocaleString("en-IN")}
                          </strong>
                        </div>
                        <Button type="submit" className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl h-10 px-6">
                          Record Final Dues
                        </Button>
                      </div>
                    </form>

                    {/* Saved settlement summary */}
                    {selectedExit.settlement && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
                        <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-200">SAVED SETTLEMENT SUMMARY:</h4>
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 space-y-1 grid grid-cols-2">
                          <div>Net Dues: <strong>₹{selectedExit.settlement.netPayable.toLocaleString("en-IN")}</strong></div>
                          <div>Status: <strong>{selectedExit.settlement.paymentStatus}</strong></div>
                        </div>
                        {selectedExit.status === "SETTLED" && (
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

          {/* ================================================================
              TAB 3 — LETTER TEMPLATE GENERATOR
          ================================================================ */}
          {activeTab === "letters" && (
            <div id="panel-letters" role="tabpanel" className="space-y-6">
              {/* Inject print-only CSS for letter formatting */}
              <style dangerouslySetInnerHTML={{ __html: LETTER_PRINT_CSS }} />

              {/* Toolbar */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-md flex flex-wrap justify-between items-center gap-4 print:hidden">
                <div className="flex gap-4 items-center flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold text-slate-600">Employee</Label>
                    <Select
                      value={selectedExit ? String(selectedExit.id) : ""}
                      onValueChange={(val) => {
                        const exit = exits.find((ex) => ex.id === Number(val) || ex.id === val);
                        if (exit) setSelectedExit(exit);
                      }}
                    >
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-w-[160px]">
                        <SelectValue placeholder="Select profile..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        {exits.map((ex) => (
                          <SelectItem key={ex.id} value={String(ex.id)}>
                            {ex.employee?.firstName} {ex.employee?.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-bold text-slate-600">Letter Type</Label>
                    <Select value={letterTemplate} onValueChange={setLetterTemplate}>
                      <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 min-w-[160px]">
                        <SelectValue placeholder="Select template..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <SelectItem value="relieving">Relieving Letter</SelectItem>
                        <SelectItem value="experience">Experience Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={() => window.print()}
                  className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 h-10 px-4"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" /> Print Document
                </Button>
              </div>

              {/* Letter Preview */}
              {selectedExit ? (
                <div className="bg-white dark:bg-slate-900 text-black dark:text-white p-8 sm:p-12 shadow-2xl rounded-3xl border border-slate-200 dark:border-slate-800 max-w-[800px] mx-auto min-h-[1000px] flex flex-col justify-between font-serif relative print-letter-card">
                  {/* Letter header */}
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

                  {/* Letter body */}
                  <div className="flex-1 py-10 space-y-6 text-sm leading-relaxed">
                    <div className="flex justify-between text-xs font-sans font-bold text-slate-500">
                      <span>Ref: ASP/HR/EXIT/{selectedExit.id}</span>
                      <span>Date: {new Date().toLocaleDateString()}</span>
                    </div>

                    <div className="font-extrabold">TO WHOMSOEVER IT MAY CONCERN</div>

                    {letterTemplate === "relieving" ? (
                      <div className="space-y-4 text-justify">
                        <p>
                          This is to confirm that{" "}
                          <strong>{selectedExit.employee?.firstName} {selectedExit.employee?.lastName}</strong>{" "}
                          (Employee ID: <strong>{selectedExit.employee?.employeeId}</strong>) was employed with
                          Aspino Speciality Chemicals Private Limited as a{" "}
                          <strong>{selectedExit.employee?.designation}</strong> from{" "}
                          <strong>{new Date(selectedExit.employee?.dateOfJoining).toLocaleDateString()}</strong> to{" "}
                          <strong>{new Date(selectedExit.lastWorkingDay).toLocaleDateString()}</strong>.
                        </p>
                        <p>
                          Consequent to their resignation dated{" "}
                          <strong>{new Date(selectedExit.resignationDate).toLocaleDateString()}</strong>, we hereby
                          confirm that they are relieved of all duties and responsibilities with effect from the
                          close of business hours on{" "}
                          <strong>{new Date(selectedExit.lastWorkingDay).toLocaleDateString()}</strong>.
                        </p>
                        <p>
                          We confirm that all departmental clearances (including IT assets, stores, library, and
                          finance dues) have been completed successfully. Their Full & Final settlement has been
                          processed and paid.
                        </p>
                        <p>We wish them success in their future endeavors.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 text-justify">
                        <p>
                          This is to certify that{" "}
                          <strong>{selectedExit.employee?.firstName} {selectedExit.employee?.lastName}</strong> was
                          employed with Aspino Speciality Chemicals Private Limited from{" "}
                          <strong>{new Date(selectedExit.employee?.dateOfJoining).toLocaleDateString()}</strong> to{" "}
                          <strong>{new Date(selectedExit.lastWorkingDay).toLocaleDateString()}</strong>.
                        </p>
                        <p>
                          During their tenure, they held the designation of{" "}
                          <strong>{selectedExit.employee?.designation}</strong> in the{" "}
                          <strong>{selectedExit.employee?.department}</strong> department.
                        </p>
                        <p>
                          Their duties included supervising and operating chemical processing units, quality control
                          analysis, and maintaining regulatory GMP safety compliance records. They have consistently
                          demonstrated a professional attitude and strong execution capability.
                        </p>
                        <p>Their conduct was exemplary during their tenure. We wish them all the best in their future career.</p>
                      </div>
                    )}
                  </div>

                  {/* Sign-off */}
                  <div className="pt-12 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end text-xs font-sans print-signoff">
                    <div className="flex flex-col space-y-1">
                      <span className="font-bold">Human Resources Dept.</span>
                      <span className="text-slate-500">Aspino Speciality Chemicals Pvt. Ltd.</span>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {/* TODO (21 CFR Part 11 §11.50): Replace placeholder with a verified digital signature
                          block that captures signatory name, timestamp, and credential confirmation. */}
                      <div className="w-32 h-10 border-b border-slate-300 flex items-center justify-center italic text-slate-400">
                        [Digital Signature]
                      </div>
                      <span className="font-bold">Authorized Signatory</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-sm print:hidden">
                  Select an exit profile to display Relieving/Experience document preview.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteExit}
        loading={deleting}
        title="Delete Exit Record"
        description={
          deleteTarget
            ? `Are you sure you want to delete the exit process for "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
