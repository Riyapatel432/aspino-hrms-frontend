import { createMongoAbility, AbilityBuilder } from "@casl/ability";

/**
 * Builds a CASL Ability object for the current user.
 *
 * Super Admin detection rules (must match backend):
 *   - user's role name is "SUPER_ADMIN" (case-insensitive)
 *   - OR a permission with module="all" and action="manage" exists
 *
 * Everyone else gets only their explicitly assigned DB permissions.
 * Role name strings like "ADMIN", "USER", "HR" do NOT grant blanket access.
 */
export function buildAbilityFor(permissions = [], user = null) {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (!permissions || !Array.isArray(permissions)) {
    return build();
  }

  const roleName = extractRoleName(user).toUpperCase();

  // Super Admin bypass: ONLY for SUPER_ADMIN role or explicit all:manage permission
  const hasFullAccess =
    roleName === "SUPER_ADMIN" ||
    (Array.isArray(permissions) &&
      permissions.some((p) => {
        if (typeof p === "object" && p !== null) {
          return p.module === "all" && p.action === "manage";
        }
        return false;
      }));

  if (hasFullAccess) {
    can("manage", "all");
    return build();
  }

  // Register all explicitly assigned DB permissions
  permissions.forEach((perm) => {
    if (!perm) return;

    if (typeof perm === "object") {
      const rawAction = (perm.action || "").trim().toLowerCase();
      const rawModule = (perm.module || "").trim().toLowerCase();
      const rawName = (perm.name || "").trim().toLowerCase();

      // Collect all subjects this permission applies to
      const subjects = new Set();
      if (rawModule) subjects.add(rawModule);

      // Parse name like "read-training-type", "create-financial-year", "sidebar-interview-rounds"
      let nameAction = rawAction;
      if (rawName.includes("-")) {
        const parts = rawName.split("-");
        nameAction = parts[0];
        const parsedSubject = parts.slice(1).join("-");
        if (parsedSubject) subjects.add(parsedSubject);
      } else if (rawName.includes(":")) {
        const parts = rawName.split(":");
        nameAction = parts[0];
        const parsedSubject = parts.slice(1).join(":");
        if (parsedSubject) subjects.add(parsedSubject);
      } else if (rawName.includes("_")) {
        const parts = rawName.split("_");
        nameAction = parts[0];
        const parsedSubject = parts.slice(1).join("_");
        if (parsedSubject) subjects.add(parsedSubject);
      }

      const allActions = new Set([rawAction, nameAction].filter(Boolean));

      // For every subject in subjects, generate aliases
      const expandedSubjects = new Set();
      subjects.forEach((subj) => {
        expandedSubjects.add(subj);
        expandedSubjects.add(subj.replace(/_/g, "-"));
        expandedSubjects.add(subj.replace(/-/g, "_"));
        const sing = subj.endsWith("s") ? subj.slice(0, -1) : subj;
        const plur = subj.endsWith("s") ? subj : `${subj}s`;
        expandedSubjects.add(sing);
        expandedSubjects.add(plur);

        // Specific aliases
        if (
          subj === "training" ||
          subj === "training-type" ||
          subj === "training_type" ||
          subj === "trainings" ||
          subj === "training-types" ||
          subj === "training_types"
        ) {
          expandedSubjects.add("training");
          expandedSubjects.add("training-type");
          expandedSubjects.add("training_type");
          expandedSubjects.add("training-types");
          expandedSubjects.add("training_types");
          expandedSubjects.add("trainings");
        }
        if (
          subj === "financial_year" ||
          subj === "financial-year" ||
          subj === "financialyear"
        ) {
          expandedSubjects.add("financial_year");
          expandedSubjects.add("financial-year");
          expandedSubjects.add("financialyear");
        }
        if (
          subj === "interview_rounds" ||
          subj === "interview-rounds" ||
          subj === "interview_round" ||
          subj === "interview-round"
        ) {
          expandedSubjects.add("interview_rounds");
          expandedSubjects.add("interview-rounds");
          expandedSubjects.add("interview_round");
          expandedSubjects.add("interview-round");
        }
        if (
          subj === "leave_master" ||
          subj === "leave-master" ||
          subj === "leave_masters" ||
          subj === "leave-masters"
        ) {
          expandedSubjects.add("leave_master");
          expandedSubjects.add("leave-master");
          expandedSubjects.add("leave_masters");
          expandedSubjects.add("leave-masters");
        }
        if (subj === "department" || subj === "departments") {
          expandedSubjects.add("department");
          expandedSubjects.add("departments");
        }
        if (
          subj === "recruitment" ||
          subj === "recruitments"
        ) {
          expandedSubjects.add("recruitment");
          expandedSubjects.add("recruitments");
        }
        if (
          subj === "requisitions" ||
          subj === "requisition" ||
          subj === "job_requisitions" ||
          subj === "job_requisition" ||
          subj === "job-requisitions" ||
          subj === "job-requisition"
        ) {
          expandedSubjects.add("requisition");
          expandedSubjects.add("requisitions");
          expandedSubjects.add("job_requisition");
          expandedSubjects.add("job_requisitions");
          expandedSubjects.add("job-requisition");
          expandedSubjects.add("job-requisitions");
        }
        if (
          subj === "candidates" ||
          subj === "candidate"
        ) {
          expandedSubjects.add("candidate");
          expandedSubjects.add("candidates");
        }
        if (
          subj === "interviews" ||
          subj === "interview" ||
          subj === "interview_scheduling" ||
          subj === "interview-scheduling" ||
          subj === "schedules" ||
          subj === "schedule"
        ) {
          expandedSubjects.add("interview");
          expandedSubjects.add("interviews");
          expandedSubjects.add("interview_scheduling");
          expandedSubjects.add("interview-scheduling");
          expandedSubjects.add("schedule");
          expandedSubjects.add("schedules");
        }
        if (
          subj === "offers" ||
          subj === "offer" ||
          subj === "offer_letters" ||
          subj === "offer_letter" ||
          subj === "offer-letters" ||
          subj === "offer-letter"
        ) {
          expandedSubjects.add("offer");
          expandedSubjects.add("offers");
          expandedSubjects.add("offer_letter");
          expandedSubjects.add("offer_letters");
          expandedSubjects.add("offer-letter");
          expandedSubjects.add("offer-letters");
        }
        if (subj === "onboarding" || subj === "onboardings") {
          expandedSubjects.add("onboarding");
          expandedSubjects.add("onboardings");
        }
        if (subj === "exit" || subj === "exits" || subj === "exit_process" || subj === "exit-process") {
          expandedSubjects.add("exit");
          expandedSubjects.add("exits");
          expandedSubjects.add("exit_process");
          expandedSubjects.add("exit-process");
        }
        if (
          subj === "resignation" ||
          subj === "clearance" ||
          subj === "resignation_clearance" ||
          subj === "resignation-clearance"
        ) {
          expandedSubjects.add("resignation");
          expandedSubjects.add("clearance");
          expandedSubjects.add("resignation_clearance");
          expandedSubjects.add("resignation-clearance");
        }
        if (
          subj === "settlement" ||
          subj === "settlements" ||
          subj === "fnf_settlement" ||
          subj === "fnf-settlement" ||
          subj === "fnf"
        ) {
          expandedSubjects.add("settlement");
          expandedSubjects.add("settlements");
          expandedSubjects.add("fnf_settlement");
          expandedSubjects.add("fnf-settlement");
          expandedSubjects.add("fnf");
        }
        if (
          subj === "letter" ||
          subj === "letters" ||
          subj === "relieving_letters" ||
          subj === "relieving-letters" ||
          subj === "relieving_letter" ||
          subj === "relieving-letter"
        ) {
          expandedSubjects.add("letter");
          expandedSubjects.add("letters");
          expandedSubjects.add("relieving_letter");
          expandedSubjects.add("relieving-letter");
          expandedSubjects.add("relieving_letters");
          expandedSubjects.add("relieving-letters");
        }
        if (
          subj === "salary_structures" ||
          subj === "salary-structures" ||
          subj === "salary_structure" ||
          subj === "salary-structure"
        ) {
          expandedSubjects.add("salary_structures");
          expandedSubjects.add("salary-structures");
          expandedSubjects.add("salary_structure");
          expandedSubjects.add("salary-structure");
        }
        if (
          subj === "hra_tax" ||
          subj === "hra-tax" ||
          subj === "hratax" ||
          subj === "tax"
        ) {
          expandedSubjects.add("hra_tax");
          expandedSubjects.add("hra-tax");
          expandedSubjects.add("hratax");
          expandedSubjects.add("tax");
        }
        if (
          subj === "loans" ||
          subj === "loan" ||
          subj === "advances" ||
          subj === "advance"
        ) {
          expandedSubjects.add("loans");
          expandedSubjects.add("loan");
          expandedSubjects.add("advances");
          expandedSubjects.add("advance");
        }
        if (
          subj === "monthly_run" ||
          subj === "monthly-run" ||
          subj === "payroll_run" ||
          subj === "payroll-run"
        ) {
          expandedSubjects.add("monthly_run");
          expandedSubjects.add("monthly-run");
          expandedSubjects.add("payroll_run");
          expandedSubjects.add("payroll-run");
        }
        if (
          subj === "payslips" ||
          subj === "payslip"
        ) {
          expandedSubjects.add("payslips");
          expandedSubjects.add("payslip");
        }
        if (
          subj === "reports" ||
          subj === "report" ||
          subj === "payroll_reports" ||
          subj === "payroll-reports"
        ) {
          expandedSubjects.add("reports");
          expandedSubjects.add("report");
          expandedSubjects.add("payroll_reports");
          expandedSubjects.add("payroll-reports");
        }
      });

      allActions.forEach((act) => {
        expandedSubjects.forEach((sub) => {
          can(act, sub);
        });
      });

      if (rawName) {
        can(rawName, "all");
        expandedSubjects.forEach((sub) => {
          can(rawName, sub);
        });
      }
    }
  });

  return build();
}

/**
 * Extracts the role name string from various shapes of user/role data.
 */
function extractRoleName(user) {
  if (!user) return "";
  const raw =
    user?.roleRelation?.name ||
    user?.role?.name ||
    (typeof user?.role === "string" ? user.role : "") ||
    "";
  return typeof raw === "string" ? raw : String(raw);
}
