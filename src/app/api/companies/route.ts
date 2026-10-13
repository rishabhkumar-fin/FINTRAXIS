import { NextResponse } from "next/server";
import { getAllCompanies, resolveSecurity } from "@/lib/securityMaster";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (query) {
      const match = await resolveSecurity(query);
      return NextResponse.json({ success: true, data: match ? [match] : [] });
    }

    const companies = await getAllCompanies();
    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch security master list" },
      { status: 500 }
    );
  }
}
