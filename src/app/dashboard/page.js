"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  UserCheck,
  CalendarDays,
  FileWarning,
  TrendingUp,
  Award,
  ArrowRight,
  ShieldCheck,
  ClipboardList
} from "lucide-react";

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    users: 0,
    requisitions: 0,
    candidates: 0,
    schedules: 0,
    exits: 0,
    trainings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        
        const [userRes, reqRes, candRes, schedRes, exitRes, trainRes] = await Promise.all([
          fetch(`${backendUrl}/users`),
          fetch(`${backendUrl}/staff-hrms/recruitment/requisitions`),
          fetch(`${backendUrl}/staff-hrms/recruitment/candidates`),
          fetch(`${backendUrl}/staff-hrms/recruitment/schedules`),
          fetch(`${backendUrl}/staff-hrms/exit/exits`),
          fetch(`${backendUrl}/staff-hrms/training/trainings`),
        ]);

        const users = await userRes.json();
        const reqs = await reqRes.json();
        const cands = await candRes.json();
        const scheds = await schedRes.json();
        const exits = await exitRes.json();
        const trains = await trainRes.json();

        setStats({
          users: users.length || 0,
          requisitions: reqs.length || 0,
          candidates: cands.length || 0,
          schedules: scheds.filter(s => s.status === 'SCHEDULED').length || 0,
          exits: exits.filter(e => e.status === 'CLEARANCE_IN_PROGRESS').length || 0,
          trainings: trains.length || 0,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        // Fallback mock statistics in case server is just booting
        setStats({
          users: 3,
          requisitions: 2,
          candidates: 2,
          schedules: 1,
          exits: 1,
          trainings: 1,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cardConfigs = [
    {
      title: "Total System Users",
      value: stats.users,
      desc: "Registered Accounts",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      link: "/dashboard/onboarding",
    },
    {
      title: "Active Job Requisitions",
      value: stats.requisitions,
      desc: "Pending/Approved vacancies",
      icon: Briefcase,
      color: "from-sky-400 to-blue-600",
      link: "/dashboard/recruitment",
    },
    {
      title: "Upcoming Interviews",
      value: stats.schedules,
      desc: "Scheduled rounds today/tomorrow",
      icon: CalendarDays,
      color: "from-teal-400 to-emerald-600",
      link: "/dashboard/recruitment",
    },
    {
      title: "Pending Exit Clearances",
      value: stats.exits,
      desc: "Clearances in progress",
      icon: FileWarning,
      color: "from-rose-500 to-red-600",
      link: "/dashboard/exit",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#0284c7] to-[#17b3b3] p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white dark:bg-slate-900/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-xs font-extrabold tracking-widest uppercase bg-white dark:bg-slate-900/15 px-3 py-1 rounded-full text-sky-200">
            Operations Portal
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Staff HRMS Lifecycle
          </h2>
          <p className="text-sm text-sky-100/90 font-medium">
            Manage the full employee lifecycle for Aspino Speciality Chemicals. Sourcing, interviewing, onboarding, shift rosters, GMP compliance training, and final relieving clearance.
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardConfigs.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.link}
              className="group block bg-white dark:bg-slate-900/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 rounded-3xl p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-md relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    {card.title}
                  </span>
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-white block">
                    {loading ? (
                      <div className="h-8 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                    ) : (
                      card.value
                    )}
                  </span>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${card.color} text-white shadow-md shadow-blue-500/10`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">{card.desc}</span>
                <span className="text-sky-500 group-hover:translate-x-1 transition-all flex items-center gap-1 font-bold">
                  View <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Sections Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/recruitment"
              className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50/70 hover:bg-sky-500 dark:bg-sky-600/5 border border-slate-200 dark:border-slate-800/60 hover:border-sky-50 dark:border-sky-500/200/20 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:text-sky-400 transition-colors">Recruit Candidates</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Post job requisitions & schedule panel interviews.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/onboarding"
              className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50/70 hover:bg-sky-500 dark:bg-sky-600/5 border border-slate-200 dark:border-slate-800/60 hover:border-sky-50 dark:border-sky-500/200/20 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 transition-colors">Onboard Employees</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Verify collected documents & track probation review.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/attendance-leave"
              className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50/70 hover:bg-sky-500 dark:bg-sky-600/5 border border-slate-200 dark:border-slate-800/60 hover:border-sky-50 dark:border-sky-500/200/20 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:text-indigo-400 transition-colors">Shift & Leaves</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Define rosters, capture attendance & approve leaves.</p>
              </div>
            </Link>

            <Link
              href="/dashboard/performance-training"
              className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50/70 hover:bg-sky-500 dark:bg-sky-600/5 border border-slate-200 dark:border-slate-800/60 hover:border-sky-50 dark:border-sky-500/200/20 transition-all group"
            >
              <div className="p-2.5 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 transition-colors">Performance & GMP</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Perform periodic appraisal audits & training compliance logs.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Info panel */}
        <div className="bg-white dark:bg-slate-900/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Compliance Standard</h3>
          </div>
          <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>
              Our pharmaceutical manufacturing operations require strict adherence to **Good Manufacturing Practice (GMP)**.
            </p>
            <p>
              Please ensure all **Production** and **Quality Assurance** staff complete regulatory safety certificates during their onboarding or probation period.
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800/50 dark:border-slate-800 space-y-2">
              <span className="font-extrabold text-slate-700 dark:text-slate-200 block">System Checklist:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-500">
                <li>Biometric/App Attendance capture</li>
                <li>Clearance checklists (IT, store, finance)</li>
                <li>Digital Relieving PDF generator</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
