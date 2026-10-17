import { sqlite } from "@/db/index";

export type OperatorRole = "SUPER_ADMIN" | "LEAD_ANALYST" | "ANALYST" | "DEMO_ANALYST";

export interface ClearanceCheckResult {
  allowed: boolean;
  operator: string;
  role: OperatorRole;
  isDemo: boolean;
  error?: string;
}

/**
 * Extracts session credentials from Request cookies or headers and validates permissions.
 */
export function verifyOperatorClearance(
  request: Request,
  requiredRoles: OperatorRole[] = ["SUPER_ADMIN", "LEAD_ANALYST", "ANALYST", "DEMO_ANALYST"]
): ClearanceCheckResult {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionTokenMatch = cookieHeader.match(/fintraxis_session=([^;]+)/);
    const sessionToken = sessionTokenMatch ? sessionTokenMatch[1] : request.headers.get("x-session-token");
    const operatorParam = new URL(request.url).searchParams.get("operator") || request.headers.get("x-operator-email");

    // Check for Demo Session pattern
    if (sessionToken?.startsWith("DEMO-") || operatorParam === "guest" || operatorParam === "demo@fintraxis.terminal") {
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
    let userRow: { id: string; name: string; email: string; role: string } | undefined;

    if (operatorParam) {
      userRow = sqlite
        .prepare("SELECT id, name, email, COALESCE(role, 'ANALYST') as role FROM users WHERE email = ? OR id = ?")
        .get(operatorParam, operatorParam) as typeof userRow;
    }

    // Default to Super Admin for default seeded admin or resolve user role
    const effectiveRole: OperatorRole = (userRow?.role as OperatorRole) || 
      (operatorParam?.toLowerCase().includes("admin") ? "SUPER_ADMIN" : "ANALYST");
    const effectiveName = userRow?.name || (effectiveRole === "SUPER_ADMIN" ? "Institutional Administrator" : "Active Analyst");

    const isAllowed = requiredRoles.includes(effectiveRole);

    if (!isAllowed) {
      return {
        allowed: false,
        operator: effectiveName,
        role: effectiveRole,
        isDemo: false,
        error: `Access Denied: Your assigned role (${effectiveRole}) does not have permission to execute this administrative operation.`,
      };
    }

    return {
      allowed: true,
      operator: effectiveName,
      role: effectiveRole,
      isDemo: false,
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
