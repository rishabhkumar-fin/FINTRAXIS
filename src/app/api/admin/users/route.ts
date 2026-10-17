import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { logAuditEvent } from "@/lib/auditLogger";
import { verifyOperatorClearance } from "@/lib/authGuard";
import crypto from "crypto";

interface UserAdminRow {
  id: string;
  name: string;
  email: string;
  desk: string;
  avatar: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  netDebtEbitdaHurdle: number | null;
  interestCoverageHurdle: number | null;
  currentRatioHurdle: number | null;
  createdAt: string;
}

export async function GET() {
  try {
    const rows = sqlite.prepare(`
      SELECT 
        id, name, email, desk, avatar,
        COALESCE(role, 'ANALYST') as role,
        COALESCE(status, 'ACTIVE') as status,
        last_login_at as lastLoginAt,
        net_debt_ebitda_hurdle as netDebtEbitdaHurdle,
        interest_coverage_hurdle as interestCoverageHurdle,
        current_ratio_hurdle as currentRatioHurdle,
        created_at as createdAt
      FROM users
      ORDER BY created_at DESC
    `).all() as UserAdminRow[];

    return NextResponse.json({
      success: true,
      count: rows.length,
      users: rows,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/users error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load user directory";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clearance = verifyOperatorClearance(request, ["SUPER_ADMIN", "ADMIN"]);
    if (!clearance.allowed) {
      return NextResponse.json({ success: false, error: clearance.error }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role = "ANALYST", desk = "Institutional Risk Desk" } = body;
    const operator = clearance.operator;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Operator name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ success: false, error: "Valid email address is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = sqlite.prepare("SELECT id FROM users WHERE lower(email) = ?").get(cleanEmail);
    if (existing) {
      return NextResponse.json({ success: false, error: "An operator with this email is already registered" }, { status: 409 });
    }

    const validRoles = ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST", "ANALYST", "DEMO_ANALYST"];
    const targetRole = validRoles.includes(role) ? role : "ANALYST";

    // Non-super-admins cannot provision SUPER_ADMIN accounts
    if (targetRole === "SUPER_ADMIN" && clearance.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Only Super Administrators can provision new Super Administrator accounts" }, { status: 403 });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    const userId = `usr_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, desk, avatar, role, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'crest', ?, 'ACTIVE', ?)
    `).run(userId, name.trim(), cleanEmail, passwordHash, salt, desk.trim(), targetRole, now);

    logAuditEvent(
      "USER_MANAGEMENT",
      operator,
      `Provisioned operator clearance: ${cleanEmail} (${name.trim()}) with role ${targetRole}`,
      "INFO"
    );

    const newUser = sqlite.prepare(`
      SELECT id, name, email, desk, avatar, COALESCE(role, 'ANALYST') as role,
             COALESCE(status, 'ACTIVE') as status, last_login_at as lastLoginAt,
             created_at as createdAt
      FROM users WHERE id = ?
    `).get(userId);

    return NextResponse.json({
      success: true,
      message: `Operator ${name} enrolled with ${targetRole} clearance`,
      user: newUser,
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/users error:", err);
    const msg = err instanceof Error ? err.message : "Failed to provision operator account";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const clearance = verifyOperatorClearance(request, ["SUPER_ADMIN", "ADMIN"]);
    if (!clearance.allowed) {
      return NextResponse.json({ success: false, error: clearance.error }, { status: 403 });
    }

    const body = await request.json();
    const { id, role, desk, status, netDebtEbitdaHurdle, interestCoverageHurdle, currentRatioHurdle } = body;
    const operator = clearance.operator;

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const existing = sqlite.prepare("SELECT id, name, email, role, COALESCE(status, 'ACTIVE') as status FROM users WHERE id = ?").get(id) as {
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
    } | undefined;

    if (!existing) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404 });
    }

    const validRoles = ["SUPER_ADMIN", "ADMIN", "LEAD_ANALYST", "ANALYST", "DEMO_ANALYST"];
    const updates: string[] = [];
    const params: unknown[] = [];

    // Role modification guard
    if (role && validRoles.includes(role)) {
      if (role === "SUPER_ADMIN" && clearance.role !== "SUPER_ADMIN") {
        return NextResponse.json({ success: false, error: "Only Super Administrators can grant Super Administrator clearance" }, { status: 403 });
      }

      // If demoting an existing SUPER_ADMIN, ensure they are not the last active SUPER_ADMIN
      if (existing.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
        const superAdminCount = (sqlite.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'SUPER_ADMIN' AND COALESCE(status, 'ACTIVE') = 'ACTIVE'").get() as { count: number })?.count ?? 0;
        if (superAdminCount <= 1) {
          return NextResponse.json({ success: false, error: "Cannot demote the sole active Super Administrator account" }, { status: 403 });
        }
      }

      updates.push("role = ?");
      params.push(role);
    }

    // Status modification (ACTIVE / DEACTIVATED)
    if (status && (status === "ACTIVE" || status === "DEACTIVATED")) {
      if (existing.role === "SUPER_ADMIN" && status === "DEACTIVATED") {
        const activeSuperAdminCount = (sqlite.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'SUPER_ADMIN' AND COALESCE(status, 'ACTIVE') = 'ACTIVE'").get() as { count: number })?.count ?? 0;
        if (activeSuperAdminCount <= 1) {
          return NextResponse.json({ success: false, error: "Cannot deactivate the sole active Super Administrator account" }, { status: 403 });
        }
      }
      updates.push("status = ?");
      params.push(status);
    }

    if (desk && typeof desk === "string") {
      updates.push("desk = ?");
      params.push(desk.trim());
    }
    if (typeof netDebtEbitdaHurdle === "number") {
      updates.push("net_debt_ebitda_hurdle = ?");
      params.push(netDebtEbitdaHurdle);
    }
    if (typeof interestCoverageHurdle === "number") {
      updates.push("interest_coverage_hurdle = ?");
      params.push(interestCoverageHurdle);
    }
    if (typeof currentRatioHurdle === "number") {
      updates.push("current_ratio_hurdle = ?");
      params.push(currentRatioHurdle);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    params.push(id);
    sqlite.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);

    logAuditEvent(
      "USER_MANAGEMENT",
      operator,
      `Updated operator ${existing.email} (${existing.name}): ${updates.join(", ")}`,
      status === "DEACTIVATED" ? "WARNING" : "INFO"
    );

    const updated = sqlite.prepare(`
      SELECT id, name, email, desk, avatar, COALESCE(role, 'ANALYST') as role,
             COALESCE(status, 'ACTIVE') as status, last_login_at as lastLoginAt,
             net_debt_ebitda_hurdle as netDebtEbitdaHurdle,
             interest_coverage_hurdle as interestCoverageHurdle,
             current_ratio_hurdle as currentRatioHurdle,
             created_at as createdAt
      FROM users WHERE id = ?
    `).get(id);

    return NextResponse.json({
      success: true,
      message: "User clearance and parameters successfully updated",
      user: updated,
    });
  } catch (err: unknown) {
    console.error("PATCH /api/admin/users error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update user profile";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const clearance = verifyOperatorClearance(request, ["SUPER_ADMIN"]);
    if (!clearance.allowed) {
      return NextResponse.json({ success: false, error: clearance.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const operator = clearance.operator;

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const existing = sqlite.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(id) as {
      id: string;
      name: string;
      email: string;
      role: string;
    } | undefined;

    if (!existing) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404 });
    }

    // Safety guard: ensure not deleting the last SUPER_ADMIN
    if (existing.role === "SUPER_ADMIN") {
      const adminCount = (sqlite.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'SUPER_ADMIN'").get() as { count: number })?.count ?? 0;
      if (adminCount <= 1) {
        return NextResponse.json({ success: false, error: "Cannot delete the sole surviving Super Admin account" }, { status: 403 });
      }
    }

    // Prevent deleting own account if it's the calling operator
    if (clearance.userId === existing.id || clearance.userEmail === existing.email) {
      return NextResponse.json({ success: false, error: "Cannot delete your own active administrator session" }, { status: 400 });
    }

    sqlite.prepare("DELETE FROM users WHERE id = ?").run(id);

    logAuditEvent(
      "USER_MANAGEMENT",
      operator,
      `De-registered user account ${existing.email} (${existing.name})`,
      "WARNING"
    );

    return NextResponse.json({
      success: true,
      message: `User ${existing.email} de-registered from institutional directory`,
    });
  } catch (err: unknown) {
    console.error("DELETE /api/admin/users error:", err);
    const msg = err instanceof Error ? err.message : "Failed to remove user account";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
