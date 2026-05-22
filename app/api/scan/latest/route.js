import { NextResponse } from "next/server";
import { getLatestCompleteScan } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const scan = await getLatestCompleteScan();
  return NextResponse.json({ scan });
}
