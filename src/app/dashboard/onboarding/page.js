"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import {
  UserCheck,
  FileCheck,
  Calendar,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Plus,
  Loader2,
  Hourglass,
  Upload,
  ExternalLink,
  Shield,
  Laptop,
  Trash2,
  Edit
} from "lucide-react";

export default function OnboardingPage() {
  const [employees, setEmployees] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [activeTab, setActiveTab] = useState("documents");
  // Induction Form State
  const [induc, setInduc] = useState({ scheduledAt: "", trainer: "" });

  // System Access Form State
  const [sysAccess, setSysAccess] = useState({
    erpLogin: false,
    email: false,
    attendanceApp: false,
    vpn: false,
  });



  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (selectedEmp) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setSysAccess({
        erpLogin: selectedEmp.systemAccess?.erpLogin || false,
        email: selectedEmp.systemAccess?.email || false,
        attendanceApp: selectedEmp.systemAccess?.attendanceApp || false,
        vpn: selectedEmp.systemAccess?.vpn || false,
      });
    }
  }, [selectedEmp]);

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchEmployees = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(rows),
      });
      if (search) params.append("search", search);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortOrder) params.append("sortOrder", sortOrder);

      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees?${params.toString()}`);
      const result = await res.json();
      const data = result.data || (Array.isArray(result) ? result : []);
      setEmployees(data);
      setTotalRecords(result.pagination?.total ?? result.total ?? (Array.isArray(data) ? data.length : 0));
      setPage(result.pagination?.page || page);
      setRows(result.pagination?.limit || rows);

      if (data.length > 0) {
        setSelectedEmp(prev => {
          if (!prev) return data[0];
          const updated = data.find(e => e.id === prev.id);
          return updated || data[0];
        });
      } else {
        setSelectedEmp(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [backendUrl, page, rows, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmployees();
    
    // Fetch banks
    apiFetch(`${backendUrl}/staff-hrms/onboarding/banks`)
      .then(res => res.json())
      .then(data => setBanks(data))
      .catch(err => console.error("Failed to fetch banks", err));
  }, [fetchEmployees]);

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedEmp?.id === deleteTarget.id) setSelectedEmp(null);
        setDeleteTarget(null);
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateDocStatus = async (docId, status) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/documents/${docId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchEmployees(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInduction = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/inductions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmp.id, ...induc }),
      });
      if (res.ok) {
        setInduc({ scheduledAt: "", trainer: "" });
        fetchEmployees(true);
        toast.success("Induction scheduled successfully");
      } else {
        const msg = await getErrorMessage(res, "Failed to schedule induction");
        toast.error(msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleUpdateInductionStatus = async (indId, status) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/inductions/${indId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchEmployees(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProbation = async (empId, status) => {
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/${empId}/probation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchEmployees(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSystemAccess = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/employees/${selectedEmp.id}/system-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sysAccess),
      });
      if (res.ok) {
        fetchEmployees(true);
        toast.success("System access updated");
      }
    } catch (err) {
      console.error(err);
    }
  };



  const handleUploadDoc = async (docId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiFetch(`${backendUrl}/staff-hrms/onboarding/documents/${docId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchEmployees(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getProbationDaysMessage = (probationEnd) => {
    if (!probationEnd) return null;
    const diffTime = new Date(probationEnd) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return {
        text: `Probation ended ${Math.abs(diffDays)} days ago. Review is pending!`,
        alert: true,
      };
    } else if (diffDays <= 15) {
      return {
        text: `Probation ends in ${diffDays} days. Please prepare the review.`,
        alert: true,
      };
    } else {
      return {
        text: `${diffDays} days left in probation period.`,
        alert: false,
      };
    }
  };

  const getDocUrls = (fileUrl) => {
    if (!fileUrl) return [];
    if (fileUrl.startsWith('[')) {
      try {
        return JSON.parse(fileUrl);
      } catch (e) {
        return [fileUrl];
      }
    }
    return [fileUrl];
  };

  const onboardingColumns = [
    {
      key: "employeeId",
      label: "Employee ID",
      render: (row) => <span className="font-bold text-xs text-slate-800 dark:text-white">{row.employeeId}</span>,
    },
    {
      key: "firstName",
      label: "Employee Name",
      render: (row) => (
        <span className="font-extrabold text-slate-800 dark:text-white text-xs">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      render: (row) => <span className="text-xs text-slate-600 dark:text-slate-300">{row.designation || "—"}</span>,
    },
    {
      key: "department",
      label: "Department",
      render: (row) => (
        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 px-2 py-0.5 rounded-md">
          {row.department?.name || "—"}
        </span>
      ),
    },
    {
      key: "dateOfJoining",
      label: "DOJ",
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.dateOfJoining ? new Date(row.dateOfJoining).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "probationStatus",
      label: "Probation Status",
      render: (row) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.probationStatus || "N/A"}
        </span>
      ),
    },
    {
      key: "bankStatus",
      label: "Bank Details",
      render: (row) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          row.bankName && row.accountNumber && row.ifscCode && row.panNumber
            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
            : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
        }`}>
          {row.bankName && row.accountNumber && row.ifscCode && row.panNumber ? "Filled" : "Pending"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
          row.status === "ACTIVE" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setSelectedEmp(row);
              setActiveTab("documents");
              const detailElem = document.getElementById("onboarding-details-section");
              if (detailElem) detailElem.scrollIntoView({ behavior: "smooth" });
            }}
            className={`text-xs font-bold rounded-xl h-8 px-3 transition-all cursor-pointer ${
              selectedEmp?.id === row.id
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-200 hover:bg-sky-500 dark:bg-sky-600 hover:text-white dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {selectedEmp?.id === row.id ? "Selected" : "Manage"}
          </Button>
          <button
            onClick={() => setDeleteTarget({ id: row.id, name: `${row.firstName} ${row.lastName}` })}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-500 rounded-lg transition-all cursor-pointer"
            title="Delete Employee"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Section: Onboarding Employees DataTable */}
          <DataTable
            title="Onboarding Employees"
            lazy
            value={employees}
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
            columns={onboardingColumns}
            emptyMessage="No onboarding profiles found."
          />

          {/* Bottom Section: Selected Employee Onboarding Details */}
          <div id="onboarding-details-section" className="space-y-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            {selectedEmp ? (
              <div className="space-y-6">
                {/* Profile Detail Header */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md flex justify-between items-center gap-4 flex-wrap">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white">
                      {selectedEmp.firstName} {selectedEmp.lastName}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Designation: <strong className="text-sky-500">{selectedEmp.designation}</strong> | Department: <strong className="text-sky-500">{selectedEmp.department?.name || selectedEmp.department || "—"}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      DOJ: {new Date(selectedEmp.dateOfJoining).toLocaleDateString()} | Probation Ends: {selectedEmp.probationEnd ? new Date(selectedEmp.probationEnd).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* QR & PDF URL logic (Hosted on Next.js Port 3000) */}
                    {(() => {
                      // 1. qrUrl (for the QR image): Expose via Next.js port 3000. Uses network IP 192.168.1.5 if accessed on localhost
                      // so that phones on Wi-Fi can scan and load it.
                      const qrHostname = typeof window !== "undefined"
                        ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "192.168.1.5" : window.location.hostname)
                        : "192.168.1.5";
                      const token = selectedEmp.qrToken || selectedEmp.employeeId || "";
                      const qrUrl = `http://${qrHostname}:3000/employee/pdf/${token}.pdf`;

                      // 2. desktopPdfUrl (for Open/Copy on desktop): Point to port 3000 route handler directly.
                      const desktopPdfUrl = typeof window !== "undefined"
                        ? `${window.location.protocol}//${window.location.host}/employee/pdf/${token}.pdf`
                        : `http://localhost:3000/employee/pdf/${token}.pdf`;

                      return (
                        <div className="flex flex-col items-center gap-1">
                          <div className="p-2 bg-white border-2 border-emerald-400 rounded-xl shadow-sm">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encodeURIComponent(qrUrl)}&ecc=M`}
                              alt="Employee PDF QR Code"
                              className="w-24 h-24 rounded"
                            />
                          </div>
                          <span className="text-[7px] font-mono text-slate-400 max-w-[110px] truncate" title={qrUrl}>
                            {qrUrl.replace("http://","").replace("https://","").slice(0,26)}…
                          </span>
                          <div className="flex gap-1 mt-0.5">
                            <button
                              onClick={() => { if (desktopPdfUrl) navigator.clipboard.writeText(desktopPdfUrl).then(() => toast.success("PDF link copied!")); }}
                              className="text-[9px] font-bold text-sky-500 hover:text-sky-600 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                            >
                              Copy Link
                            </button>
                            <a
                              href={desktopPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-bold text-emerald-500 hover:text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-md transition-colors"
                            >
                              Open PDF ↗
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-xs font-black bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800/50">
                        Probation: {selectedEmp.probationStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Horizontal Navigation Tabs (Style matches the image) */}
                <div className="flex border-b border-slate-200 dark:border-slate-850 gap-6 overflow-x-auto">
                  {[
                    { id: "documents", label: "Document Collection", icon: FileCheck },
                    { id: "system", label: "System Access", icon: Laptop },
                    { id: "induction", label: "Induction & Orientation", icon: Calendar },
                    { id: "probation", label: "Probation Tracking", icon: Hourglass },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 pb-3 font-semibold text-sm cursor-pointer whitespace-nowrap transition-all border-b-2 ${
                          activeTab === tab.id
                            ? "border-sky-50 dark:border-sky-500/200 text-sky-600 dark:text-sky-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content rendering */}
                {activeTab === "documents" && (
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-sky-500" />
                      Document Collection Checklist
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[...(selectedEmp.documents || [])].sort((a, b) => a.documentType.localeCompare(b.documentType)).map((doc) => (
                        <div key={doc.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-0.5">
                              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">{doc.documentType}</span>
                              <span className={`text-[10px] font-black uppercase ${
                                doc.status === 'VERIFIED' ? 'text-emerald-600 dark:text-emerald-400' : doc.status === 'SUBMITTED' ? 'text-blue-500' : 'text-amber-500'
                              }`}>
                                {doc.status}
                              </span>
                             </div>
                            <div className="flex flex-col gap-1 items-end">
                              {getDocUrls(doc.fileUrl).map((url, idx) => (
                                <a
                                  key={idx}
                                  href={`${backendUrl}${url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-extrabold text-sky-500 hover:text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/20 px-2 py-1 rounded-lg"
                                >
                                  <ExternalLink className="w-3 h-3" /> View Doc {idx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <label className="flex-1">
                              <span className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-bold cursor-pointer hover:bg-slate-100 dark:bg-slate-500/10 dark:hover:bg-slate-750 transition-colors">
                                <Upload className="w-3.5 h-3.5" />{" "}
                                {doc.fileUrl
                                  ? (doc.documentType.startsWith('Education') || doc.documentType.startsWith('Previous Employment')
                                    ? "Upload More"
                                    : "Re-upload")
                                  : "Upload File"}
                              </span>
                              <Input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadDoc(doc.id, file);
                                }}
                              />
                            </label>
                            {doc.status === 'SUBMITTED' && (
                              <Button size="sm" onClick={() => handleUpdateDocStatus(doc.id, 'VERIFIED')} className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold h-8.5 px-3">
                                Verify
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "system" && (
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      <Laptop className="w-5 h-5 text-sky-500" />
                      System Access Creation
                    </h4>
                    <form onSubmit={handleUpdateSystemAccess} className="space-y-4 max-w-md" noValidate>
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        {[
                          { id: "erpLogin", label: "ERP Login Access" },
                          { id: "email", label: "Company Email Account" },
                          { id: "attendanceApp", label: "Mobile Attendance App Access" },
                          { id: "vpn", label: "Secure VPN Access" },
                        ].map((access) => (
                          <label key={access.id} className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Checkbox
                              checked={sysAccess[access.id]}
                              onCheckedChange={(checked) => setSysAccess({ ...sysAccess, [access.id]: checked })}
                              className="mt-0.5"
                            />
                            {access.label}
                          </label>
                        ))}
                      </div>
                      <Button type="submit" className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl h-10 px-5">
                        Save System Access
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === "induction" && (
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-sky-500" />
                      Induction & Orientation Schedule
                    </h4>
                    {selectedEmp.induction ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center gap-4">
                        <div className="text-xs font-semibold text-slate-650 dark:text-slate-300 space-y-1">
                          <div>Scheduled At: <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedEmp.induction.scheduledAt).toLocaleString()}</strong></div>
                          <div>Trainer Name: <strong className="text-slate-800 dark:text-slate-200">{selectedEmp.induction.trainer}</strong></div>
                          <div>Status: <strong className="text-sky-500">{selectedEmp.induction.status}</strong></div>
                        </div>
                        {selectedEmp.induction.status === 'SCHEDULED' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateInductionStatus(selectedEmp.induction.id, 'COMPLETED')}
                            className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs h-9"
                          >
                            Mark Completed
                          </Button>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleCreateInduction} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end" noValidate>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-650 dark:text-slate-300">Schedule Date</Label>
                          <DateTimePicker
                            date={induc.scheduledAt}
                            disablePast={true}
                            setDate={(val) => setInduc({ ...induc, scheduledAt: val })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-650 dark:text-slate-300">Trainer Name</Label>
                          <Input
                            required
                            placeholder="Dr. Kumar"
                            value={induc.trainer}
                            onChange={(e) => setInduc({ ...induc, trainer: e.target.value.replace(/\d/g, "") })}
                          />
                        </div>
                        <Button type="submit" className="bg-sky-500 dark:bg-sky-600 hover:bg-sky-600 text-white font-bold rounded-xl h-10">
                          Schedule Orientation
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                {activeTab === "probation" && (
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
                    <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      <Hourglass className="w-5 h-5 text-sky-500" />
                      Probation Tracking & Review
                    </h4>
                    
                    {selectedEmp.probationEnd && (() => {
                      const statusMsg = getProbationDaysMessage(selectedEmp.probationEnd);
                      if (!statusMsg) return null;
                      return (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
                          statusMsg.alert 
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50" 
                            : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                        }`}>
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <div>
                            <span>{statusMsg.text}</span>
                            {statusMsg.alert && (
                              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                Reminder: Confirm status or schedule extension review with supervisor.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <div className="text-xs font-medium text-slate-500 leading-relaxed">
                        All new hires start with a **6-month probation period**. Once orientation and document collection are completed, review performance to confirm full payroll status.
                      </div>
                      {selectedEmp.probationStatus === 'UNDER_REVIEW' ? (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            onClick={() => {
                              const docs = selectedEmp.documents || [];
                              if (docs.length === 0) {
                                toast.error("No documents found. Please collect and verify documents first.");
                                return;
                              }
                              const unverified = docs.filter(d => d.status !== 'VERIFIED');
                              if (unverified.length > 0) {
                                toast.error("Please verify all documents before confirming.");
                                return;
                              }

                              handleUpdateProbation(selectedEmp.id, 'CONFIRMED');
                            }}
                            className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs h-9"
                          >
                            Confirm Employee
                          </Button>
                          <Button
                            onClick={() => handleUpdateProbation(selectedEmp.id, 'EXTENDED')}
                            variant="outline"
                            className="text-amber-500 border-amber-200 dark:border-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:bg-amber-500/10/50 dark:hover:bg-amber-950/20 rounded-xl text-xs h-9"
                          >
                            Extend Probation
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border dark:border-slate-750 px-3 py-1.5 rounded-full shadow-xs shrink-0">
                          Probation Status: <strong>{selectedEmp.probationStatus}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Select an employee to view details.</p>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEmployee}
        loading={deleting}
        title="Delete Employee Profile"
        description={
          deleteTarget
            ? `Are you sure you want to delete employee "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
      />
    </div>
  );
}
