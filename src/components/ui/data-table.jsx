"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PageBtn = ({ pg, label, disabled, active, onClick }) => (
  <button
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
 *
 * Props:
 *  - columns: [{ key, label, sortable?, render?(row) }]
 *  - data: array of row objects
 *  - searchKeys?: array of keys to search on (default: all column keys)
 *  - pageSize?: default rows per page (default: 10)
 *  - emptyMessage?: string
 *  - title?: string — shown in card header
 *  - headerRight?: ReactNode — extra content in card header (e.g. filters)
 */
export function DataTable({
  columns = [],
  data = [],
  searchKeys,
  pageSize: defaultPageSize = 10,
  emptyMessage = "No records found.",
  title,
  headerRight,
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const keys = searchKeys || columns.map((c) => c.key);

  // Filtered
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      keys.some((k) => {
        const val = k.split(".").reduce((o, p) => o?.[p], row);
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [data, search, keys]);

  // Sorted
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = sortKey.split(".").reduce((o, p) => o?.[p], a) ?? "";
      const bv = sortKey.split(".").reduce((o, p) => o?.[p], b) ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginated
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown className="w-3 h-3 opacity-30 ml-1 inline" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-sky-500 ml-1 inline" />
      : <ChevronDown className="w-3 h-3 text-sky-500 ml-1 inline" />;
  };



  // Smart page numbers: show first, last, and window around current
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
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
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {title && (
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">{title}</h3>
          )}
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
            <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
              <SelectTrigger className="h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 px-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/40 w-[70px]">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                {[5, 10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`p-4 text-[11px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap select-none
                    ${col.sortable !== false ? "cursor-pointer hover:text-sky-500 transition-colors" : ""}`}
                >
                  {col.label}
                  {col.sortable !== false && <SortIcon colKey={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-10 text-center text-slate-400 text-sm font-medium">
                  {search ? `No results for "${search}"` : emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className="hover:bg-sky-50 dark:bg-sky-500/10/30 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="p-4 text-sm text-slate-700 dark:text-slate-300 align-top">
                      {col.render
                        ? col.render(row)
                        : (() => {
                            const val = col.key.split(".").reduce((o, p) => o?.[p], row);
                            return val != null ? String(val) : <span className="text-slate-300">-</span>;
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
            {sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            {"-"}
            {Math.min(safePage * pageSize, sorted.length)}
          </strong>{" "}
          of <strong className="text-slate-600 dark:text-slate-300">{sorted.length}</strong> records
          {data.length !== sorted.length && (
            <span className="text-sky-500"> (filtered from {data.length})</span>
          )}
        </span>

        <div className="flex items-center gap-1">
          <PageBtn onClick={setPage} pg={1} label={<ChevronsLeft className="w-3.5 h-3.5" />} disabled={safePage <= 1} />
          <PageBtn onClick={setPage} pg={safePage - 1} label={<ChevronLeft className="w-3.5 h-3.5" />} disabled={safePage <= 1} />

          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={"dot-" + i} className="px-1 text-slate-400 text-xs font-bold select-none">...</span>
            ) : (
              <PageBtn onClick={setPage} key={p} pg={p} active={p === safePage} />
            )
          )}

          <PageBtn onClick={setPage} pg={safePage + 1} label={<ChevronRight className="w-3.5 h-3.5" />} disabled={safePage >= totalPages} />
          <PageBtn onClick={setPage} pg={totalPages} label={<ChevronsRight className="w-3.5 h-3.5" />} disabled={safePage >= totalPages} />
        </div>
      </div>
    </div>
  );
}
