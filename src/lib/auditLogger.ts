import { sqlite } from "../db/index.ts";
import crypto from "crypto";

export interface SystemAuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | "AUTH_LOGIN"
    | "AUTH_FAILED"
    | "RATE_LIMIT_BLOCK"
    | "DEMO_SESSION"
    | "COMPANY_INGEST"
    | "POLICY_UPDATE"
    | "USER_MANAGEMENT"
    | "SYSTEM_DIAGNOSTIC"
    | "SYSTEM_JOB"
    | "PROVIDER_HEALTH"
    | "SECURITY_REVOKE";
  severity: "INFO" | "WARNING" | "CRITICAL";
  operator: string;
  details: string;
}

export function logAuditEvent(
  eventType: SystemAuditEvent["eventType"],
  operator: string,
  details: string,
  severity: SystemAuditEvent["severity"] = "INFO"
): void {
  try {
    const id = `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const timestamp = new Date().toISOString();

    sqlite.prepare(`
      INSERT INTO admin_audit_logs (id, timestamp, event_type, severity, operator, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, timestamp, eventType, severity, operator, details);
  } catch (err) {
    console.warn("Failed to log audit event:", err);
  }
}

export function getRecentAuditEvents(limit: number = 50): SystemAuditEvent[] {
  try {
    const rows = sqlite.prepare(`
      SELECT id, timestamp, event_type as eventType, severity, operator, details
      FROM admin_audit_logs
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as SystemAuditEvent[];

    return rows;
  } catch (err) {
    console.warn("Failed to retrieve audit events:", err);
    return [];
  }
}
