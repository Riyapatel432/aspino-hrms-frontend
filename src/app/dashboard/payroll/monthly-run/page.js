"use client";
import MonthlyRunTab from "@/features/payroll/components/MonthlyRunTab";
import { RouteGuard } from "@/context/PermissionContext";

export default function Page() {
  return (
    <RouteGuard subject="monthly_run" action="read">
      <MonthlyRunTab />
    </RouteGuard>
  );
}
