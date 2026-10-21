"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { buildAbilityFor } from "@/lib/casl/ability";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types / Context shape
// ---------------------------------------------------------------------------

const PermissionContext = createContext({
  ability: null,
  permissions: [],
  role: null,
  user: null,
  isSuperAdmin: false,
  loading: true,
  /**
   * can("employee:read")           — checks action=read, subject=employee
   * can("employee", "read")        — legacy two-arg form (deprecated)
   */
  can: () => false,
  cannot: () => true,
  refreshPermissions: async () => {},
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

/**
 * Parse a permission check into { action, subject }.
 *
 * Supported call forms:
 *   can("employee:read")           → { action:"read",   subject:"employee" }
 *   can("employee", "read")        → { action:"read",   subject:"employee" }
 *   can("read", "employee")        → { action:"read",   subject:"employee" }
 */
function parsePermissionArgs(firstArg, secondArg) {
  if (!secondArg) {
    // Single string: "module:action" or "action:module" — always module:action
    const parts = String(firstArg).split(":");
    if (parts.length === 2) {
      return { subject: parts[0].toLowerCase(), action: parts[1].toLowerCase() };
    }
    // Fallback: treat as action only
    return { subject: firstArg.toLowerCase(), action: "read" };
  }

  // Two args: figure out which is action and which is subject
  const knownActions = new Set([
    "manage", "create", "read", "update", "delete",
    "approve", "reject", "export", "import", "sidebar",
    // legacy aliases
    "view", "edit", "add", "remove",
  ]);

  const a = String(firstArg).toLowerCase();
  const b = String(secondArg).toLowerCase();

  if (knownActions.has(a)) return { action: a, subject: b };
  if (knownActions.has(b)) return { action: b, subject: a };

  // Default: first=subject, second=action
  return { subject: a, action: b };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const token =
        getCookie("hrToken") ||
        (typeof window !== "undefined" ? localStorage.getItem("hrToken") : null);

      if (!token) {
        setLoading(false);
        return;
      }

      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const response = await fetch(`${backendUrl}/auth/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      const perms = Array.isArray(data.permissions) ? data.permissions : [];
      const resolvedRole =
        typeof data.role === "object" ? data.role?.name : data.role;

      setPermissions(perms);
      if (resolvedRole) setRole(resolvedRole);

      if (data.user) {
        const freshUser = {
          ...data.user,
          role: resolvedRole || data.user.role,
          roleRelation: typeof data.role === "object" ? data.role : data.user.roleRelation,
          permissions: perms,
        };
        setUser(freshUser);

        // Sync to cookie / localStorage so next page load starts faster
        if (typeof document !== "undefined") {
          try {
            const str = JSON.stringify(freshUser);
            document.cookie = `hrUser=${encodeURIComponent(str)}; path=/; max-age=86400; SameSite=Lax`;
            localStorage.setItem("hrUser", str);
          } catch (_) {}
        }
      }
    } catch (err) {
      // Silent catch — loading state will be set to false below
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();

    if (typeof window !== "undefined") {
      const handler = () => fetchPermissions();
      window.addEventListener("permissions-updated", handler);
      window.addEventListener("focus", handler);
      return () => {
        window.removeEventListener("permissions-updated", handler);
        window.removeEventListener("focus", handler);
      };
    }
  }, [fetchPermissions]);

  const ability = useMemo(() => buildAbilityFor(permissions, user), [permissions, user]);

  const isSuperAdmin = useMemo(() => {
    const roleName = (
      (typeof role === "string" ? role : "") ||
      (typeof user?.role === "string" ? user.role : "") ||
      user?.roleRelation?.name ||
      ""
    )
      .toUpperCase()
      .trim();
    return roleName === "SUPER_ADMIN" || roleName === "ADMIN" || roleName === "ADMINISTRATOR" || user?.isSuperAdmin === true;
  }, [role, user]);

  const isEmployee = useMemo(() => {
    const roleName = (
      (typeof role === "string" ? role : "") ||
      (typeof user?.role === "string" ? user.role : "") ||
      ""
    ).toUpperCase();
    return roleName === "EMPLOYEE" || roleName === "USER";
  }, [role, user]);

  /**
   * Check if the current user has a permission.
   *
   * Usage:
   *   can("employee:read")         ← preferred
   *   can("employee", "read")      ← legacy, still works
   */
  const can = useCallback(
    (firstArg, secondArg) => {
      if (isSuperAdmin) return true;
      if (loading) return false;
      if (!ability) return false;
      if (!firstArg) return false;

      // Handle direct permission name format like "delete-quotation", "sidebar-quotations"
      if (typeof firstArg === "string" && !secondArg) {
        const key = firstArg.trim().toLowerCase();
        if (Array.isArray(permissions)) {
          const directMatch = permissions.some((p) => (p.name || "").toLowerCase().trim() === key);
          if (directMatch) return true;
        }
      }

      const { action, subject } = parsePermissionArgs(firstArg, secondArg);
      return ability.can(action, subject);
    },
    [ability, loading, permissions, isSuperAdmin]
  );

  const cannot = useCallback(
    (firstArg, secondArg) => !can(firstArg, secondArg),
    [can]
  );

  const value = useMemo(
    () => ({
      ability,
      permissions,
      role,
      user,
      isSuperAdmin,
      isEmployee,
      loading,
      can,
      cannot,
      refreshPermissions: fetchPermissions,
    }),
    [ability, permissions, role, user, isSuperAdmin, isEmployee, loading, can, cannot, fetchPermissions]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

/**
 * Preferred hook for permission checks.
 *
 * const { can } = usePermission();
 * const canCreate = can("employee:create");
 * const canEdit   = can("employee:update");
 */
export function usePermission() {
  return usePermissions();
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/**
 * Conditionally render children based on permission.
 *
 * <Can permission="employee:create">
 *   <Button>Add Employee</Button>
 * </Can>
 *
 * <Can anyOf={["employee:create", "employee:update"]}>
 *   <Button>Manage</Button>
 * </Can>
 *
 * Legacy form still supported:
 * <Can I="read" a="employee">...</Can>
 */
export function Can({
  permission,
  anyOf,
  allOf,
  // Legacy props
  I: action,
  a: subject,
  do: altAction,
  on: altSubject,
  fallback = null,
  children,
}) {
  const { can, loading } = usePermissions();

  if (loading) return null;

  let allowed = false;

  if (permission) {
    // New preferred form: <Can permission="employee:create">
    allowed = can(permission);
  } else if (anyOf) {
    // At least one must match
    allowed = anyOf.some((p) => can(p));
  } else if (allOf) {
    // All must match
    allowed = allOf.every((p) => can(p));
  } else {
    // Legacy: <Can I="read" a="employee">
    const act = action || altAction;
    const subj = subject || altSubject;
    if (!act && !subj) {
      // No permission specified → show children
      allowed = true;
    } else {
      allowed = can(act, subj);
    }
  }

  return allowed ? <>{children}</> : fallback;
}

/**
 * Page-level access gate. Renders a 403 screen if the user lacks permission.
 *
 * <RouteGuard permission="employee:read">
 *   <EmployeePage />
 * </RouteGuard>
 *
 * Legacy form still supported:
 * <RouteGuard subject="employee" action="read">
 */
export function RouteGuard({
  permission,         // preferred: "module:action" string
  subject,           // legacy
  action = "read",   // legacy
  fallback,
  children,
}) {
  const { can, loading, isSuperAdmin } = usePermissions();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">
          Checking access permissions...
        </p>
      </div>
    );
  }

  // Resolve the permission to check
  const permKey = permission || (subject ? `${subject}:${action}` : null);
  const isAllowed = !permKey || can(permKey);

  if (!isAllowed) {
    if (fallback) return fallback;
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          You do not have the required permission (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {permKey}
          </code>
          ) to access this page. Please contact your system administrator.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
