import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initSchema } from "@/lib/schema";
import { rows } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await initSchema();
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get("brand");
  const result = await db.execute({
    sql: `SELECT *
      FROM mass_market_signals
      ${brand ? "WHERE lower(responding_brand) = lower(?)" : ""}
      ORDER BY datetime(created_at) DESC, id DESC`,
    args: brand ? [brand] : [],
  });
  return NextResponse.json({ responses: rows(result) });
}
