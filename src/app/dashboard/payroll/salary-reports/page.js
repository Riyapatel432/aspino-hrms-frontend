"use client";

import SalaryReportsPage from "@/features/payroll/components/SalaryReportsPage";
import { RouteGuard } from "@/context/PermissionContext";

export default function Page() {
  return (
    <RouteGuard subject="reports" action="read">
      <SalaryReportsPage />
    </RouteGuard>
  );
}
