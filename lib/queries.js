import { db } from "./db";
import { initSchema } from "./schema";

export function rows(result) {
  return result.rows.map((row) => ({ ...row }));
}

export async function getLatestCompleteScan() {
  await initSchema();
  const result = await db.execute(`
    SELECT *
    FROM scan_runs
    WHERE status = 'complete'
    ORDER BY datetime(triggered_at) DESC
    LIMIT 1
  `);
  const scan = result.rows[0] ? { ...result.rows[0] } : null;
  if (!scan) return null;

  const findings = await db.execute({
    sql: "SELECT * FROM findings WHERE scan_id = ? ORDER BY id DESC",
    args: [scan.id],
  });
  const massMarketSignals = await db.execute({
    sql: "SELECT * FROM mass_market_signals WHERE scan_id = ? ORDER BY id DESC",
    args: [scan.id],
  });

  return {
    ...scan,
    findings: rows(findings),
    mass_market_signals: rows(massMarketSignals),
  };
}

export async function getCooldownScan() {
  await initSchema();
  const result = await db.execute(`
    SELECT *
    FROM scan_runs
    WHERE status = 'complete'
      AND datetime(completed_at) >= datetime('now', '-6 hours')
    ORDER BY datetime(completed_at) DESC
    LIMIT 1
  `);
  return result.rows[0] ? { ...result.rows[0] } : null;
}

export async function findProductByNameAndBrand(name, brand) {
  const result = await db.execute({
    sql: "SELECT * FROM products WHERE lower(name) = lower(?) AND lower(brand) = lower(?) LIMIT 1",
    args: [name || "", brand || ""],
  });
  return result.rows[0] ? { ...result.rows[0] } : null;
}

