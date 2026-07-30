import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";

export const metadata = {
  title: "Aspino HRMS Dashboard",
  description: "Enterprise-grade HR management system.",
};

export default function DashboardLayout({ children }) {
  // Since Redux is managing the user state globally, we can just pass an empty object or rely on Redux inside Navbar
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col w-full min-h-screen relative overflow-hidden bg-background">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
          <div className="w-full h-full space-y-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  );
}
