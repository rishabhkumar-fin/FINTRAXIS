import { NextResponse } from "next/server";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      email,
      name,
      desk,
      avatar,
      netDebtEbitdaHurdle,
      interestCoverageHurdle,
      currentRatioHurdle,
    } = body;

    if (!id && !email) {
      return NextResponse.json(
        { success: false, error: "User ID or Email is required to update settings" },
        { status: 400 }
      );
    }

    const targetUser = id
      ? db.select().from(users).where(eq(users.id, id)).get()
      : db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).get();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found in institutional register" },
        { status: 404 }
      );
    }

    const updates: Partial<typeof users.$inferInsert> = {};
    if (name && typeof name === "string") updates.name = name.trim();
    if (desk && typeof desk === "string") updates.desk = desk;
    if (avatar && typeof avatar === "string") updates.avatar = avatar;
    if (typeof netDebtEbitdaHurdle === "number") updates.netDebtEbitdaHurdle = netDebtEbitdaHurdle;
    if (typeof interestCoverageHurdle === "number") updates.interestCoverageHurdle = interestCoverageHurdle;
    if (typeof currentRatioHurdle === "number") updates.currentRatioHurdle = currentRatioHurdle;

    db.update(users).set(updates).where(eq(users.id, targetUser.id)).run();

    const updated = db.select().from(users).where(eq(users.id, targetUser.id)).get();

    if (!updated) {
      return NextResponse.json({ success: false, error: "Failed to reload updated profile" }, { status: 500 });
    }

    const sessionPayload = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      desk: updated.desk,
      avatar: updated.avatar,
      netDebtEbitdaHurdle: updated.netDebtEbitdaHurdle ?? 3.50,
      interestCoverageHurdle: updated.interestCoverageHurdle ?? 2.50,
      currentRatioHurdle: updated.currentRatioHurdle ?? 1.10,
    };

    return NextResponse.json({
      success: true,
      message: "Operator settings and risk hurdle calibrations persisted to SQLite",
      user: sessionPayload,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/auth/settings failure:", error);
    const msg = error instanceof Error ? error.message : "Settings update failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
