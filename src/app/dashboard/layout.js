import { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Aspino HRMS Dashboard",
  description: "Enterprise-grade HR management system.",
};

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <Suspense fallback={null}>
        <AppSidebar />
      </Suspense>
      <SidebarInset className="flex flex-col min-h-screen min-w-0 flex-1 bg-background overflow-x-hidden">
        <div className="print:hidden">
          <Navbar />
        </div>
        <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto bg-muted/20 print:p-0 print:m-0 print:w-full print:bg-white print:overflow-visible">
          <div className="w-full h-full space-y-6 print:space-y-0 print:w-full print:p-0 print:m-0">
            {children}
          </div>
        </div>
        <Footer />
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}

