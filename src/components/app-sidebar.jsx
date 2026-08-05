"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AspinoLogo, AspinoIcon } from "@/components/aspino-logo";
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
  Briefcase,
  UserCheck,
  UserMinus,
  Clock,
  Award,
  History,
} from "lucide-react";

const menuItems = [
  {
    group: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
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
      },
      {
        title: "Leave Master",
        href: "/dashboard/leave-master",
        icon: CalendarOff,
      },
      {
        title: "Training Type",
        href: "/dashboard/training-type",
        icon: GraduationCap,
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
      },
      {
        title: "Onboarding",
        href: "/dashboard/onboarding",
        icon: UserCheck,
      },
      {
        title: "Exit Process",
        href: "/dashboard/exit",
        icon: UserMinus,
      },
    ],
  },
  {
    group: "Operations",
    items: [
      {
        title: "Attendance & Leave",
        href: "/dashboard/attendance-leave",
        icon: Clock,
      },
      {
        title: "Performance & Training",
        href: "/dashboard/performance-training",
        icon: Award,
      },
      {
        title: "Activity Logs",
        href: "/dashboard/activity-logs",
        icon: History,
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

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
        {menuItems.map((group) => (
          <SidebarGroup key={group.group} className="px-0 py-1 group-data-[collapsible=icon]:py-1">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 dark:text-slate-500 px-3 py-1 mb-0.5 group-data-[collapsible=icon]:hidden">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
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
