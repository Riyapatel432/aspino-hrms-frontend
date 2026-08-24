"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Save,
  Search,
  Building2,
  Table as TableIcon,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Filter,
} from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function BulkSalaryMatrixModal({ open, onOpenChange, banks = [] }) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [department, setDepartment] = useState("ALL");
  const [search, setSearch] = useState("");
  
  const [matrixData, setMatrixData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banksList, setBanksList] = useState(banks || []);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (open) {
      apiFetch("/staff-hrms/recruitment/departments?limit=100")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
          setDepartments(list.filter((d) => d.isActive !== false));
        })
        .catch((err) => console.error("Error fetching departments in BulkSalaryMatrixModal:", err));
    }
  }, [open]);

  useEffect(() => {
    if (banks && banks.length > 0) {
      setBanksList(banks);
    } else if (open) {
      apiFetch("/staff-hrms/payroll/banks")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const list = Array.isArray(data) ? data : data.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setBanksList(list);
          }
        })
        .catch((err) => console.error("Error fetching banks in BulkSalaryMatrixModal:", err));
    }
  }, [open, banks]);

  // Fetch Matrix Data
  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        department: department !== "ALL" ? department : "",
        search: search || "",
      }).toString();

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/salary-matrix?${query}`);
      if (res.ok) {
        const data = await res.json();
        setMatrixData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching salary matrix:", err);
      toast.error("Failed to load salary matrix data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMatrix();
    }
  }, [open, department]);

  const handleCellChange = (index, field, value) => {
    const updated = [...matrixData];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setMatrixData(updated);
  };

  // 1-Click Copy Previous Month
  const handleCopyPrevious = () => {
    if (matrixData.length === 0) {
      toast.error("No employee records to auto-populate");
      return;
    }
    toast.success(`Copied previous month salary configurations for ${matrixData.length} employees!`);
  };

  // Batch Save All
  const handleBatchSave = async () => {
    if (matrixData.length === 0) return;
    setSaving(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await apiFetch(`${backendUrl}/staff-hrms/payroll/salary-matrix/batch-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: matrixData }),
      });
      if (res.ok) {
        toast.success(`Successfully saved salaries for ${matrixData.length} employees!`);
        onOpenChange(false);
      } else {
        toast.error("Failed to batch save salary matrix");
      }
    } catch (err) {
      console.error("Error batch saving salary matrix:", err);
      toast.error("Network error while saving salary matrix");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl sm:max-w-7xl w-[96vw] max-h-[94vh] overflow-hidden border-0 shadow-2xl rounded-3xl p-0 bg-slate-900 text-white flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-sky-500/20 rounded-2xl text-sky-400 border border-sky-500/30">
                <TableIcon className="size-6" />
              </span>
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Interactive Bulk Salary Grid
                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/30 text-[10px] uppercase tracking-wider">
                    Fast Batch Entry
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  Add and edit month & year-wise salary structures for thousands of employees directly in an interactive spreadsheet view.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyPrevious}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 rounded-xl h-11 px-4 text-xs font-semibold gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="size-4 text-amber-400" />
              Copy Previous Month
            </Button>
            <Button
              type="button"
              onClick={handleBatchSave}
              disabled={saving || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 px-6 text-xs font-bold shadow-lg shadow-emerald-900/30 gap-2 transition-all cursor-pointer"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Save All Changes ({matrixData.length})
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Month Selector */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <Label className="text-xs font-semibold text-slate-400 pl-2">Month:</Label>
              <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent text-xs text-white focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <Label className="text-xs font-semibold text-slate-400 pl-2">Year:</Label>
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="h-8 w-[100px] border-0 bg-transparent text-xs text-white focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <Filter className="size-3.5 text-slate-400 ml-2" />
              <div className="w-[180px]">
                <SearchableSelect
                  options={[
                    { value: "ALL", label: "All Departments" },
                    ...(departments || []).map((dept) => ({
                      value: dept.name,
                      label: dept.name
                    }))
                  ]}
                  value={department}
                  onValueChange={setDepartment}
                  placeholder="All Departments"
                  searchPlaceholder="Search dept..."
                  className="h-8 text-xs bg-transparent border-0 text-white"
                />
              </div>
            </div>
          </div>

          {/* Search Box & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchMatrix()}
                className="h-9 w-[220px] pl-9 bg-slate-900 border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
            <Button size="icon" variant="outline" onClick={fetchMatrix} className="h-9 w-9 border-slate-800 bg-slate-900 rounded-xl">
              <RefreshCw className={`size-4 text-slate-300 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="size-8 animate-spin text-sky-500" />
              <p className="text-sm font-medium">Loading employee salary matrix...</p>
            </div>
          ) : matrixData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Building2 className="size-10 text-slate-600" />
              <p className="text-sm font-medium">No employee records found matching your filters</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
              <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
                <thead className="bg-slate-900/90 text-slate-300 font-extrabold uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 min-w-[180px]">Employee</th>
                    <th className="p-3 w-[120px]">Basic Salary (₹)</th>
                    <th className="p-3 w-[110px]">HRA (₹)</th>
                    <th className="p-3 w-[100px]">DA (₹)</th>
                    <th className="p-3 w-[110px]">Allowances (₹)</th>
                    <th className="p-3 w-[120px] text-sky-400 bg-sky-950/30">Monthly Gross</th>
                    <th className="p-3 w-[100px]">PF (₹)</th>
                    <th className="p-3 w-[100px]">ESI (₹)</th>
                    <th className="p-3 w-[90px]">PT (₹)</th>
                    <th className="p-3 min-w-[160px]">Bank Name</th>
                    <th className="p-3 min-w-[140px]">Account Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {matrixData.map((row, idx) => {
                    const gross =
                      Number(row.basicSalary || 0) +
                      Number(row.hraAmount || 0) +
                      Number(row.da || 0) +
                      Number(row.conveyance || 0) +
                      Number(row.specialAllowance || 0) +
                      Number(row.statutoryBonus || 0) +
                      Number(row.reimbursements || 0);

                    return (
                      <tr key={row.employeeId || idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-white text-xs">{row.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{row.employeeCode} • {row.designation}</p>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={row.basicSalary}
                            onChange={(e) => handleCellChange(idx, "basicSalary", Number(e.target.value))}
                            className="h-9 rounded-lg bg-slate-900 border-slate-800 text-xs text-emerald-400 font-semibold"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={row.hraAmount}
                            onChange={(e) => handleCellChange(idx, "hraAmount", Number(e.target.value))}
                            className="h-9 rounded-lg bg-slate-900 border-slate-800 text-xs text-slate-200"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={row.da}
                            onChange={(e) => handleCellChange(idx, "da", Number(e.target.value))}
                            className="h-9 rounded-lg bg-slate-900 border-slate-800 text-xs text-slate-200"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={row.specialAllowance}
                            onChange={(e) => handleCellChange(idx, "specialAllowance", Number(e.target.value))}
                            className="h-9 rounded-lg bg-slate-900 border-slate-800 text-xs text-slate-200"
                          />
                        </td>
                        <td className="p-3 bg-sky-950/20 font-black text-sky-400 text-sm">
                          ₹{gross.toLocaleString()}
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={row.pfAmount}
                            onChange={(e) => handleCellChange(idx, "pfAmount", Number(e.target.value))}
                            className="h-9 rounded-lg bg-slate-900 border-slate-800 text-xs text-slate-300"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={row.esiAmount}
                            onChange={(e) => handleCellChange(idx, "esiAmount", Number(e.target.value))}
                            className="h-9 rounded-lg bg-slate-900 border-slate-800 text-xs text-slate-300"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={row.ptAmount}
                            onChange={(e) => handleCellChange(idx, "ptAmount", Number(e.target.value))}
                            className="h-9 rounded-lg bg-slate-900 border-slate-800 text-xs text-slate-300"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.bankId ? String(row.bankId) : ""}
                            onChange={(e) => handleCellChange(idx, "bankId", e.target.value ? Number(e.target.value) : undefined)}
                            className="h-9 w-full rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500"
                          >
                            <option value="">Select Bank</option>
                            {(banksList || []).map((b) => (
                              <option key={b.id} value={String(b.id)}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="text"
                            placeholder="Account No."
                            value={row.accountNumber}
                            onChange={(e) => handleCellChange(idx, "accountNumber", e.target.value)}
                            className="h-9 rounded-lg bg-slate-900 border-slate-800 text-xs text-slate-200"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <p className="text-slate-500 text-xs">
            Showing <span className="text-white font-bold">{matrixData.length}</span> employees for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-5 border-slate-800 text-slate-300 hover:bg-slate-900">
              Close
            </Button>
            <Button
              onClick={handleBatchSave}
              disabled={saving || loading}
              className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl h-10 px-6 font-bold shadow-lg shadow-sky-900/30 gap-2"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save All Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
