import { createMongoAbility, AbilityBuilder } from "@casl/ability";

/**
 * Builds a CASL Ability from the flat permission list returned by /auth/permissions.
 *
 * Convention: permission.action + permission.module → one CASL rule.
 * No alias expansion. Matching is done exactly on module + action.
 *
 * Super admin: role name "SUPER_ADMIN" or permission { module:"all", action:"manage" }
 */
export function buildAbilityFor(permissions = [], user = null) {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  if (!Array.isArray(permissions)) return build();

  // Blanket super admin bypass removed: access is governed strictly by DB permissions.

  for (const perm of permissions) {
    if (!perm) continue;
    const action = (perm.action || "").toLowerCase().trim();
    const subject = (perm.module || "").toLowerCase().trim();
    if (action && subject) {
      can(action, subject);
    }
  }

  return build();
}

function extractRoleName(user) {
  if (!user) return "";
  const raw =
    user?.roleRelation?.name ||
    user?.role?.name ||
    (typeof user?.role === "string" ? user.role : "") ||
    "";
  return typeof raw === "string" ? raw : String(raw);
}
