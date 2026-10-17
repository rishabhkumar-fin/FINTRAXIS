import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { logAuditEvent } from "@/lib/auditLogger";
import { verifyOperatorClearance } from "@/lib/authGuard";

interface UserAdminRow {
  id: string;
  name: string;
  email: string;
  desk: string;
  avatar: string;
  role: string;
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

export async function PATCH(request: Request) {
  try {
    const clearance = verifyOperatorClearance(request, ["SUPER_ADMIN"]);
    if (!clearance.allowed) {
      return NextResponse.json({ success: false, error: clearance.error }, { status: 403 });
    }

    const body = await request.json();
    const { id, role, desk, netDebtEbitdaHurdle, interestCoverageHurdle, currentRatioHurdle } = body;
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

    const validRoles = ["SUPER_ADMIN", "LEAD_ANALYST", "ANALYST", "DEMO_ANALYST"];
    const updates: string[] = [];
    const params: unknown[] = [];

    if (role && validRoles.includes(role)) {
      updates.push("role = ?");
      params.push(role);
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
      `Updated user ${existing.email} (${existing.name}): ${updates.join(", ")}`,
      "INFO"
    );

    const updated = sqlite.prepare(`
      SELECT id, name, email, desk, avatar, COALESCE(role, 'ANALYST') as role,
             net_debt_ebitda_hurdle as netDebtEbitdaHurdle,
             interest_coverage_hurdle as interestCoverageHurdle,
             current_ratio_hurdle as currentRatioHurdle,
             created_at as createdAt
      FROM users WHERE id = ?
    `).get(id);

    return NextResponse.json({
      success: true,
      message: "User permissions and parameters successfully updated",
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
