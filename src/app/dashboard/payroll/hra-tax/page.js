"use client";
import HraTaxTab from "@/features/payroll/components/HraTaxTab";
import { RouteGuard } from "@/context/PermissionContext";

export default function Page() {
  return (
    <RouteGuard subject="hra_tax" action="read">
      <HraTaxTab />
    </RouteGuard>
  );
}
