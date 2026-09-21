"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AspinoLogo, AspinoIcon } from "@/components/aspino-logo";
import { usePermissions } from "@/context/PermissionContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Building2,
  CalendarOff,
  GraduationCap,
  Calendar,
  Briefcase,
  UserCheck,
  UserMinus,
  Clock,
  Award,
  History,
  Banknote,
  Calculator,
  ShieldCheck,
  RefreshCw,
  FileText,
  FileCheck,
  Landmark,
  ListChecks,
  KeyRound,
  Users,
} from "lucide-react";

const menuItems = [
  {
    group: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        sidebarPermission: "sidebar-dashboard",
      },
    ],
  },
  {
    group: "Administration",
    items: [
      {
        title: "Roles & Permissions",
        href: "/dashboard/roles",
        icon: KeyRound,
        subject: "roles",
        action: "read",
        sidebarPermission: "sidebar-roles",
      },
    ],
  },
  {
    group: "Masters",
    items: [
      {
        title: "Department Master",
        href: "/dashboard/departments",
        icon: Building2,
        subject: "department",
        action: "read",
        sidebarPermission: "sidebar-departments",
      },
      {
        title: "Financial Year Master",
        href: "/dashboard/financial-year",
        icon: Calendar,
        subject: "department",
        action: "read",
        sidebarPermission: "sidebar-financial-year",
      },
      {
        title: "Training Type",
        href: "/dashboard/training-type",
        icon: GraduationCap,
        subject: "training",
        action: "read",
        sidebarPermission: "sidebar-training-type",
      },
      {
        title: "Leave Master",
        href: "/dashboard/leave-master",
        icon: CalendarOff,
        subject: "leave",
        action: "read",
        sidebarPermission: "sidebar-leave-master",
      },
      {
        title: "Interview Round Master",
        href: "/dashboard/interview-rounds",
        icon: ListChecks,
        subject: "recruitment",
        action: "read",
        sidebarPermission: "sidebar-interview-rounds",
      },
    ],
  },
  {
    group: "Core HR",
    items: [
      {
        title: "Recruitment",
        href: "/dashboard/recruitment",
        icon: Briefcase,
        subject: "recruitment",
        action: "read",
        sidebarPermission: "sidebar-recruitment",
      },
      {
        title: "Onboarding",
        href: "/dashboard/onboarding",
        icon: UserCheck,
        subject: "onboarding",
        action: "read",
        sidebarPermission: "sidebar-onboarding",
      },
      {
        title: "Exit Process",
        href: "/dashboard/exit",
        icon: UserMinus,
        subject: "exit",
        action: "read",
        sidebarPermission: "sidebar-exit",
      },
    ],
  },
  {
    group: "Operations",
    items: [
      {
        title: "Attendance & Logs",
        href: "/dashboard/attendance-leave?tab=attendance",
        icon: Clock,
        subject: "attendance",
        action: "read",
        sidebarPermission: "sidebar-attendance-leave",
      },
      {
        title: "Apply Leave",
        href: "/dashboard/attendance-leave?tab=leaves",
        icon: FileCheck,
        subject: "leave",
        action: "read",
        sidebarPermission: "sidebar-attendance-leave",
      },
      {
        title: "Performance & Training",
        href: "/dashboard/performance-training",
        icon: Award,
        subject: "performance",
        action: "read",
        sidebarPermission: "sidebar-performance-training",
      },
    ],
  },
  {
    group: "Payroll Modules",
    items: [
      {
        title: "Salary Structures",
        href: "/dashboard/payroll/salary-structures",
        icon: Calculator,
        subject: "payroll",
        action: "read",
        sidebarPermission: "sidebar-salary-structures",
      },
      {
        title: "HRA & Tax Exemption",
        href: "/dashboard/payroll/hra-tax",
        icon: ShieldCheck,
        subject: "payroll",
        action: "read",
        sidebarPermission: "sidebar-hra-tax",
      },
      {
        title: "Loans & Advances",
        href: "/dashboard/payroll/loans",
        icon: Landmark,
        subject: "payroll",
        action: "read",
        sidebarPermission: "sidebar-loans",
      },
      {
        title: "Monthly Payroll Run",
        href: "/dashboard/payroll/monthly-run",
        icon: RefreshCw,
        subject: "payroll",
        action: "read",
        sidebarPermission: "sidebar-monthly-run",
      },
      {
        title: "Payslips & Self-Service",
        href: "/dashboard/payroll/payslips",
        icon: FileText,
        subject: "payroll",
        action: "read",
        sidebarPermission: "sidebar-payslips",
      },
      {
        title: "Reports & Form 16",
        href: "/dashboard/payroll/reports",
        icon: FileCheck,
        subject: "payroll",
        action: "read",
        sidebarPermission: "sidebar-reports",
      },
    ],
  },
  {
    group: "Logs",
    items: [
      {
        title: "Activity Logs",
        href: "/dashboard/activity-logs",
        icon: History,
        subject: "audit",
        action: "read",
        sidebarPermission: "sidebar-activity-logs",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;
  const { can, isSuperAdmin } = usePermissions();

  // Filter menu items based on CASL ability and sidebar permissions
  const filteredMenuItems = menuItems
    .map((group) => {
      const visibleItems = group.items.filter((item) => {
        if (isSuperAdmin) return true;

        if (item.sidebarPermission) {
          const mod = item.sidebarPermission.replace(/^sidebar-/, "");
          if (
            can("sidebar", mod) ||
            can("read", item.sidebarPermission) ||
            can("sidebar", item.sidebarPermission) ||
            can("view", item.sidebarPermission)
          ) {
            return true;
          }
        }
        if (!item.subject) return true;
        return can(item.action || "read", item.subject);
      });
      return { ...group, items: visibleItems };
    })
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar collapsible="icon" className="border-r print:hidden">
      <SidebarHeader className="border-b px-3 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-3 flex items-center justify-center">
        <Link
          href={`/dashboard`}
          className="flex items-center justify-center gap-2.5 w-full overflow-hidden transition-all"
        >
          <AspinoIcon size={32} className="shrink-0 group-data-[collapsible=icon]:size-7" />

          <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-aspino-primary to-aspino-secondary bg-clip-text text-transparent leading-none">
              ASPINO
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-tight leading-tight mt-1 truncate">
              HRMS System
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
        {filteredMenuItems.map((group) => (
          <SidebarGroup key={group.group} className="px-0 py-1 group-data-[collapsible=icon]:py-1">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 px-3 py-1 mb-0.5 group-data-[collapsible=icon]:hidden">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1">
                {group.items.map((item) => {
                  let isActive = false;
                  if (pathname === "/dashboard/attendance-leave") {
                    if (item.href.includes("tab=leaves")) {
                      isActive = currentTab === "leaves";
                    } else if (item.href.includes("tab=attendance")) {
                      isActive = !currentTab || currentTab === "attendance";
                    } else {
                      isActive = false;
                    }
                  } else {
                    isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                  }
                  return (
                    <SidebarMenuItem key={item.href} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={`h-9.5 rounded-xl transition-all duration-200 px-3 group-data-[collapsible=icon]:size-9! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center ${
                          isActive
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <Link href={item.href} className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                          <item.icon className="h-[19px] w-[19px] shrink-0" />
                          <span className="font-semibold text-xs truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badge === "New" ? "default" : "secondary"}
                              className="ml-auto text-[10px] h-5 px-1.5 group-data-[collapsible=icon]:hidden"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t px-3 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
        <div className="flex items-center gap-2.5 text-xs text-slate-500 group-data-[collapsible=icon]:justify-center">
          <Building2 className="h-[19px] w-[19px] shrink-0 text-sky-500" />
          <span className="font-semibold truncate group-data-[collapsible=icon]:hidden">
            Aspino HRMS
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

