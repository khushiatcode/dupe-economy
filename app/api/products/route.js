import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initSchema } from "@/lib/schema";
import { rows } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request) {
  await initSchema();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const discoveredBy = searchParams.get("discovered_by");
  const filters = [];
  const args = [];

  if (category) {
    filters.push("category = ?");
    args.push(category);
  }
  if (discoveredBy) {
    filters.push("discovered_by = ?");
    args.push(discoveredBy);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const result = await db.execute({
    sql: `SELECT * FROM products ${where} ORDER BY brand COLLATE NOCASE, name COLLATE NOCASE`,
    args,
  });

  return NextResponse.json({ products: rows(result) });
}
