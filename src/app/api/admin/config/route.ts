import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { logAuditEvent } from "@/lib/auditLogger";

export async function GET() {
  try {
    const rows = sqlite.prepare(`
      SELECT key, value, description, updated_at as updatedAt, updated_by as updatedBy
      FROM system_config
      ORDER BY key ASC
    `).all();

    return NextResponse.json({
      success: true,
      config: rows,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/config error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load system config";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, description, operator = "SUPER_ADMIN" } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Key and Value are required" }, { status: 400 });
    }

    const cleanKey = String(key).toUpperCase().trim();
    const strValue = String(value).trim();
    const now = new Date().toISOString();

    const existing = sqlite.prepare("SELECT value FROM system_config WHERE key = ?").get(cleanKey) as { value: string } | undefined;

    sqlite.prepare(`
      INSERT INTO system_config (key, value, description, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        description = COALESCE(excluded.description, system_config.description),
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).run(cleanKey, strValue, description || null, now, operator);

    logAuditEvent(
      "POLICY_UPDATE",
      operator,
      `Policy hurdle ${cleanKey} adjusted: "${existing?.value ?? 'UNSET'}" -> "${strValue}"`,
      "WARNING"
    );

    return NextResponse.json({
      success: true,
      message: `System parameter ${cleanKey} updated successfully`,
      entry: {
        key: cleanKey,
        value: strValue,
        description,
        updatedAt: now,
        updatedBy: operator,
      },
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/config error:", err);
    const msg = err instanceof Error ? err.message : "Failed to calibrate system policy parameter";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
