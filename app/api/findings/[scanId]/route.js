import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initSchema } from "@/lib/schema";
import { rows } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  await initSchema();
  const result = await db.execute({
    sql: "SELECT * FROM findings WHERE scan_id = ? ORDER BY id DESC",
    args: [params.scanId],
  });
  return NextResponse.json({ findings: rows(result) });
}
