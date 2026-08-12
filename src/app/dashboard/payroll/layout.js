import { Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PayrollLayout({ children }) {
  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 space-y-6 relative z-0 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {children}
    </div>
  );
}
