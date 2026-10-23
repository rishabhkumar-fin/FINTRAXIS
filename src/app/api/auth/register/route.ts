import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Full Name is required." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.trim() || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "A valid email address is required." }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    if (password.length < 8 || !hasLetters || !hasNumbers) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long and contain both letters and numbers.",
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, cleanEmail),
          sql`lower(${users.name}) = ${cleanEmail}`
        )
      )
      .get();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Cryptographic PBKDF2 with 16-byte random salt and 10,000 iterations
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    const userId = `usr_${crypto.randomBytes(8).toString("hex")}`;

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      salt,
      desk: "Global Credit Risk & Surveillance",
      avatar: "crest",
      netDebtEbitdaHurdle: 3.50,
      interestCoverageHurdle: 2.50,
      currentRatioHurdle: 1.10,
      role: "ANALYST", // Role defaults strictly to Analyst
      status: "ACTIVE",
      mustChangePassword: 0,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.insert(users).values(newUser).run();

    const sessionPayload = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      desk: newUser.desk,
      avatar: newUser.avatar,
      role: newUser.role,
      isDemo: false,
      netDebtEbitdaHurdle: newUser.netDebtEbitdaHurdle,
      interestCoverageHurdle: newUser.interestCoverageHurdle,
      currentRatioHurdle: newUser.currentRatioHurdle,
      sessionToken: `USR-${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
      authenticatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Account successfully created.",
      user: sessionPayload,
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/register failure:", error);
    const msg = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
