import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.email || body.username || "").trim().toLowerCase();
    const { password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    let user = db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identifier),
          sql`lower(${users.name}) = ${identifier}`
        )
      )
      .get();

    // Auto-seed default operator identity if logging in and account does not exist in DB yet
    if (!user && (identifier === "rishabh.yadav@fintraxis.sovereign" || identifier === "rishabh" || identifier === "admin")) {
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = crypto
        .pbkdf2Sync(password, salt, 10000, 64, "sha512")
        .toString("hex");

      const defaultUser = {
        id: `usr_${crypto.randomBytes(8).toString("hex")}`,
        name: "Rishabh Kumar Yadav",
        email: "rishabh.yadav@fintraxis.sovereign",
        passwordHash,
        salt,
        desk: "Credit Risk & Intelligence",
        avatar: "crest",
        netDebtEbitdaHurdle: 3.50,
        interestCoverageHurdle: 2.50,
        currentRatioHurdle: 1.10,
        createdAt: new Date().toISOString(),
      };

      db.insert(users).values(defaultUser).run();
      user = defaultUser;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found. Please check your credentials or create an account." },
        { status: 401 }
      );
    }

    // Cryptographic PBKDF2 verification with timing-safe comparison
    const testHash = crypto
      .pbkdf2Sync(password, user.salt, 10000, 64, "sha512")
      .toString("hex");

    const testBuf = Buffer.from(testHash, "hex");
    const storedBuf = Buffer.from(user.passwordHash, "hex");

    const isMatch =
      testBuf.length === storedBuf.length && crypto.timingSafeEqual(testBuf, storedBuf);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      desk: user.desk,
      avatar: user.avatar,
      netDebtEbitdaHurdle: user.netDebtEbitdaHurdle ?? 3.50,
      interestCoverageHurdle: user.interestCoverageHurdle ?? 2.50,
      currentRatioHurdle: user.currentRatioHurdle ?? 1.10,
      sessionToken: `SOV-${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
      authenticatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: sessionPayload,
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/login failure:", error);
    const msg = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
