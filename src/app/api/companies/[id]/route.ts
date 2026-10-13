import { NextResponse } from "next/server";
import { getCompanyDetails } from "@/lib/securityMaster";
import { StressSimulationInputs } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const revShock = Number(searchParams.get("revShock") ?? -10);
    const cogsInflation = Number(searchParams.get("cogsInflation") ?? 5);
    const rateShock = Number(searchParams.get("rateShock") ?? 200);

    const simInputs: StressSimulationInputs = {
      revenueShockPct: revShock,
      cogsInflationPct: cogsInflation,
      rateShockBps: rateShock,
    };

    const details = await getCompanyDetails(decodeURIComponent(id), simInputs);

    if (!details) {
      return NextResponse.json(
        { success: false, error: `Company entity not found for ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: details });
  } catch (error) {
    console.error("GET /api/companies/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal risk terminal computation failure" },
      { status: 500 }
    );
  }
}
