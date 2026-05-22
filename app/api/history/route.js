import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initSchema } from "@/lib/schema";
import { rows } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  await initSchema();
  const result = await db.execute(`
    SELECT *
    FROM scan_runs
    ORDER BY datetime(triggered_at) DESC
  `);
  const scans = [];
  for (const scan of rows(result)) {
    const findings = await db.execute({
      sql: "SELECT * FROM findings WHERE scan_id = ? ORDER BY id DESC",
      args: [scan.id],
    });
    scans.push({ ...scan, findings: rows(findings) });
  }

  return NextResponse.json({ scans });
}
