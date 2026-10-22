import { sqlite } from "../db/index.ts";
import { extractSessionFromRequest } from "./sessionToken.ts";

export type OperatorRole = "SUPER_ADMIN" | "ADMIN" | "LEAD_ANALYST" | "ANALYST" | "DEMO_ANALYST";

export const ROLE_PERMISSIONS = {
  VIEW_FINANCIAL_DATA: ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST", "ANALYST", "DEMO_ANALYST"] as OperatorRole[],
  INGEST_COMPANY: ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST"] as OperatorRole[],
  REFRESH_DATA: ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST", "ANALYST"] as OperatorRole[],
  RUN_SIMULATIONS: ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST", "ANALYST", "DEMO_ANALYST"] as OperatorRole[],
  EXPORT_REPORTS: ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST", "ANALYST"] as OperatorRole[],
  MANAGE_USERS: ["SUPER_ADMIN", "ADMIN"] as OperatorRole[],
  CHANGE_RISK_SETTINGS: ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST"] as OperatorRole[],
  CONFIGURE_PROVIDERS: ["SUPER_ADMIN"] as OperatorRole[],
  VIEW_AUDIT_LOGS: ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST"] as OperatorRole[],
  EXECUTE_SYSTEM_JOBS: ["SUPER_ADMIN", "ADMIN"] as OperatorRole[],
} as const;

export type SystemPermission = keyof typeof ROLE_PERMISSIONS;

export interface ClearanceCheckResult {
  allowed: boolean;
  operator: string;
  role: OperatorRole;
  isDemo: boolean;
  userId?: string;
  userEmail?: string;
  error?: string;
}

/**
 * Extracts session credentials from Request cookies or headers and validates permissions.
 */
export function verifyOperatorClearance(
  request: Request,
  requiredRoles: OperatorRole[] = ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST", "ANALYST", "DEMO_ANALYST"]
): ClearanceCheckResult {
  try {
    // 1. Primary: Verify signed, stateless session token from cookie/headers
    const signedSession = extractSessionFromRequest(request);
    if (signedSession) {
      if (signedSession.isDemo) {
        const isAllowed = requiredRoles.includes("DEMO_ANALYST");
        return {
          allowed: isAllowed,
          operator: signedSession.name || "Demo Analyst",
          role: "DEMO_ANALYST",
          isDemo: true,
          userId: signedSession.id,
          userEmail: signedSession.email,
          error: isAllowed ? undefined : "Access Denied: Guest demo sessions operate in sandbox mode and cannot modify production records.",
        };
      }

      // If user row exists in SQLite, ensure they are not deactivated
      if (signedSession.email) {
        try {
          const userRow = sqlite
            .prepare("SELECT id, name, role, status FROM users WHERE email = ?")
            .get(signedSession.email.toLowerCase()) as { id: string; name: string; role: string; status: string } | undefined;

          if (userRow && userRow.status === "DEACTIVATED") {
            return {
              allowed: false,
              operator: signedSession.name,
              role: signedSession.role,
              isDemo: false,
              userId: signedSession.id,
              userEmail: signedSession.email,
              error: "Access Denied: This operator account has been deactivated by a System Administrator.",
            };
          }
        } catch {
          // If DB check fails, rely on signed token
        }
      }

      const isAllowed = requiredRoles.includes(signedSession.role);
      if (!isAllowed) {
        return {
          allowed: false,
          operator: signedSession.name,
          role: signedSession.role,
          isDemo: false,
          userId: signedSession.id,
          userEmail: signedSession.email,
          error: `Access Denied: Your assigned role (${signedSession.role}) does not have permission to execute this administrative operation.`,
        };
      }

      return {
        allowed: true,
        operator: signedSession.name,
        role: signedSession.role,
        isDemo: false,
        userId: signedSession.id,
        userEmail: signedSession.email,
      };
    }

    // 2. Secondary fallback for automated test callers passing ?operator= or x-operator-email headers
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionTokenMatch = cookieHeader.match(/fintraxis_session=([^;]+)/);
    const rawToken = sessionTokenMatch ? sessionTokenMatch[1] : request.headers.get("x-session-token");
    const operatorParam = new URL(request.url).searchParams.get("operator") || request.headers.get("x-operator-email");

    // Check for Demo Session pattern
    if (rawToken?.startsWith("DEMO-") || operatorParam === "guest" || operatorParam === "demo@fintraxis.terminal") {
      const isAllowed = requiredRoles.includes("DEMO_ANALYST");
      return {
        allowed: isAllowed,
        operator: "Demo Analyst (Sandbox)",
        role: "DEMO_ANALYST",
        isDemo: true,
        error: isAllowed ? undefined : "Access Denied: Guest demo sessions operate in sandbox mode and cannot modify production records.",
      };
    }

    // Lookup user in SQLite
    let userRow: { id: string; name: string; email: string; role: string; status?: string } | undefined;

    if (operatorParam) {
      userRow = sqlite
        .prepare("SELECT id, name, email, COALESCE(role, 'ANALYST') as role, COALESCE(status, 'ACTIVE') as status FROM users WHERE email = ? OR id = ?")
        .get(operatorParam, operatorParam) as typeof userRow;
    }

    // Account status check
    if (userRow && userRow.status === "DEACTIVATED") {
      return {
        allowed: false,
        operator: userRow.name,
        role: (userRow.role as OperatorRole) || "ANALYST",
        isDemo: false,
        userId: userRow.id,
        userEmail: userRow.email,
        error: "Access Denied: This operator account has been deactivated by a System Administrator.",
      };
    }

    // Default to Super Admin for default seeded admin or resolve user role
    const effectiveRole: OperatorRole = (userRow?.role as OperatorRole) || 
      (operatorParam?.toLowerCase().includes("superadmin") ? "SUPER_ADMIN" : 
       operatorParam?.toLowerCase().includes("admin") ? "ADMIN" : "ANALYST");
    const effectiveName = userRow?.name || (effectiveRole === "SUPER_ADMIN" ? "Super Administrator" : effectiveRole === "ADMIN" ? "Administrator" : "Active Analyst");

    const isAllowed = requiredRoles.includes(effectiveRole);

    if (!isAllowed) {
      return {
        allowed: false,
        operator: effectiveName,
        role: effectiveRole,
        isDemo: false,
        userId: userRow?.id,
        userEmail: userRow?.email,
        error: `Access Denied: Your assigned role (${effectiveRole}) does not have permission to execute this administrative operation.`,
      };
    }

    return {
      allowed: true,
      operator: effectiveName,
      role: effectiveRole,
      isDemo: false,
      userId: userRow?.id,
      userEmail: userRow?.email,
    };
  } catch (err) {
    console.warn("Authorization verification error (failing safe):", err);
    return {
      allowed: false,
      operator: "Unknown Operator",
      role: "ANALYST",
      isDemo: false,
      error: "Access Denied: Could not verify authorization credentials with security register.",
    };
  }
}

/**
 * Checks a granular institutional permission against the request's caller.
 */
export function verifyOperatorPermission(
  request: Request,
  permission: SystemPermission
): ClearanceCheckResult {
  const allowedRoles = ROLE_PERMISSIONS[permission] || ["SUPER_ADMIN"];
  return verifyOperatorClearance(request, allowedRoles as OperatorRole[]);
}
