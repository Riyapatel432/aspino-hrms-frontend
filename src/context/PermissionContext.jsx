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
        if (data.user) {
          const freshUser = {
            ...data.user,
            role: resolvedRole || data.user.role,
            roleRelation: typeof data.role === "object" ? data.role : data.user.roleRelation,
            permissions: perms,
          };
          setUser(freshUser);
          if (typeof document !== "undefined") {
            try {
              const freshUserStr = JSON.stringify(freshUser);
              document.cookie = `hrUser=${encodeURIComponent(freshUserStr)}; path=/; max-age=86400; SameSite=Lax`;
              localStorage.setItem("hrUser", freshUserStr);
            } catch (e) {
              console.error("Failed to sync fresh hrUser storage", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();

    const handlePermUpdate = () => {
      fetchPermissions();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("permissions-updated", handlePermUpdate);
      window.addEventListener("focus", handlePermUpdate);
      return () => {
        window.removeEventListener("permissions-updated", handlePermUpdate);
        window.removeEventListener("focus", handlePermUpdate);
      };
    }
  }, [fetchPermissions]);

  const ability = useMemo(() => {
    return buildAbilityFor(permissions, user);
  }, [permissions, user]);

  useEffect(() => {
    if (permissions && permissions.length > 0) {
      const employeePermissions = permissions.filter(
        (p) =>
          (typeof p === "string" && (p.includes("emp") || p.includes("employee"))) ||
          (p?.module && String(p.module).includes("emp")) ||
          (p?.name && String(p.name).includes("emp"))
      );
      console.log("Employee permissions from DB:", employeePermissions);
    }
    if (ability && ability.rules) {
      const employeeRules = ability.rules.filter(
        (r) => String(r.subject).includes("emp") || String(r.action).includes("emp")
      );
      console.log("Employee CASL rules:", employeeRules);
    }
  }, [permissions, ability]);

  const isSuperAdmin = useMemo(() => {
    // Derive role name from the state, prioritising the backend's resolved string
    const rName = (
      (typeof role === "string" ? role : "") ||
      (typeof user?.role === "string" ? user.role : "") ||
      user?.roleRelation?.name ||
      ""
    ).toUpperCase().trim();

    // Strict role name check — only SUPER_ADMIN qualifies
    return rName === "SUPER_ADMIN";
  }, [role, user]);

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
      if (subject) {
        const actLower = String(action).toLowerCase().trim();
        const rawSubj = String(subject).toLowerCase().trim();
        const cleanSubj = rawSubj.replace(/^sidebar-/, "");

        const actAliases = [actLower];
        if (actLower === "edit" || actLower === "update") {
          actAliases.push("edit", "update");
        } else if (actLower === "view" || actLower === "read") {
          actAliases.push("view", "read");
        } else if (actLower === "add" || actLower === "create") {
          actAliases.push("add", "create");
        } else if (actLower === "delete" || actLower === "remove") {
          actAliases.push("delete", "remove");
        }

        const aliases = Array.from(
          new Set([
            rawSubj,
            cleanSubj,
            rawSubj.replace(/-/g, "_"),
            rawSubj.replace(/_/g, "-"),
            cleanSubj.replace(/-/g, "_"),
            cleanSubj.replace(/_/g, "-"),
          ])
        );

        if (cleanSubj === "recruitment" || cleanSubj === "recruitments") {
          aliases.push("recruitment", "recruitments");
        } else if (
          cleanSubj === "requisitions" ||
          cleanSubj === "requisition" ||
          cleanSubj === "job_requisitions" ||
          cleanSubj === "job_requisition" ||
          cleanSubj === "job-requisitions" ||
          cleanSubj === "job-requisition"
        ) {
          aliases.push("requisition", "requisitions", "job_requisitions", "job-requisitions", "job_requisition", "job-requisition");
        } else if (cleanSubj === "candidates" || cleanSubj === "candidate") {
          aliases.push("candidates", "candidate");
        } else if (
          cleanSubj === "interviews" ||
          cleanSubj === "interview" ||
          cleanSubj === "interview_scheduling" ||
          cleanSubj === "interview-scheduling" ||
          cleanSubj === "schedules" ||
          cleanSubj === "schedule"
        ) {
          aliases.push("interview", "interviews", "interview_scheduling", "interview-scheduling", "schedules", "schedule");
        } else if (
          cleanSubj === "offers" ||
          cleanSubj === "offer" ||
          cleanSubj === "offer_letters" ||
          cleanSubj === "offer_letter" ||
          cleanSubj === "offer-letters" ||
          cleanSubj === "offer-letter"
        ) {
          aliases.push("offer", "offers", "offer_letter", "offer_letters", "offer-letter", "offer-letters");
        } else if (
          cleanSubj === "employee" ||
          cleanSubj === "employees" ||
          cleanSubj === "employee_entry" ||
          cleanSubj === "employee-entry" ||
          cleanSubj === "employees_entry" ||
          cleanSubj === "employees-entry"
        ) {
          aliases.push(
            "employee",
            "employees",
            "employee_entry",
            "employee-entry",
            "employees_entry",
            "employees-entry"
          );
        } else if (cleanSubj === "onboarding" || cleanSubj === "onboardings") {
          aliases.push("onboarding", "onboardings");
        } else if (cleanSubj === "roles" || cleanSubj === "role" || cleanSubj === "permissions" || cleanSubj === "permission") {
          aliases.push("roles", "role", "permissions", "permission");
        } else if (cleanSubj === "exit" || cleanSubj === "exits" || cleanSubj === "exit_process" || cleanSubj === "exit-process") {
          aliases.push("exit", "exits", "exit_process", "exit-process");
        } else if (
          cleanSubj === "resignation" ||
          cleanSubj === "clearance" ||
          cleanSubj === "resignation_clearance" ||
          cleanSubj === "resignation-clearance"
        ) {
          aliases.push("resignation", "clearance", "resignation_clearance", "resignation-clearance");
        } else if (
          cleanSubj === "settlement" ||
          cleanSubj === "settlements" ||
          cleanSubj === "fnf_settlement" ||
          cleanSubj === "fnf-settlement" ||
          cleanSubj === "fnf"
        ) {
          aliases.push("settlement", "settlements", "fnf_settlement", "fnf-settlement", "fnf");
        } else if (
          cleanSubj === "letter" ||
          cleanSubj === "letters" ||
          cleanSubj === "relieving_letters" ||
          cleanSubj === "relieving-letters" ||
          cleanSubj === "relieving_letter" ||
          cleanSubj === "relieving-letter"
        ) {
          aliases.push("letter", "letters", "relieving_letter", "relieving-letter", "relieving_letters", "relieving-letters");
        } else if (
          cleanSubj === "salary_structures" ||
          cleanSubj === "salary-structures" ||
          cleanSubj === "salary_structure" ||
          cleanSubj === "salary-structure"
        ) {
          aliases.push("salary_structures", "salary-structures", "salary_structure", "salary-structure");
        } else if (
          cleanSubj === "hra_tax" ||
          cleanSubj === "hra-tax" ||
          cleanSubj === "hratax" ||
          cleanSubj === "tax"
        ) {
          aliases.push("hra_tax", "hra-tax", "hratax", "tax");
        } else if (
          cleanSubj === "loans" ||
          cleanSubj === "loan" ||
          cleanSubj === "advances" ||
          cleanSubj === "advance"
        ) {
          aliases.push("loans", "loan", "advances", "advance");
        } else if (
          cleanSubj === "monthly_run" ||
          cleanSubj === "monthly-run" ||
          cleanSubj === "payroll_run" ||
          cleanSubj === "payroll-run"
        ) {
          aliases.push("monthly_run", "monthly-run", "payroll_run", "payroll-run");
        } else if (
          cleanSubj === "payslips" ||
          cleanSubj === "payslip"
        ) {
          aliases.push("payslips", "payslip");
        } else if (
          cleanSubj === "reports" ||
          cleanSubj === "report" ||
          cleanSubj === "payroll_reports" ||
          cleanSubj === "payroll-reports"
        ) {
          aliases.push("reports", "report", "payroll_reports", "payroll-reports");
        }

        for (const act of actAliases) {
          for (const s of aliases) {
            if (
              ability.can(act, s) ||
              ability.can("manage", s)
            ) {
              return true;
            }
          }
        }

        if (Array.isArray(permissions)) {
          const directNames = [];
          for (const act of actAliases) {
            for (const s of aliases) {
              directNames.push(
                `${act}-${s}`,
                `${act}_${s}`,
                `${act}:${s}`,
                `${s}:${act}`,
                `${s}-${act}`
              );
            }
          }

          if (
            permissions.some((p) => {
              if (typeof p === "string") {
                const pName = p.toLowerCase().trim();
                return directNames.includes(pName);
              }
              const pName = (p?.name || "").toLowerCase().trim();
              const pMod = (p?.module || "").toLowerCase().trim();
              const pAct = (p?.action || "").toLowerCase().trim();
              return (
                directNames.includes(pName) ||
                (actAliases.includes(pAct) && aliases.includes(pMod))
              );
            })
          ) {
            return true;
          }
        }
        return false;
      }
      if (typeof action === "string") {
        const actLower = action.toLowerCase().trim();
        if (
          Array.isArray(permissions) &&
          permissions.some((p) => {
            const pName = typeof p === "string" ? p.toLowerCase().trim() : (p?.name || "").toLowerCase().trim();
            return pName === actLower;
          })
        ) {
          return true;
        }
        return ability.can("read", actLower) || ability.can("manage", actLower);
      }
      return false;
    },
    [ability, isSuperAdmin, permissions]
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

export function RouteGuard({ action = "read", subject, sidebarPermission, permissionKey, fallback, children }) {
  const { can, loading, isSuperAdmin } = usePermissions();
  const router = useRouter();
  const targetSubject = subject || permissionKey;

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-3 text-sm text-muted-foreground">Checking access permissions...</p>
      </div>
    );
  }

  const hasRead = !targetSubject || can(action, targetSubject);
  const hasSidebar = !targetSubject || can("sidebar", targetSubject);
  const isAllowed = isSuperAdmin || (hasRead && hasSidebar);

  if (!isAllowed) {
    if (fallback) return fallback;

    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          You do not have the required permission (<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{targetSubject}:{action}</code>) to access this page. Please contact your system administrator.
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
