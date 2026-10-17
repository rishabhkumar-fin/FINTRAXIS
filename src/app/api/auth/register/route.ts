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
      return NextResponse.json({ success: false, error: "Full Name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ success: false, error: "Username or email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const cleanIdentifier = email.trim().toLowerCase();
    const existing = db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, cleanIdentifier),
          sql`lower(${users.name}) = ${cleanIdentifier}`
        )
      )
      .get();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this username or email already exists" },
        { status: 409 }
      );
    }

    // Cryptographic PBKDF2 with 16-byte random salt and 10,000 iterations
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    const userId = `usr_${crypto.randomBytes(8).toString("hex")}`;
    const cleanEmail = cleanIdentifier.includes("@") ? cleanIdentifier : `${cleanIdentifier}@fintraxis.local`;

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      salt,
      desk: "Credit Risk & Intelligence",
      avatar: "crest",
      netDebtEbitdaHurdle: 3.50,
      interestCoverageHurdle: 2.50,
      currentRatioHurdle: 1.10,
      role: "ANALYST",
      status: "ACTIVE",
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
      netDebtEbitdaHurdle: newUser.netDebtEbitdaHurdle,
      interestCoverageHurdle: newUser.interestCoverageHurdle,
      currentRatioHurdle: newUser.currentRatioHurdle,
      sessionToken: `SOV-${crypto.randomBytes(12).toString("hex").toUpperCase()}`,
      authenticatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "User successfully registered",
      user: sessionPayload,
    });
  } catch (error: unknown) {
    console.error("POST /api/auth/register failure:", error);
    const msg = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
