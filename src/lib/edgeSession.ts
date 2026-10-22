export interface EdgeSessionPayload {
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
  authenticatedAt: string;
  exp?: number;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "fintraxis_institutional_signing_secret_key_2026_super_secure_vault";

export const SESSION_COOKIE_NAME = "fintraxis_session";

function base64UrlToUint8Array(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const b64 = padded + "=".repeat(padLen);
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Universal Web Crypto HMAC-SHA256 token verification for Next.js Middleware (Edge Runtime).
 * Zero Node.js native dependencies.
 */
export async function verifySessionInEdge(token: string): Promise<EdgeSessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [b64Payload, signature] = parts;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SESSION_SECRET);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = base64UrlToUint8Array(signature);
    const dataBytes = encoder.encode(b64Payload);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes as BufferSource,
      dataBytes as BufferSource
    );

    if (!isValid) return null;

    const payloadJson = atob(
      b64Payload.replace(/-/g, "+").replace(/_/g, "/")
    );
    const payload = JSON.parse(payloadJson) as EdgeSessionPayload;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
