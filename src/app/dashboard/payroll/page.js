import { redirect } from "next/navigation";

export default function PayrollRoot() {
  redirect("/dashboard/payroll/salary-structures");
}
