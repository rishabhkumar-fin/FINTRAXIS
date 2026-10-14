import { NextResponse } from "next/server";
import { sqlite } from "@/db/index";
import { logAuditEvent, SystemAuditEvent } from "@/lib/auditLogger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);
    const eventType = searchParams.get("eventType");
    const severity = searchParams.get("severity");
    const format = searchParams.get("format");

    let query = `
      SELECT id, timestamp, event_type as eventType, severity, operator, details
      FROM admin_audit_logs
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (eventType) {
      query += " AND event_type = ?";
      params.push(eventType);
    }
    if (severity) {
      query += " AND severity = ?";
      params.push(severity);
    }

    query += " ORDER BY timestamp DESC LIMIT ?";
    params.push(limit);

    const logs = sqlite.prepare(query).all(...params) as SystemAuditEvent[];

    // Support regulatory CSV export
    if (format === "csv") {
      const headers = ["ID", "Timestamp", "Event Type", "Severity", "Operator", "Details"];
      const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
      const csvLines = [
        headers.join(","),
        ...logs.map((log) =>
          [
            escapeCsv(log.id),
            escapeCsv(log.timestamp),
            escapeCsv(log.eventType),
            escapeCsv(log.severity),
            escapeCsv(log.operator),
            escapeCsv(log.details),
          ].join(",")
        ),
      ];

      return new Response(csvLines.join("\r\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="fintraxis_audit_log_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err: unknown) {
    console.error("GET /api/admin/logs error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load audit trail";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, operator, details, severity = "INFO" } = body;

    if (!eventType || !operator || !details) {
      return NextResponse.json(
        { success: false, error: "eventType, operator, and details are required" },
        { status: 400 }
      );
    }

    logAuditEvent(eventType, operator, details, severity);

    return NextResponse.json({
      success: true,
      message: "Audit journal entry permanently appended",
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/logs error:", err);
    const msg = err instanceof Error ? err.message : "Failed to write audit entry";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
