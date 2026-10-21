"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePermissions, RouteGuard } from "@/context/PermissionContext";
import {
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Save,
  Search,
  Check,
  X,
  Users,
  KeyRound,
  SlidersHorizontal,
  AlertCircle,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Page Shell (RouteGuard)
// ─────────────────────────────────────────────────────────────────────────────

export default function RolesManagementPage() {
  return (
    <RouteGuard permission="roles:read">
      <RolesManagerContent />
    </RouteGuard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function getAuthHeaders() {
  const token = getCookie("hrToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Known actions for the permission form dropdown.
 */
const PERMISSION_ACTIONS = [
  { value: "read", label: "Read" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "sidebar", label: "Sidebar Access" },
  { value: "manage", label: "Manage (Full)" },
];

/**
 * Sort order for actions in the permission matrix.
 */
const ACTION_ORDER = {
  sidebar: 1,
  create: 2,
  read: 3,
  update: 4,
  delete: 5,
  approve: 6,
  reject: 7,
  export: 8,
  import: 9,
  manage: 10,
};

function getPermissionIds(role) {
  if (!role) return [];
  if (Array.isArray(role.permissionIds)) return role.permissionIds;
  if (Array.isArray(role.rolePermissions))
    return role.rolePermissions.map((rp) => rp.permissionId || rp.id || rp);
  if (Array.isArray(role.permissions))
    return role.permissions.map((p) => p.id || p);
  return [];
}

/** Group a flat permission list by module */
function groupByModule(permissions) {
  const groups = {};
  for (const perm of permissions) {
    const key = (perm.module || "general").toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(perm);
  }
  // Sort permissions within each group
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const orderA = ACTION_ORDER[(a.action || "").toLowerCase()] ?? 99;
      const orderB = ACTION_ORDER[(b.action || "").toLowerCase()] ?? 99;
      return orderA - orderB || (a.name || "").localeCompare(b.name || "");
    });
  }
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour helpers for permission chips
// ─────────────────────────────────────────────────────────────────────────────

const ACTION_CHIP_CHECKED = {
  read:    "border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shadow-xs font-bold ring-1 ring-sky-500/20",
  create:  "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold ring-1 ring-emerald-500/20",
  update:  "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shadow-xs font-bold ring-1 ring-amber-500/20",
  delete:  "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-xs font-bold ring-1 ring-rose-500/20",
  approve: "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold ring-1 ring-indigo-500/20",
  sidebar: "border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs font-bold ring-1 ring-purple-500/20",
};
const CHIP_UNCHECKED = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50";

function chipStyle(action, checked) {
  if (!checked) return CHIP_UNCHECKED;
  return ACTION_CHIP_CHECKED[(action || "").toLowerCase()] ||
    "border-aspino-primary bg-aspino-primary/10 text-aspino-primary shadow-xs font-bold ring-1 ring-aspino-primary/20";
}

const CHECK_BOX_CHECKED = {
  read:    "bg-sky-600 text-white border border-sky-600 shadow-xs",
  create:  "bg-emerald-600 text-white border border-emerald-600 shadow-xs",
  update:  "bg-amber-600 text-white border border-amber-600 shadow-xs",
  delete:  "bg-rose-600 text-white border border-rose-600 shadow-xs",
  approve: "bg-indigo-600 text-white border border-indigo-600 shadow-xs",
  sidebar: "bg-purple-600 text-white border border-purple-600 shadow-xs",
};

function checkboxStyle(action, checked) {
  if (!checked) return "border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent";
  return CHECK_BOX_CHECKED[(action || "").toLowerCase()] ||
    "bg-aspino-primary text-white border border-aspino-primary shadow-xs";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function RolesManagerContent() {
  const { can, refreshPermissions } = usePermissions();
  const [activeTab, setActiveTab] = useState("matrix"); // 'matrix' | 'roles' | 'permissions'

  // Data
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());

  // Loading / saving
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  // Role modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState("create"); // 'create' | 'edit'
  const [roleNameInput, setRoleNameInput] = useState("");
  const [roleDescInput, setRoleDescInput] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleModalLoading, setRoleModalLoading] = useState(false);
  const [roleFormError, setRoleFormError] = useState("");

  // Permission modal state — now structured (module + action + description)
  const [showPermModal, setShowPermModal] = useState(false);
  const [permModalMode, setPermModalMode] = useState("create"); // 'create' | 'edit'
  const [permModule, setPermModule] = useState("");
  const [permAction, setPermAction] = useState("read");
  const [permDescription, setPermDescription] = useState("");
  const [editingPermId, setEditingPermId] = useState(null);
  const [permModalLoading, setPermModalLoading] = useState(false);
  const [permFormError, setPermFormError] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // ───────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ───────────────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (targetRoleId = null) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${backendUrl}/roles`, { headers }),
        fetch(`${backendUrl}/permissions`, { headers }),
      ]);

      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error("Failed to load roles and permissions");
      }

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      const rolesList = Array.isArray(rolesData) ? rolesData : [];
      const permsList = Array.isArray(permsData)
        ? permsData
        : Array.isArray(permsData?.permissions)
        ? permsData.permissions
        : [];

      setRoles(rolesList);
      setAllPermissions(permsList);

      if (rolesList.length > 0) {
        const toSelect = targetRoleId
          ? rolesList.find((r) => r.id === targetRoleId)
          : selectedRoleId
          ? rolesList.find((r) => r.id === selectedRoleId)
          : rolesList[0];

        const active = toSelect || rolesList[0];
        setSelectedRoleId(active.id);
        setSelectedPermissionIds(new Set(getPermissionIds(active)));
      }
    } catch (err) {
      toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, selectedRoleId]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Derived state
  // ───────────────────────────────────────────────────────────────────────────

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const groupedPermissions = useMemo(() => groupByModule(allPermissions), [allPermissions]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return groupedPermissions;
    const result = {};
    for (const [mod, perms] of Object.entries(groupedPermissions)) {
      const matching = perms.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.action?.toLowerCase().includes(q) ||
          p.module?.toLowerCase().includes(q) ||
          mod.includes(q)
      );
      if (matching.length) result[mod] = matching;
    }
    return result;
  }, [groupedPermissions, searchQuery]);

  // ───────────────────────────────────────────────────────────────────────────
  // Permission checkbox toggles
  // ───────────────────────────────────────────────────────────────────────────

  const togglePermission = useCallback((perm) => {
    if (!can("roles:update")) {
      toast.error("You do not have permission to modify roles.");
      return;
    }
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(perm.id)) next.delete(perm.id);
      else next.add(perm.id);
      return next;
    });
  }, [can]);

  const toggleModule = useCallback((modulePerms) => {
    if (!can("roles:update")) {
      toast.error("You do not have permission to modify roles.");
      return;
    }
    const allChecked = modulePerms.every((p) => selectedPermissionIds.has(p.id));
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (allChecked) modulePerms.forEach((p) => next.delete(p.id));
      else modulePerms.forEach((p) => next.add(p.id));
      return next;
    });
  }, [can, selectedPermissionIds]);

  const applyPreset = useCallback((preset) => {
    if (!can("roles:update")) {
      toast.error("You do not have permission to modify roles.");
      return;
    }
    const list = allPermissions;
    if (preset === "READ_ONLY") {
      const ids = new Set(list.filter((p) => ["read", "sidebar"].includes(p.action?.toLowerCase())).map((p) => p.id));
      setSelectedPermissionIds(ids);
      toast.success(`Read-Only preset applied (${ids.size} permissions)`);
    } else if (preset === "CRUD") {
      const ids = new Set(list.filter((p) => ["read", "create", "update", "delete", "sidebar"].includes(p.action?.toLowerCase())).map((p) => p.id));
      setSelectedPermissionIds(ids);
      toast.success(`Standard CRUD preset applied (${ids.size} permissions)`);
    } else if (preset === "FULL") {
      const ids = new Set(list.map((p) => p.id));
      setSelectedPermissionIds(ids);
      toast.success(`Full Access preset applied (${ids.size} permissions)`);
    } else if (preset === "CLEAR") {
      setSelectedPermissionIds(new Set());
      toast.info("Cleared all permissions");
    }
  }, [can, allPermissions]);

  // ───────────────────────────────────────────────────────────────────────────
  // Save permissions
  // ───────────────────────────────────────────────────────────────────────────

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    if (!can("roles:update")) {
      toast.error("You do not have permission to update role permissions.");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${backendUrl}/roles/${selectedRoleId}/permissions`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissionIds: Array.from(selectedPermissionIds) }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update permissions");
      }
      toast.success("Role permissions saved!");
      await fetchData(selectedRoleId);
      await refreshPermissions();
      window?.dispatchEvent(new Event("permissions-updated"));
    } catch (err) {
      toast.error(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Role CRUD
  // ───────────────────────────────────────────────────────────────────────────

  const openRoleModal = (mode, role = null) => {
    setRoleModalMode(mode);
    setRoleFormError("");
    if (mode === "edit" && role) {
      setEditingRoleId(role.id);
      setRoleNameInput(role.displayName || role.name || "");
      setRoleDescInput(role.description || "");
    } else {
      setEditingRoleId(null);
      setRoleNameInput("");
      setRoleDescInput("");
    }
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setRoleFormError("");
    const trimmed = roleNameInput.trim();
    if (!trimmed) { setRoleFormError("Role name is required."); return; }
    try {
      setRoleModalLoading(true);
      const url = roleModalMode === "create" ? `${backendUrl}/roles` : `${backendUrl}/roles/${editingRoleId}`;
      const method = roleModalMode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: trimmed.toUpperCase().replace(/\s+/g, "_"),
          displayName: trimmed,
          description: roleDescInput.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save role");
      }
      const savedRole = await res.json();
      toast.success(roleModalMode === "create" ? "Role created!" : "Role updated!");
      setShowRoleModal(false);
      await fetchData(savedRole?.id || selectedRoleId);
    } catch (err) {
      setRoleFormError(err.message || "Failed to save role");
    } finally {
      setRoleModalLoading(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) { toast.error("System roles cannot be deleted."); return; }
    if (!confirm(`Delete role "${role.displayName || role.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${backendUrl}/roles/${role.id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed"); }
      toast.success("Role deleted");
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete role");
    }
  };

  const handleDuplicateRole = async (role) => {
    try {
      const res = await fetch(`${backendUrl}/roles/${role.id}/duplicate`, { method: "POST", headers: getAuthHeaders() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed"); }
      const newRole = await res.json();
      toast.success(`Duplicated as "${newRole.displayName}"`);
      await fetchData(newRole.id);
    } catch (err) {
      toast.error(err.message || "Failed to duplicate role");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Permission CRUD — structured form (module + action)
  // ───────────────────────────────────────────────────────────────────────────

  const openPermModal = (mode, perm = null) => {
    setPermModalMode(mode);
    setPermFormError("");
    if (mode === "edit" && perm) {
      setEditingPermId(perm.id);
      setPermModule(perm.module || "");
      setPermAction(perm.action || "read");
      setPermDescription(perm.description || "");
    } else {
      setEditingPermId(null);
      setPermModule("");
      setPermAction("read");
      setPermDescription("");
    }
    setShowPermModal(true);
  };

  const handleSavePerm = async (e) => {
    e.preventDefault();
    setPermFormError("");
    const module = permModule.toLowerCase().trim().replace(/[\s-]+/g, "_");
    const action = permAction.toLowerCase().trim();

    if (!module) { setPermFormError("Module name is required."); return; }
    if (!action) { setPermFormError("Action is required."); return; }
    if (/\s/.test(module)) { setPermFormError("Module must not contain spaces. Use underscores."); return; }

    const name = `${module}:${action}`;

    try {
      setPermModalLoading(true);

      if (permModalMode === "edit" && editingPermId) {
        const res = await fetch(`${backendUrl}/permissions/${editingPermId}`, {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, module, action, application: "GLOBAL", description: permDescription || null }),
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Failed to update"); }
        toast.success("Permission updated!");
        setShowPermModal(false);
        await fetchData(selectedRoleId);
        return;
      }

      // Create mode
      const res = await fetch(`${backendUrl}/permissions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, module, action, application: "GLOBAL", description: permDescription || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Failed to create"); }
      toast.success("Permission created!");
      setShowPermModal(false);
      await fetchData(selectedRoleId);
    } catch (err) {
      setPermFormError(err.message || "Failed to save permission");
    } finally {
      setPermModalLoading(false);
    }
  };

  const handleDeletePerm = async (perm) => {
    if (!confirm(`Delete permission "${perm.name}"? Role mappings will also be removed.`)) return;
    try {
      const res = await fetch(`${backendUrl}/permissions/${perm.id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Failed"); }
      toast.success("Permission deleted");
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to delete permission");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Column definitions
  // ───────────────────────────────────────────────────────────────────────────

  const rolesColumns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Role",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-aspino-primary/20 to-sky-500/20 text-aspino-primary border border-aspino-primary/20 font-bold shadow-xs">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{row.displayName || row.name}</span>
              <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${row.isSystem ? "border-sky-200 bg-sky-50 text-sky-700" : "border-purple-200 bg-purple-50 text-purple-700"}`}>
                {row.isSystem ? "SYSTEM" : "CUSTOM"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "userCount",
      header: "Users",
      cell: ({ row }) => {
        const count = row.userCount ?? 0;
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "permissionCount",
      header: "Permissions",
      cell: ({ row }) => {
        const count = typeof row.permissionCount === "number" ? row.permissionCount : getPermissionIds(row).length;
        const total = allPermissions.length || 1;
        const pct = Math.round((count / total) * 100);
        return (
          <div className="space-y-1 min-w-[120px]">
            <div className="flex justify-between text-[11px]">
              <span className="font-bold text-slate-700 dark:text-slate-300">{count} / {total}</span>
              <span className="font-semibold text-aspino-primary">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-aspino-primary to-sky-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline" size="sm"
            onClick={() => { setSelectedRoleId(row.id); setSelectedPermissionIds(new Set(getPermissionIds(row))); setActiveTab("matrix"); }}
            className="h-7 text-[11px] px-2.5 gap-1.5 border-slate-200 dark:border-slate-700 hover:border-aspino-primary text-slate-700 dark:text-slate-200 hover:text-aspino-primary font-medium cursor-pointer"
          >
            <SlidersHorizontal className="h-3 w-3" /> Matrix
          </Button>
          {can("roles:update") && (
            <Button variant="ghost" size="icon" onClick={() => openRoleModal("edit", row)} className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer" title="Edit Role">
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          )}
          {can("roles:create") && (
            <Button variant="ghost" size="icon" onClick={() => handleDuplicateRole(row)} className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer" title="Duplicate Role">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          {!row.isSystem && can("roles:delete") && (
            <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(row)} className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer" title="Delete Role">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ], [allPermissions.length, can]);

  const permissionsColumns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Permission Key",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 border border-sky-200 dark:border-sky-800">
            <KeyRound className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{row.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "module",
      header: "Module",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">{row.module || "general"}</Badge>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const act = (row.action || "read").toLowerCase();
        const styles = {
          manage: "bg-rose-50 text-rose-700 border-rose-200",
          delete: "bg-rose-50 text-rose-700 border-rose-200",
          create: "bg-emerald-50 text-emerald-700 border-emerald-200",
          approve: "bg-emerald-50 text-emerald-700 border-emerald-200",
          update: "bg-amber-50 text-amber-700 border-amber-200",
          sidebar: "bg-purple-50 text-purple-700 border-purple-200",
        };
        return (
          <Badge className={`text-[10px] uppercase font-bold border ${styles[act] || "bg-sky-50 text-sky-700 border-sky-200"}`}>
            {act}
          </Badge>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{row.description || "—"}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {can("permissions:update") && (
            <Button variant="ghost" size="icon" onClick={() => openPermModal("edit", row)} className="h-7 w-7 text-slate-500 hover:text-slate-900 cursor-pointer" title="Edit">
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          )}
          {can("permissions:delete") && (
            <Button variant="ghost" size="icon" onClick={() => handleDeletePerm(row)} className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ], [can]);

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-aspino-primary border-t-transparent shadow-md" />
        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Loading Access Control...</p>
      </div>
    );
  }

  const totalSelected = selectedPermissionIds.size;

  return (
    <div className="space-y-6 p-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-6 backdrop-blur-md shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-aspino-primary to-sky-600 text-white shadow-md shadow-aspino-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Roles & Permissions
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manage roles, assign permissions, and control access with <code className="font-mono text-aspino-primary font-bold">module:action</code> convention.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tab Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
              {[
                { id: "matrix", icon: SlidersHorizontal, label: "Matrix" },
                { id: "roles",  icon: Shield,            label: `Roles (${roles.length})` },
                { id: "permissions", icon: KeyRound,    label: `Permissions (${allPermissions.length})` },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === id
                      ? "bg-white dark:bg-slate-900 text-aspino-primary shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {can("roles:create") && (
              <Button
                onClick={() => openRoleModal("create")}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" /> New Role
              </Button>
            )}
            {can("permissions:create") && (
              <Button
                onClick={() => openPermModal("create")}
                className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-md gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" /> New Permission
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Matrix Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "matrix" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* Left: Role Selector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-aspino-primary" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">Roles</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">{roles.length} roles</Badge>
              </div>

              <div className="mt-3 relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Filter roles..."
                  value={roleSearchQuery}
                  onChange={(e) => setRoleSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="mt-3 space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {roles
                  .filter((r) =>
                    !roleSearchQuery ||
                    r.name?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
                    r.displayName?.toLowerCase().includes(roleSearchQuery.toLowerCase())
                  )
                  .map((role) => {
                    const isSelected = role.id === selectedRoleId;
                    const count = getPermissionIds(role).length;
                    return (
                      <div
                        key={role.id}
                        onClick={() => { setSelectedRoleId(role.id); setSelectedPermissionIds(new Set(getPermissionIds(role))); }}
                        className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                          isSelected
                            ? "border-aspino-primary bg-aspino-primary/10 dark:bg-aspino-primary/20 shadow-xs ring-1 ring-aspino-primary/40"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${isSelected ? "bg-aspino-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
                            <Shield className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{role.displayName || role.name}</span>
                              {role.isSystem && <span className="text-[9px] font-bold px-1 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">SYS</span>}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono truncate">{role.name}</p>
                          </div>
                        </div>
                        <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px] font-bold shrink-0">
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right: Permission Matrix */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-xs space-y-4">
              {/* Control bar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Configuring:</span>
                    <h2 className="font-black text-base text-slate-900 dark:text-slate-100">
                      {selectedRole ? (selectedRole.displayName || selectedRole.name) : "Select a Role"}
                    </h2>
                    {selectedRole?.isSystem && (
                      <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] font-bold">SYSTEM</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-bold text-aspino-primary">{totalSelected}</span> of{" "}
                    <span className="font-bold">{allPermissions.length}</span> permissions selected
                  </p>
                </div>
                <Button
                  onClick={handleSavePermissions}
                  disabled={saving || !selectedRoleId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md gap-1.5 cursor-pointer"
                >
                  {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
                  Save Changes
                </Button>
              </div>

              {/* Presets + Search */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "READ_ONLY", label: "Read Only", cls: "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100" },
                    { id: "CRUD",      label: "CRUD",      cls: "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                    { id: "FULL",      label: "Full Access",cls: "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100" },
                    { id: "CLEAR",     label: "Clear All", cls: "border-slate-200 bg-white text-slate-500 hover:bg-slate-50" },
                  ].map(({ id, label, cls }) => (
                    <Button
                      key={id}
                      type="button" variant="outline" size="sm"
                      onClick={() => applyPreset(id)}
                      className={`h-7 text-[11px] px-2.5 rounded-lg font-bold cursor-pointer dark:bg-transparent ${cls}`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Permission Groups */}
              <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
                {Object.keys(filteredGroups).length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No permissions match "{searchQuery}"</p>
                  </div>
                ) : (
                  Object.entries(filteredGroups).map(([module, perms]) => {
                    const checkedCount = perms.filter((p) => selectedPermissionIds.has(p.id)).length;
                    const allChecked = checkedCount === perms.length;
                    return (
                      <div key={module} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 space-y-3 shadow-xs">
                        {/* Module header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-aspino-primary" />
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">{module}</span>
                            <Badge className="text-[10px] font-bold py-0.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {checkedCount} / {perms.length}
                            </Badge>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleModule(perms)}
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                              allChecked
                                ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : "bg-aspino-primary/10 text-aspino-primary border-aspino-primary/20 hover:bg-aspino-primary/20"
                            }`}
                          >
                            {allChecked ? "Clear Module" : "Select All"}
                          </button>
                        </div>

                        {/* Permission chips */}
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm) => {
                            const checked = selectedPermissionIds.has(perm.id);
                            return (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => togglePermission(perm)}
                                className={`group flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all duration-150 cursor-pointer ${chipStyle(perm.action, checked)}`}
                              >
                                <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md transition-all ${checkboxStyle(perm.action, checked)}`}>
                                  {checked && <Check className="h-3 w-3 stroke-[3.5] text-white" />}
                                </div>
                                <span className="font-mono text-[11px] font-bold">{perm.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Roles Tab ──────────────────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100">System Roles</h3>
            <p className="text-xs text-slate-500">All configured roles. Click Matrix to assign permissions.</p>
          </div>
          <DataTable
            columns={rolesColumns}
            data={roles}
            searchable
            searchPlaceholder="Search roles..."
            pageSize={10}
            emptyMessage="No roles found"
          />
        </div>
      )}

      {/* ── Permissions Tab ────────────────────────────────────────────────── */}
      {activeTab === "permissions" && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100">Permissions Directory</h3>
            <p className="text-xs text-slate-500">All registered permission rules (<code className="font-mono text-aspino-primary">module:action</code> format).</p>
          </div>
          <DataTable
            columns={permissionsColumns}
            data={allPermissions}
            searchable
            searchPlaceholder="Search by module or action..."
            pageSize={15}
            emptyMessage="No permissions found"
          />
        </div>
      )}

      {/* ── Role Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={showRoleModal} onOpenChange={(open) => { if (!open) setRoleFormError(""); setShowRoleModal(open); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                <Shield className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold tracking-tight text-white">
                  {roleModalMode === "create" ? "Add New Role" : "Edit Role"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                  {roleModalMode === "create" ? "Create a new access role" : "Update role details"}
                </DialogDescription>
              </div>
            </div>
          </div>
          <form onSubmit={handleSaveRole} className="p-6 space-y-4 bg-card">
            {roleFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{roleFormError}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="role-name-input" className="text-xs font-bold">Role Name *</Label>
              <Input
                id="role-name-input"
                placeholder="e.g. HR Manager, Supervisor"
                value={roleNameInput}
                onChange={(e) => setRoleNameInput(e.target.value)}
                required
                className="text-xs h-10 rounded-xl bg-muted/50 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc-input" className="text-xs font-bold">Description</Label>
              <Input
                id="role-desc-input"
                placeholder="Optional description..."
                value={roleDescInput}
                onChange={(e) => setRoleDescInput(e.target.value)}
                className="text-xs h-10 rounded-xl bg-muted/50 border-border"
              />
            </div>
            <DialogFooter className="pt-3 border-t border-border/50 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowRoleModal(false)} className="h-9 text-xs font-bold rounded-xl cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={roleModalLoading} className="h-9 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-5 rounded-xl shadow-md cursor-pointer">
                {roleModalLoading ? "Saving..." : roleModalMode === "create" ? "Create Role" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Permission Modal (Structured Form) ────────────────────────────── */}
      <Dialog open={showPermModal} onOpenChange={(open) => { if (!open) setPermFormError(""); setShowPermModal(open); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/50 shadow-2xl rounded-3xl bg-card">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                <KeyRound className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold tracking-tight text-white">
                  {permModalMode === "create" ? "Add Permission" : "Edit Permission"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                  {permModule && permAction
                    ? <>Key: <code className="font-mono text-sky-300">{permModule}:{permAction}</code></>
                    : "Permission name = module:action"}
                </DialogDescription>
              </div>
            </div>
          </div>
          <form onSubmit={handleSavePerm} className="p-6 space-y-4 bg-card">
            {permFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{permFormError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="perm-module" className="text-xs font-bold">Module *</Label>
              <Input
                id="perm-module"
                placeholder="e.g. employee, leave_master, roles"
                value={permModule}
                onChange={(e) => setPermModule(e.target.value.toLowerCase().replace(/[\s-]+/g, "_"))}
                required
                className="text-xs h-10 rounded-xl bg-muted/50 border-border font-mono"
              />
              <p className="text-[11px] text-slate-500">Use lowercase with underscores (e.g. <code className="font-mono">leave_master</code>)</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perm-action" className="text-xs font-bold">Action *</Label>
              <Select value={permAction} onValueChange={setPermAction}>
                <SelectTrigger id="perm-action" className="text-xs h-10 rounded-xl bg-muted/50 border-border">
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_ACTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perm-desc" className="text-xs font-bold">Description</Label>
              <Input
                id="perm-desc"
                placeholder="Optional description..."
                value={permDescription}
                onChange={(e) => setPermDescription(e.target.value)}
                className="text-xs h-10 rounded-xl bg-muted/50 border-border"
              />
            </div>

            {permModule && permAction && (
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <p className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold">
                  Permission key: <code className="font-mono font-bold text-sky-900 dark:text-sky-100">{permModule}:{permAction}</code>
                </p>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 mt-0.5">
                  Backend: <code className="font-mono">@RequirePermissions('{permModule}:{permAction}')</code>
                </p>
                <p className="text-[11px] text-sky-600 dark:text-sky-400">
                  Frontend: <code className="font-mono">can('{permModule}:{permAction}')</code>
                </p>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-border/50 gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPermModal(false)} className="h-9 text-xs font-bold rounded-xl cursor-pointer">Cancel</Button>
              <Button type="submit" disabled={permModalLoading} className="h-9 text-xs bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold px-5 rounded-xl shadow-md cursor-pointer">
                {permModalLoading ? "Saving..." : permModalMode === "create" ? "Create Permission" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
