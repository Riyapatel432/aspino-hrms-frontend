"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PageBtn = ({ pg, label, disabled, active, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(pg)}
    disabled={disabled}
    className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none
        ${active
        ? "bg-sky-500 dark:bg-sky-600 text-white shadow-sm shadow-sky-200 dark:shadow-sky-900"
        : "text-slate-500 hover:text-sky-500 dark:text-slate-400 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:text-slate-500"
      }`}
  >
    {label ?? pg}
  </button>
);

/**
 * DataTable — Universal paginated, sortable, searchable table.
 * Supports both Client-side Mode and Server-side (Lazy) Mode.
 */
export function DataTable({
  columns = [],
  data,
  value,
  searchKeys,
  pageSize: defaultPageSize = 10,
  emptyMessage = "No records found.",
  title,
  headerRight,
  // Lazy / Server-Side Mode Props
  lazy = false,
  page: serverPage,
  rows: serverRows,
  totalRecords: serverTotalRecords,
  loading = false,
  search: serverSearch,
  sortBy: serverSortBy,
  sortOrder: serverSortOrder,
  onPageChange,
  onRowsChange,
  onSortChange,
  onSearchChange,
  onPage,
  onSort,
  onSearch,
}) {
  const isLazy = lazy || serverTotalRecords !== undefined || onPageChange !== undefined || onPage !== undefined;

  // Local state for non-lazy fallback
  const [localSearch, setLocalSearch] = useState("");
  const [localSortKey, setLocalSortKey] = useState(null);
  const [localSortDir, setLocalSortDir] = useState("asc");
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(defaultPageSize);

  // Debounced search for lazy/server-side mode
  const [inputSearch, setInputSearch] = useState(serverSearch ?? "");
  const debounceRef = useRef(null);

  // Sync inputSearch when serverSearch prop resets externally (e.g. clear button)
  useEffect(() => {
    if (serverSearch !== undefined && serverSearch !== inputSearch) {
      setInputSearch(serverSearch);
    }
  }, [serverSearch]);

  const rawData = Array.isArray(value) ? value : Array.isArray(data) ? data : [];

  // Effective state variables
  const currentSearch = isLazy ? (serverSearch ?? localSearch) : localSearch;
  const currentSortKey = isLazy ? (serverSortBy ?? localSortKey) : localSortKey;
  const currentSortDir = isLazy ? (serverSortOrder ?? localSortDir) : localSortDir;
  const currentPage = isLazy ? (serverPage ?? 1) : localPage;
  const currentRows = isLazy ? (serverRows ?? defaultPageSize) : localPageSize;

  // Search Keys for client-side mode
  const keys = searchKeys || columns.map((c) => c.key);

  // Client-side filtering & sorting
  const filtered = useMemo(() => {
    if (isLazy || !currentSearch.trim()) return rawData;
    const q = currentSearch.toLowerCase();
    return rawData.filter((row) =>
      keys.some((k) => {
        const val = k.split(".").reduce((o, p) => o?.[p], row);
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [isLazy, rawData, currentSearch, keys]);

  const sorted = useMemo(() => {
    if (isLazy || !currentSortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = currentSortKey.split(".").reduce((o, p) => o?.[p], a) ?? "";
      const bv = currentSortKey.split(".").reduce((o, p) => o?.[p], b) ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return currentSortDir === "asc" ? cmp : -cmp;
    });
  }, [isLazy, filtered, currentSortKey, currentSortDir]);

  // Total records & paginated data
  const totalCount = isLazy ? (serverTotalRecords ?? rawData.length) : sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentRows));
  const safePage = Math.min(currentPage, totalPages);
  const displayRows = isLazy ? rawData : sorted.slice((safePage - 1) * currentRows, safePage * currentRows);

  // Handlers
  const handlePage = (newPage) => {
    if (isLazy) {
      if (onPageChange) onPageChange(newPage);
      if (onPage) onPage({ page: newPage, first: (newPage - 1) * currentRows, rows: currentRows });
    } else {
      setLocalPage(newPage);
    }
  };

  const handleRows = (newRows) => {
    if (isLazy) {
      if (onRowsChange) onRowsChange(newRows);
      if (onPageChange) onPageChange(1);
      if (onPage) onPage({ page: 1, first: 0, rows: newRows });
    } else {
      setLocalPageSize(newRows);
      setLocalPage(1);
    }
  };

  const handleSort = (key) => {
    const nextDir = currentSortKey === key && currentSortDir === "asc" ? "desc" : "asc";
    if (isLazy) {
      if (onSortChange) onSortChange(key, nextDir);
      if (onSort) onSort({ sortField: key, sortOrder: nextDir === "asc" ? 1 : -1 });
      if (onPageChange) onPageChange(1);
    } else {
      setLocalSortKey(key);
      setLocalSortDir(nextDir);
      setLocalPage(1);
    }
  };

  const handleSearch = (term) => {
    if (isLazy) {
      setInputSearch(term);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (onSearchChange) onSearchChange(term);
        if (onSearch) onSearch(term);
        if (onPageChange) onPageChange(1);
      }, 350);
    } else {
      setLocalSearch(term);
      setLocalPage(1);
    }
  };

  const SortIcon = ({ colKey }) => {
    if (currentSortKey !== colKey)
      return <ChevronsUpDown className="w-3 h-3 opacity-30 ml-1 inline" />;
    return currentSortDir === "asc" || currentSortDir === 1 ? (
      <ChevronUp className="w-3 h-3 text-sky-500 ml-1 inline" />
    ) : (
      <ChevronDown className="w-3 h-3 text-sky-500 ml-1 inline" />
    );
  };

  // Smart page numbers
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 1;
    const left = Math.max(2, safePage - delta);
    const right = Math.min(totalPages - 1, safePage + delta);
    const range = [];
    for (let i = left; i <= right; i++) range.push(i);
    const withDots = [];
    if (left > 2) withDots.push("...");
    range.forEach((p) => withDots.push(p));
    if (right < totalPages - 1) withDots.push("...");
    return [1, ...withDots, totalPages];
  }, [totalPages, safePage]);

  return (
    <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {title && (
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
              {title}
            </h3>
          )}
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={isLazy ? inputSearch : currentSearch}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 h-8 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-400/40 placeholder:text-slate-400 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {headerRight}
          {/* Rows per page */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Rows:</span>
            <Select
              value={String(currentRows)}
              onValueChange={(val) => handleRows(Number(val))}
            >
              <SelectTrigger className="h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/40 w-[70px]">
                <SelectValue placeholder={String(currentRows)} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                {[5, 10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Area with Loading Overlay */}
      <div className="relative overflow-x-auto">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
              <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Loading data...
              </span>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() =>
                    col.sortable !== false && handleSort(col.key)
                  }
                  className={`p-4 text-[11px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap select-none
                    ${
                      col.sortable !== false
                        ? "cursor-pointer hover:text-sky-500 transition-colors"
                        : ""
                    }`}
                >
                  {col.label}
                  {col.sortable !== false && <SortIcon colKey={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {displayRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="p-10 text-center text-slate-400 text-sm font-medium"
                >
                  {currentSearch
                    ? `No results for "${currentSearch}"`
                    : emptyMessage}
                </td>
              </tr>
            ) : (
              displayRows.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className="hover:bg-sky-50 dark:bg-sky-500/10/30 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="p-4 text-sm text-slate-700 dark:text-slate-300 align-top"
                    >
                      {col.render
                        ? col.render(row)
                        : (() => {
                            const val = col.key.split(".").reduce((o, p) => o?.[p], row);
                            return val != null ? (
                              String(val)
                            ) : (
                              <span className="text-slate-300">-</span>
                            );
                          })()}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap justify-between items-center gap-3">
        <span className="text-xs text-slate-400 font-medium">
          Showing{" "}
          <strong className="text-slate-600 dark:text-slate-300">
            {totalCount === 0 ? 0 : (safePage - 1) * currentRows + 1}
            {"-"}
            {Math.min(safePage * currentRows, totalCount)}
          </strong>{" "}
          of{" "}
          <strong className="text-slate-600 dark:text-slate-300">
            {totalCount}
          </strong>{" "}
          records
        </span>

        <div className="flex items-center gap-1">
          <PageBtn
            onClick={handlePage}
            pg={1}
            label={<ChevronsLeft className="w-3.5 h-3.5" />}
            disabled={safePage <= 1}
          />
          <PageBtn
            onClick={handlePage}
            pg={safePage - 1}
            label={<ChevronLeft className="w-3.5 h-3.5" />}
            disabled={safePage <= 1}
          />

          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span
                key={"dot-" + i}
                className="px-1 text-slate-400 text-xs font-bold select-none"
              >
                ...
              </span>
            ) : (
              <PageBtn
                onClick={handlePage}
                key={p}
                pg={p}
                active={p === safePage}
              />
            )
          )}

          <PageBtn
            onClick={handlePage}
            pg={safePage + 1}
            label={<ChevronRight className="w-3.5 h-3.5" />}
            disabled={safePage >= totalPages}
          />
          <PageBtn
            onClick={handlePage}
            pg={totalPages}
            label={<ChevronsRight className="w-3.5 h-3.5" />}
            disabled={safePage >= totalPages}
          />
        </div>
      </div>
    </div>
  );
}
