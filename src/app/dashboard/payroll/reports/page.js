"use client";
import ReportsTab from "@/features/payroll/components/ReportsTab";
import { RouteGuard } from "@/context/PermissionContext";

export default function Page() {
  return (
    <RouteGuard subject="reports" action="read">
      <ReportsTab />
    </RouteGuard>
  );
}
