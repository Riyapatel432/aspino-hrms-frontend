"use client";
import { Suspense } from "react";
import MonthlyRunTab from "@/features/payroll/components/MonthlyRunTab";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading monthly run...</div>}>
      <MonthlyRunTab />
    </Suspense>
  );
}

