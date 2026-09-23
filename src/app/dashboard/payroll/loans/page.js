"use client";
import LoansTab from "@/features/payroll/components/LoansTab";
import { RouteGuard } from "@/context/PermissionContext";

export default function Page() {
  return (
    <RouteGuard subject="loans" action="read">
      <LoansTab />
    </RouteGuard>
  );
}
