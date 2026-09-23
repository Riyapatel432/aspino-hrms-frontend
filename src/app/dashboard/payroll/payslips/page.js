"use client";
import PayslipsTab from "@/features/payroll/components/PayslipsTab";
import { RouteGuard } from "@/context/PermissionContext";

export default function Page() {
  return (
    <RouteGuard subject="payslips" action="read">
      <PayslipsTab />
    </RouteGuard>
  );
}
