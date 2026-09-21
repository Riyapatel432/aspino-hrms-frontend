"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { buildAbilityFor } from "@/lib/casl/ability";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const PermissionContext = createContext({
  ability: null,
  permissions: [],
  role: null,
  user: null,
  isSuperAdmin: false,
  loading: true,
  can: () => false,
  cannot: () => true,
  refreshPermissions: async () => {},
});

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export function PermissionProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const token = getCookie("hrToken") || (typeof window !== "undefined" ? localStorage.getItem("hrToken") : null);
      const userCookie = getCookie("hrUser") || (typeof window !== "undefined" ? localStorage.getItem("hrUser") : null);

      let parsedUser = null;
      if (userCookie) {
        try {
          parsedUser = JSON.parse(decodeURIComponent(userCookie));
          setUser(parsedUser);
          const rName = parsedUser.roleRelation?.name || parsedUser.role;
          if (rName) {
            setRole(rName);
          }
          if (Array.isArray(parsedUser.permissions) && parsedUser.permissions.length > 0) {
            setPermissions(parsedUser.permissions);
          }
        } catch (e) {
          console.error("Failed to parse user cookie", e);
        }
      }

      if (!token) {
        setLoading(false);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/auth/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const perms = data.permissions || [];
        setPermissions(perms);
        // Resolve role to a string regardless of whether it comes back as an object
        const resolvedRole = typeof data.role === "object" ? data.role?.name : data.role;
        if (resolvedRole) setRole(resolvedRole);
        if (data.user) setUser(data.user);
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const ability = useMemo(() => {
    return buildAbilityFor(permissions, user);
  }, [permissions, user]);

  const isSuperAdmin = useMemo(() => {
    // Derive role name from the state, prioritising the backend's resolved string
    const rName = (
      (typeof role === "string" ? role : "") ||
      (typeof user?.role === "string" ? user.role : "") ||
      user?.roleRelation?.name ||
      ""
    ).toUpperCase().trim();

    // Trust the backend-computed isSuperAdmin flag first (most reliable)
    if (user?.isSuperAdmin === true) return true;

    // Strict role name check — only SUPER_ADMIN qualifies
    if (rName === "SUPER_ADMIN") return true;

    // Explicit all:manage permission from the DB
    if (
      Array.isArray(permissions) &&
      permissions.some(
        (p) => typeof p === "object" && p?.module === "all" && p?.action === "manage"
      )
    ) return true;

    return false;
  }, [permissions, role, user]);

  const isEmployee = useMemo(() => {
    const extractRoleName = (r) => {
      if (!r) return "";
      if (typeof r === "string") return r;
      if (typeof r === "object") return r.name || r.role || r.displayName || "";
      return String(r);
    };

    const rName = (
      extractRoleName(role) ||
      extractRoleName(user?.role) ||
      extractRoleName(user?.roleRelation?.name) ||
      ""
    ).toUpperCase();

    return rName === "EMPLOYEE" || rName === "USER";
  }, [role, user]);

  const can = useCallback(
    (action, subject) => {
      if (!ability) return false;
      if (isSuperAdmin) return true;
      return ability.can(action, subject);
    },
    [ability, isSuperAdmin]
  );

  const cannot = useCallback(
    (action, subject) => {
      return !can(action, subject);
    },
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

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

export function Can({ I: action, a: subject, do: altAction, on: altSubject, fallback = null, children }) {
  const { can, loading } = usePermissions();
  const act = action || altAction;
  const subj = subject || altSubject;

  if (loading) return null;
  if (!act || !subj) return children;

  return can(act, subj) ? <>{children}</> : fallback;
}

export function RouteGuard({ action = "read", subject, fallback, children }) {
  const { can, loading } = usePermissions();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-3 text-sm text-muted-foreground">Checking access permissions...</p>
      </div>
    );
  }

  if (subject && !can(action, subject)) {
    if (fallback) return fallback;

    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          You do not have the required permission (<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{subject}:{action}</code>) to access this page. Please contact your system administrator.
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
