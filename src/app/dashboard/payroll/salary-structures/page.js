"use client";
import SalaryStructuresTab from "@/features/payroll/components/SalaryStructuresTab";
import { RouteGuard } from "@/context/PermissionContext";

export default function Page() {
  return (
    <RouteGuard subject="salary_structures" action="read">
      <SalaryStructuresTab />
    </RouteGuard>
  );
}
