import crypto from "crypto";

export interface SessionUserPayload {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "LEAD_ANALYST" | "ANALYST" | "DEMO_ANALYST";
  desk: string;
  avatar: string;
  isDemo: boolean;
  netDebtEbitdaHurdle: number;
  interestCoverageHurdle: number;
  currentRatioHurdle: number;
  mustChangePassword?: boolean;
  authenticatedAt: string;
  exp?: number;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "fintraxis_institutional_signing_secret_key_2026_super_secure_vault";

export const SESSION_COOKIE_NAME = "fintraxis_session";

/**
 * Creates an HMAC-SHA256 signed session token for stateless, serverless-safe authentication.
 */
export function createSignedSessionToken(
  payload: SessionUserPayload,
  expiresInSeconds = 86400 // 24 hours
): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(b64Payload)
    .digest("base64url");

  return `${b64Payload}.${signature}`;
}

/**
 * Validates the HMAC-SHA256 signature and expiration of a session token.
 * Returns the decoded payload or null if invalid/expired.
 */
export function verifySignedSessionToken(token: string): SessionUserPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [b64Payload, signature] = parts;

  try {
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(b64Payload)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const jsonStr = Buffer.from(b64Payload, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr) as SessionUserPayload;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session token from a standard Request object (Cookies or Authorization header).
 */
export function extractSessionFromRequest(request: Request): SessionUserPayload | null {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    let token = cookieMatch ? cookieMatch[1] : null;

    if (!token) {
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
    }

    if (!token) {
      token = request.headers.get("x-session-token");
    }

    if (!token) return null;

    return verifySignedSessionToken(token);
  } catch {
    return null;
  }
}
