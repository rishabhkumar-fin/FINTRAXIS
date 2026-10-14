/**
 * Authentication Rate Limiter & Demo Session Manager
 * Protects auth endpoints against credential stuffing and brute-force attacks.
 * Isolates demo sessions with read-only / write-restricted policies.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 60 seconds
const LOCKOUT_MS = 60 * 1000; // 60 seconds lockout

export function checkAuthRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const key = identifier.toLowerCase().trim();
  const record = rateLimitStore.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently locked out
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: retryAfter,
    };
  }

  // If window expired, reset attempts
  if (now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.delete(key);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + LOCKOUT_MS;
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.attempts,
  };
}

export function recordFailedAuthAttempt(identifier: string): void {
  const now = Date.now();
  const key = identifier.toLowerCase().trim();
  const record = rateLimitStore.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.set(key, { attempts: 1, firstAttemptAt: now });
  } else {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      record.blockedUntil = now + LOCKOUT_MS;
    }
  }
}

export function resetAuthRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier.toLowerCase().trim());
}

/**
 * Creates an explicitly identified demo session with isolated sample data and write restrictions.
 */
export function createDemoSession() {
  const timestamp = new Date().toISOString();
  return {
    id: "usr_demo_session",
    name: "Demo Analyst",
    email: "demo@fintraxis.terminal",
    desk: "Global Surveillance (Demo Mode)",
    avatar: "crest",
    isDemo: true,
    role: "DEMO_ANALYST",
    writeRestricted: true,
    netDebtEbitdaHurdle: 3.50,
    interestCoverageHurdle: 2.50,
    currentRatioHurdle: 1.10,
    sessionToken: `DEMO-${Date.now()}`,
    authenticatedAt: timestamp,
    notice: "DEMO SESSION: Operating in sandbox mode with write restrictions and isolated sample data.",
  };
}
