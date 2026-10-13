import { NextResponse } from "next/server";
import { getAuditItem } from "@/lib/securityMaster";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const metricKey = searchParams.get("metricKey");
    const period = searchParams.get("period") || undefined;

    if (!companyId || !metricKey) {
      return NextResponse.json(
        { success: false, error: "companyId and metricKey parameters are required" },
        { status: 400 }
      );
    }

    const audit = await getAuditItem(companyId, metricKey, period);

    return NextResponse.json({
      success: true,
      data: audit ?? null,
    });
  } catch (error) {
    console.error("GET /api/audit error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to query audit provenance" },
      { status: 500 }
    );
  }
}
