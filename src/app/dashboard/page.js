"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  UserCheck,
  CalendarDays,
  FileWarning,
  Award,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { API_URL, apiFetch } from "@/lib/api";

// ---------------------------------------------------------------------------
// Status constants — avoid magic strings scattered across the codebase
// ---------------------------------------------------------------------------
const STATUS = {
  SCHEDULED: "SCHEDULED",
  CLEARANCE_IN_PROGRESS: "CLEARANCE_IN_PROGRESS",
};

/**
 * Default stats structure representing the initial/loading state.
 * All counts start at zero until data is fetched from the API.
 */
const INITIAL_STATS = {
  users: 0,
  requisitions: 0,
  candidates: 0,
  schedules: 0,
  exits: 0,
  trainings: 0,
};

// ---------------------------------------------------------------------------
// Helper: safely resolve a numeric count from an API response payload.
// Handles both array responses and paginated { data, meta } envelopes.
// ---------------------------------------------------------------------------
async function resolveCount(res, filterFn) {
  if (!res.ok) return 0;
  const body = await res.json();
  const list = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
  return filterFn ? list.filter(filterFn).length : list.length;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DashboardOverview() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;

    /**
     * Fetch each stat endpoint independently so that a single service outage
     * does not zero-out the entire dashboard. Failed requests resolve to 0.
     *
     * 21 CFR Part 11 §11.10(e): a portal-entry audit event can be dispatched
     * at the bottom of this function once an audit logging endpoint is available.
     */
    async function fetchStats() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const [userRes, reqRes, candRes, schedRes, exitRes, trainRes] = await Promise.allSettled([
          apiFetch(`${API_URL}/users`),
          apiFetch(`${API_URL}/staff-hrms/recruitment/requisitions`),
          apiFetch(`${API_URL}/staff-hrms/recruitment/candidates`),
          apiFetch(`${API_URL}/staff-hrms/recruitment/schedules`),
          apiFetch(`${API_URL}/staff-hrms/exit/exits`),
          apiFetch(`${API_URL}/staff-hrms/training/trainings`),
        ]);

        const safeResolve = async (settled, filterFn) => {
          if (settled.status === "rejected" || !settled.value) return 0;
          return resolveCount(settled.value, filterFn);
        };

        const [users, requisitions, candidates, schedules, exits, trainings] = await Promise.all([
          safeResolve(userRes),
          safeResolve(reqRes),
          safeResolve(candRes),
          safeResolve(schedRes, (s) => s.status === STATUS.SCHEDULED),
          safeResolve(exitRes, (e) => e.status === STATUS.CLEARANCE_IN_PROGRESS),
          safeResolve(trainRes),
        ]);

        if (!cancelled) {
          setStats({ users, requisitions, candidates, schedules, exits, trainings });

          const anyFailed = [userRes, reqRes, candRes, schedRes, exitRes, trainRes].some(
            (r) => r.status === "rejected" || !r.value?.ok
          );
          if (anyFailed) {
            setErrorMsg("One or more services are unavailable. Some statistics may be incomplete.");
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching dashboard stats:", err);
        if (!cancelled) setErrorMsg("Unable to retrieve live statistics. Please refresh the page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    // TODO (21 CFR Part 11 §11.10(e)): dispatch portal entry audit event here
    // e.g. apiFetch(`${API_URL}/audit/log`, { method: 'POST', body: JSON.stringify({ action: 'DASHBOARD_VIEW' }) });

    return () => { cancelled = true; };
  }, []);


  // ---------------------------------------------------------------------------
  // Card configuration — defined inside component so it references live stats
  // ---------------------------------------------------------------------------
  const cardConfigs = [
    {
      title: "Total System Users",
      value: stats.users,
      desc: "Registered Accounts",
      icon: Users,
      color: "from-blue-500 to-indigo-600",
      link: "/dashboard/onboarding",
      ariaLabel: "View registered users onboarding details",
    },
    {
      title: "Active Job Requisitions",
      value: stats.requisitions,
      desc: "Vacancy Tracking",
      icon: Briefcase,
      color: "from-sky-400 to-blue-600",
      link: "/dashboard/recruitment",
      ariaLabel: "View recruitment job requisitions",
    },
    {
      title: "Upcoming Interviews",
      value: stats.schedules,
      desc: "Scheduled Interviews",
      icon: CalendarDays,
      color: "from-teal-400 to-emerald-600",
      link: "/dashboard/recruitment",
      ariaLabel: "View scheduled interview rounds",
    },
    {
      title: "Pending Exit Clearances",
      value: stats.exits,
      desc: "Clearances in Progress",
      icon: FileWarning,
      color: "from-rose-500 to-red-600",
      link: "/dashboard/exit",
      ariaLabel: "View employee exit clearance workflow",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* System Warning / Partial Outage Notification */}
      {errorMsg && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-semibold shadow-sm"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <section
        className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#0284c7] to-[#17b3b3] p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10"
        aria-label="HRMS portal welcome banner"
      >
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-xs font-extrabold tracking-widest uppercase bg-white/15 px-3 py-1 rounded-full text-sky-200">
            Operations Portal
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Staff HRMS Lifecycle
          </h1>
          <p className="text-sm text-sky-100/90 font-medium">
            Manage the full employee lifecycle for Aspino Speciality Chemicals. Sourcing, interviewing, onboarding, shift rosters, GMP compliance training, and final relieving clearance.
          </p>
        </div>
      </section>

      {/* KPI Stat Cards */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardConfigs.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.link + card.title}
              href={card.link}
              aria-label={card.ariaLabel}
              className="group block bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-md relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    {card.title}
                  </h2>
                  <span className="text-3xl font-extrabold text-slate-800 dark:text-white block">
                    {loading ? (
                      <div
                        className="h-8 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg"
                        aria-label="Loading statistic"
                      />
                    ) : (
                      card.value
                    )}
                  </span>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-tr ${card.color} text-white shadow-md shadow-blue-500/10`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">{card.desc}</span>
                <span className="text-sky-500 group-hover:translate-x-1 transition-all flex items-center gap-1 font-bold">
                  View <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <section
          aria-label="Quick Actions"
          className="lg:col-span-2 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-500" aria-hidden="true" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                href: "/dashboard/recruitment",
                icon: Briefcase,
                color: "bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400",
                hoverColor: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
                title: "Recruit Candidates",
                desc: "Post job vacancies & schedule panel interviews.",
              },
              {
                href: "/dashboard/onboarding",
                icon: UserCheck,
                color: "bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400",
                hoverColor: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
                title: "Onboard Employees",
                desc: "Verify collected documents & track probation review.",
              },
              {
                href: "/dashboard/attendance-leave",
                icon: CalendarDays,
                color: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                hoverColor: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
                title: "Shift & Leaves",
                desc: "Define rosters, capture attendance & approve leaves.",
              },
              {
                href: "/dashboard/performance-training",
                icon: Award,
                color: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
                hoverColor: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
                title: "Performance & GMP",
                desc: "Perform periodic appraisal audits & training compliance logs.",
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href + action.title}
                  href={action.href}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/60 transition-all group focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <div className={`p-2.5 rounded-xl ${action.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold text-slate-800 dark:text-slate-200 ${action.hoverColor} transition-colors`}>
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Compliance Info Panel */}
        <section
          aria-label="GMP Compliance Information"
          className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" aria-hidden="true" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Compliance Standard</h3>
          </div>
          <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>
              Our pharmaceutical manufacturing operations require strict adherence to{" "}
              <strong>Good Manufacturing Practice (GMP)</strong>.
            </p>
            <p>
              Please ensure all <strong>Production</strong> and{" "}
              <strong>Quality Assurance</strong> staff complete regulatory safety
              certificates during their onboarding or probation period.
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800/50 space-y-2">
              <span className="font-extrabold text-slate-700 dark:text-slate-200 block">System Checklist:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-500" aria-label="GMP compliance checklist">
                <li>Biometric/App Attendance capture</li>
                <li>Clearance checklists (IT, store, finance)</li>
                <li>Digital Relieving PDF generator</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
