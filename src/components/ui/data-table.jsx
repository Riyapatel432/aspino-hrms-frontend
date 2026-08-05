"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PackageOpen,
} from "lucide-react";

/**
 * DataTable — Universal paginated, sortable, searchable table.
 * Designed like Aspino-GatePass with full support for client-side and server-side (lazy) modes.
 */
export function DataTable({
  columns = [],
  data,
  value,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize: defaultPageSize = 10,
  rows: propRows,
  emptyMessage = "No data found",
  emptyDescription = "There are no records to display.",
  title,
  headerRight,
  actions,
  onRowClick,
  searchKeys,
  // Lazy / Server-Side Mode Props
  lazy = false,
  isServerSide: propIsServerSide,
  page: serverPage,
  currentPage: propCurrentPage,
  rows: serverRows,
  limit: propLimit,
  totalRecords: serverTotalRecords,
  totalCount: propTotalCount,
  totalPages: propTotalPages,
  loading = false,
  search: serverSearch,
  searchQuery: propSearchQuery,
  sortBy: serverSortBy,
  sortOrder: serverSortOrder,
  onPageChange,
  onRowsChange,
  onLimitChange,
  onSortChange,
  onSearchChange,
  onSearchQueryChange,
  onPage,
  onSort,
  onSearch,
}) {
  const isLazy =
    lazy ||
    propIsServerSide ||
    serverTotalRecords !== undefined ||
    propTotalCount !== undefined ||
    onPageChange !== undefined ||
    onPage !== undefined;

  const rawData = Array.isArray(value) ? value : Array.isArray(data) ? data : [];

  // Effective page size
  const effectivePageSize = propRows ?? serverRows ?? propLimit ?? defaultPageSize;

  // Local state for client-side mode
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localSortConfig, setLocalSortConfig] = useState({ key: null, direction: null });
  const [localRowsPerPage, setLocalRowsPerPage] = useState(effectivePageSize);

  // Debounced input search for server-side mode
  const activeServerSearch = serverSearch ?? propSearchQuery ?? "";
  const [inputSearch, setInputSearch] = useState(activeServerSearch);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (activeServerSearch !== undefined && activeServerSearch !== inputSearch) {
      setInputSearch(activeServerSearch);
    }
  }, [activeServerSearch]);

  // Current state values
  const activeSearchQuery = isLazy ? inputSearch : localSearchQuery;
  const activeCurrentPage = isLazy ? (serverPage ?? propCurrentPage ?? 1) : localCurrentPage;
  const activeRowsPerPage = isLazy ? effectivePageSize : localRowsPerPage;

  // Client-side search filtering
  const keysToSearch = useMemo(() => {
    if (searchKeys && searchKeys.length > 0) return searchKeys;
    return columns.map((c) => c.key || c.accessorKey || c.id).filter(Boolean);
  }, [searchKeys, columns]);

  const filteredData = useMemo(() => {
    if (isLazy) return rawData;
    if (!localSearchQuery.trim()) return rawData;
    const q = localSearchQuery.toLowerCase();
    return rawData.filter((row) =>
      keysToSearch.some((colKey) => {
        const value = colKey.split(".").reduce((o, p) => o?.[p], row);
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
      })
    );
  }, [rawData, localSearchQuery, keysToSearch, isLazy]);

  // Client-side sorting
  const currentSortKey = isLazy ? (serverSortBy ?? null) : localSortConfig.key;
  const currentSortDir = isLazy ? (serverSortOrder ?? null) : localSortConfig.direction;

  const sortedData = useMemo(() => {
    if (isLazy) return rawData;
    if (!currentSortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = currentSortKey.split(".").reduce((o, p) => o?.[p], a);
      const bVal = currentSortKey.split(".").reduce((o, p) => o?.[p], b);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return currentSortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, currentSortKey, currentSortDir, isLazy, rawData]);

  // Total count & total pages calculation
  const totalCount = isLazy
    ? (serverTotalRecords ?? propTotalCount ?? rawData.length)
    : sortedData.length;

  const activeTotalPages = isLazy
    ? (propTotalPages ?? Math.max(1, Math.ceil(totalCount / activeRowsPerPage)))
    : Math.max(1, Math.ceil(sortedData.length / activeRowsPerPage));

  const paginatedData = useMemo(() => {
    if (isLazy) return rawData;
    const safePage = Math.min(activeCurrentPage, activeTotalPages);
    return sortedData.slice(
      (safePage - 1) * activeRowsPerPage,
      safePage * activeRowsPerPage
    );
  }, [sortedData, activeCurrentPage, activeRowsPerPage, activeTotalPages, isLazy, rawData]);

  // Event handlers
  const handleSearchChange = (term) => {
    if (isLazy) {
      setInputSearch(term);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange?.(term);
        onSearchQueryChange?.(term);
        onSearch?.(term);
        onPageChange?.(1);
      }, 350);
    } else {
      setLocalSearchQuery(term);
      setLocalCurrentPage(1);
    }
  };

  const handleSort = (key) => {
    if (!key) return;
    const isAsc = currentSortKey === key && (currentSortDir === "asc" || currentSortDir === 1);
    const nextDir = isAsc ? "desc" : "asc";

    if (isLazy) {
      onSortChange?.(key, nextDir);
      onSort?.({ sortField: key, sortOrder: nextDir === "asc" ? 1 : -1 });
      onPageChange?.(1);
    } else {
      setLocalSortConfig({ key, direction: nextDir });
      setLocalCurrentPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    if (isLazy) {
      onPageChange?.(newPage);
      onPage?.({
        page: newPage,
        first: (newPage - 1) * activeRowsPerPage,
        rows: activeRowsPerPage,
      });
    } else {
      setLocalCurrentPage(newPage);
    }
  };

  const handleLimitChange = (newLimit) => {
    if (isLazy) {
      onRowsChange?.(newLimit);
      onLimitChange?.(newLimit);
      onPageChange?.(1);
      onPage?.({ page: 1, first: 0, rows: newLimit });
    } else {
      setLocalRowsPerPage(newLimit);
      setLocalCurrentPage(1);
    }
  };

  const getSortIcon = (colKey) => {
    if (currentSortKey !== colKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    if (currentSortDir === "asc" || currentSortDir === 1) {
      return <ArrowUp className="h-3.5 w-3.5 text-aspino-primary" />;
    }
    return <ArrowDown className="h-3.5 w-3.5 text-aspino-primary" />;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-0">
                {columns.map((_, j) => (
                  <Skeleton key={j} className="h-5 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const effectiveHeaderRight = headerRight || actions;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          {title && (
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              {title}
            </h3>
          )}
          {searchable && (
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={activeSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-10 bg-background border-border/60 focus:border-aspino-primary/50 transition-colors"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto sm:ml-0">
          {effectiveHeaderRight}
          <Badge variant="secondary" className="font-normal text-xs">
            {totalCount} record{totalCount !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col, index) => {
                const colKey = col.key || col.accessorKey || col.id || `col-${index}`;
                const colLabel = col.label ?? col.header ?? "";
                const isSortable = col.sortable !== false;

                return (
                  <TableHead
                    key={colKey}
                    className={`font-semibold text-xs uppercase tracking-wider text-muted-foreground ${
                      isSortable
                        ? "cursor-pointer select-none hover:text-foreground transition-colors"
                        : ""
                    }`}
                    onClick={() => isSortable && handleSort(colKey)}
                  >
                    <div className="flex items-center gap-1.5">
                      {colLabel}
                      {isSortable && getSortIcon(colKey)}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48">
                  <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-8">
                    <div className="rounded-full bg-muted p-4">
                      <PackageOpen className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">
                        {activeSearchQuery
                          ? `No results for "${activeSearchQuery}"`
                          : emptyMessage}
                      </p>
                      <p className="text-sm text-muted-foreground/70">{emptyDescription}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, i) => (
                <TableRow
                  key={row.id ?? i}
                  className={`transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-accent/50" : "hover:bg-muted/30"
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, j) => {
                    const colKey = col.key || col.accessorKey || col.id || `cell-${j}`;
                    return (
                      <TableCell key={colKey} className="py-3.5">
                        {col.render
                          ? col.render(row)
                          : col.cell
                          ? col.cell(row)
                          : (() => {
                              const val = colKey
                                ?.split(".")
                                .reduce((o, p) => o?.[p], row);
                              return val != null ? (
                                String(val)
                              ) : (
                                <span className="text-muted-foreground/40">-</span>
                              );
                            })()}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {activeTotalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(activeRowsPerPage)}
              onValueChange={(val) => handleLimitChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {activeCurrentPage} of {activeTotalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(1)}
                disabled={activeCurrentPage <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(activeCurrentPage - 1)}
                disabled={activeCurrentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(activeCurrentPage + 1)}
                disabled={activeCurrentPage >= activeTotalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(activeTotalPages)}
                disabled={activeCurrentPage >= activeTotalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
