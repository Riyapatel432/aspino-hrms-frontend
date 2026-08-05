"use client";

import { useEffect, useState } from "react";
import { API_URL, apiFetch, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Search,
  Eye,
  Loader2,
  Calendar,
  User,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Filtering & Pagination State
  const [userEmail, setUserEmail] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  // Load logs
  async function fetchLogs() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search) queryParams.append("search", search);
      if (sortBy) queryParams.append("sortBy", sortBy);
      if (sortOrder) queryParams.append("sortOrder", sortOrder);
      if (userEmail.trim()) queryParams.append("userEmail", userEmail.trim());
      if (action.trim()) queryParams.append("action", action.trim());
      if (entityType.trim()) queryParams.append("entityType", entityType.trim());
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const res = await apiFetch(`${API_URL}/staff-hrms/audit/logs?${queryParams.toString()}`);
      if (res.ok) {
        const body = await res.json();
        setLogs(body.data || []);
        setMeta({
          total: body.pagination?.total ?? body.meta?.total ?? 0,
          totalPages: body.pagination?.totalPages ?? body.meta?.totalPages ?? 1,
        });
      } else {
        const msg = await getErrorMessage(res, "Failed to load activity logs");
        toast.error(msg);
      }
    } catch (error) {
      console.error("Error loading activity logs:", error);
      toast.error("An unexpected error occurred while loading logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [page, limit, search, sortBy, sortOrder, userEmail, action, entityType, startDate, endDate]);

  // Reset filters
  const handleReset = () => {
    setUserEmail("");
    setAction("");
    setEntityType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    // Fetch logs with cleared parameters
    setTimeout(() => {
      fetchLogs();
    }, 50);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Styling helpers
  const getActionBadgeColor = (actionName) => {
    const act = String(actionName).toUpperCase();
    if (act.startsWith("CREATE")) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/25";
    if (act.startsWith("UPDATE")) return "bg-blue-500/10 text-blue-500 border-blue-500/25";
    if (act.startsWith("DELETE")) return "bg-rose-500/10 text-rose-500 border-rose-500/25";
    if (act === "LOGIN") return "bg-violet-500/10 text-violet-500 border-violet-500/25";
    return "bg-slate-500/10 text-slate-500 border-slate-500/25";
  };

  const getMethodBadgeColor = (method) => {
    const m = String(method).toUpperCase();
    switch (m) {
      case "POST": return "bg-emerald-500 text-white";
      case "PUT":
      case "PATCH": return "bg-blue-500 text-white";
      case "DELETE": return "bg-rose-500 text-white";
      case "GET": return "bg-slate-400 text-white";
      default: return "bg-slate-500 text-white";
    }
  };

  const getStatusBadgeColor = (code) => {
    const status = Number(code);
    if (status >= 200 && status < 300) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (status >= 400) return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  const formatJSON = (json) => {
    if (!json) return "{}";
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };

  // Define columns for DataTable
  const columns = [
    {
      key: "createdAt",
      label: "Timestamp",
      render: (row) => {
        const d = new Date(row.createdAt);
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {d.toLocaleDateString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {d.toLocaleTimeString()}
            </span>
          </div>
        );
      },
    },
    {
      key: "userEmail",
      label: "Actor",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {row.userName || "System / Guest"}
          </span>
          {row.userEmail && (
            <span className="text-xs text-slate-400 font-medium">{row.userEmail}</span>
          )}
          {row.userRole && (
            <span className="text-[10px] uppercase font-black text-sky-500 tracking-wider">
              {row.userRole}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`font-black tracking-wider text-[10.5px] px-2 py-0.5 rounded-md ${getActionBadgeColor(row.action)}`}>
            {row.action}
          </Badge>
          {row.entityType && (
            <span className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">
              {row.entityType}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "method",
      label: "Request",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge className={`font-extrabold text-[10px] px-1.5 py-0.5 rounded ${getMethodBadgeColor(row.method)}`}>
            {row.method}
          </Badge>
          <span className="text-xs font-mono font-medium max-w-[200px] truncate text-slate-500 dark:text-slate-400" title={row.url}>
            {row.url}
          </span>
        </div>
      ),
    },
    {
      key: "statusCode",
      label: "Status",
      render: (row) => (
        <Badge variant="outline" className={`font-bold text-xs rounded-full px-2.5 ${getStatusBadgeColor(row.statusCode)}`}>
          {row.statusCode}
        </Badge>
      ),
    },
    {
      key: "ip",
      label: "Origin",
      render: (row) => (
        <div className="flex flex-col text-[11.5px] text-slate-500 dark:text-slate-400">
          <span className="font-mono">{row.ip || "localhost"}</span>
          <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={row.userAgent}>
            {row.userAgent || "Unknown Client"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Details",
      sortable: false,
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg font-bold border-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/20 text-slate-700 hover:text-sky-500 flex items-center gap-1 cursor-pointer"
          onClick={() => setSelectedLog(row)}
        >
          <Eye className="w-3.5 h-3.5" />
          Payload
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-sky-500" aria-hidden="true" />
          Audit Trail & Activity Logs
        </h2>
        <Button
          variant="outline"
          className="rounded-xl font-bold border-slate-200 flex items-center gap-1.5 h-9"
          onClick={fetchLogs}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </Button>
      </div>

      {/* Advanced Filter Panel */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-2.5">
          <SlidersHorizontal className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Filter Activities</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <Label htmlFor="filter-email" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              User Email
            </Label>
            <Input
              id="filter-email"
              placeholder="e.g. admin@aspino.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-action" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Action Name
            </Label>
            <Input
              id="filter-action"
              placeholder="e.g. CREATE_EMPLOYEE"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-entity" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Entity Type
            </Label>
            <Input
              id="filter-entity"
              placeholder="e.g. Employee"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-start" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Start Date
            </Label>
            <Input
              id="filter-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="filter-end" className="text-xs font-bold text-slate-600 dark:text-slate-300">
              End Date
            </Label>
            <Input
              id="filter-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="rounded-xl font-bold h-9 text-xs"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 text-white font-bold rounded-xl h-9 text-xs px-4"
          >
            Apply Filters
          </Button>
        </div>
      </form>

      {/* Data Table */}
      {loading && logs.length === 0 ? (
        <div className="flex justify-center items-center py-24 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            title="Activity History (Audit Log)"
            lazy
            value={logs}
            totalRecords={meta.total}
            page={page}
            rows={limit}
            loading={loading}
            search={search}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onPageChange={(p) => setPage(p)}
            onRowsChange={(r) => { setLimit(r); setPage(1); }}
            onSortChange={(k, dir) => { setSortBy(k); setSortOrder(dir); setPage(1); }}
            onSearchChange={(s) => { setSearch(s); setPage(1); }}
            columns={columns}
            emptyMessage="No activity logs found for the selected filters."
          />
          
          {/* Custom Server Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs text-slate-400 font-medium">
                Page <strong className="text-slate-700 dark:text-slate-200">{page}</strong> of <strong className="text-slate-700 dark:text-slate-200">{meta.totalPages}</strong> ({meta.total} records total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg font-bold h-8 text-xs cursor-pointer"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg font-bold h-8 text-xs cursor-pointer"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payload Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-500" />
              Activity Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Audit context, route parameters, and raw JSON payloads for the selected event.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="flex-1 min-h-0 mt-4 pr-3">
              <div className="space-y-4 text-xs pb-4">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border dark:border-slate-800/80">
                  <div>
                    <span className="text-slate-400 font-medium block">Timestamp</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Action ID</span>
                    <span className="font-mono text-[10px] text-slate-500 select-all">
                      {selectedLog.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Actor Name / Email</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {selectedLog.userName || "System"} {selectedLog.userEmail ? `(${selectedLog.userEmail})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Role</span>
                    <span className="font-extrabold text-sky-500 uppercase tracking-wide">
                      {selectedLog.userRole || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">HTTP Method & Path</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      [{selectedLog.method}] {selectedLog.url}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Status Code</span>
                    <span className={`font-extrabold ${selectedLog.statusCode >= 400 ? "text-rose-500" : "text-emerald-500"}`}>
                      {selectedLog.statusCode}
                    </span>
                  </div>
                </div>

                {/* Payloads tabs/collapsible sections */}
                <div className="space-y-3">
                  {selectedLog.routeParams && Object.keys(selectedLog.routeParams).length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">Route Parameters</span>
                      <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                        {formatJSON(selectedLog.routeParams)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.queryParams && Object.keys(selectedLog.queryParams).length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">Query Parameters</span>
                      <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                        {formatJSON(selectedLog.queryParams)}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Request Payload (Sanitized)</span>
                    <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                      {formatJSON(selectedLog.requestBody)}
                    </pre>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Response Output (Sanitized)</span>
                    <pre className="p-3 bg-slate-950 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                      {formatJSON(selectedLog.responseBody)}
                    </pre>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="shrink-0 border-t dark:border-slate-800 pt-4 mt-2">
            <Button onClick={() => setSelectedLog(null)} className="bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl h-9 text-xs cursor-pointer">
              Close Detail Panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
