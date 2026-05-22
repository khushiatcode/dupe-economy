import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initSchema } from "@/lib/schema";
import { findProductByNameAndBrand, getCooldownScan, getLatestCompleteScan, rows } from "@/lib/queries";
import { runDepth, runDiscovery } from "@/lib/gemini";

export const dynamic = "force-dynamic";

async function insertFinding(scanId, finding) {
  await db.execute({
    sql: `INSERT INTO findings
      (scan_id, product_id, brand, product_name, type, headline, significance, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      scanId,
      finding.product_id || null,
      finding.brand || null,
      finding.product_name || finding.product || null,
      finding.type,
      finding.headline,
      finding.significance || null,
      finding.source || null,
    ],
  });
}

async function getScanPayload(scanId, extra = {}) {
  const scanResult = await db.execute({ sql: "SELECT * FROM scan_runs WHERE id = ?", args: [scanId] });
  const findings = await db.execute({ sql: "SELECT * FROM findings WHERE scan_id = ? ORDER BY id DESC", args: [scanId] });
  const responses = await db.execute({ sql: "SELECT * FROM mass_market_signals WHERE scan_id = ? ORDER BY id DESC", args: [scanId] });
  const discovered = await db.execute({
    sql: `SELECT *
      FROM products
      WHERE discovered_by = 'scan'
        AND datetime(first_seen) >= (SELECT datetime(triggered_at) FROM scan_runs WHERE id = ?)
      ORDER BY id DESC`,
    args: [scanId],
  });

  return {
    scan: scanResult.rows[0] ? { ...scanResult.rows[0] } : null,
    findings: rows(findings),
    mass_market_signals: rows(responses),
    newly_discovered: rows(discovered),
    ...extra,
  };
}

export async function POST() {
  await initSchema();

  const cachedScan = await getCooldownScan();
  if (cachedScan) {
    const latest = await getLatestCompleteScan();
    return NextResponse.json({ from_cache: true, scan: latest });
  }

  const created = await db.execute("INSERT INTO scan_runs (status) VALUES ('running') RETURNING id");
  const scanId = created.rows[0].id;
  const failedStages = [];
  let productsFound = 0;
  let findingsCount = 0;

  try {
    try {
      const { data } = await runDiscovery();
      const viralProducts = Array.isArray(data.viral_products) ? data.viral_products : [];

      for (const product of viralProducts) {
        if (!product?.name || !product?.brand) continue;
        let existing = await findProductByNameAndBrand(product.name, product.brand);
        const firstDupe = Array.isArray(product.known_dupes) ? product.known_dupes[0] : null;

        if (!existing) {
          const inserted = await db.execute({
            sql: `INSERT INTO products
              (name, brand, category, dupe_product, dupe_brand, price_original, price_dupe, viral_driver, t0_date, status, notes, discovered_by)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 'scan')
              RETURNING *`,
            args: [
              product.name,
              product.brand,
              product.category || null,
              firstDupe?.dupe_product || null,
              firstDupe?.dupe_brand || null,
              firstDupe?.price_original || null,
              firstDupe?.price_dupe || null,
              product.why_viral || product.viral_platform || null,
              product.approximate_viral_date || null,
              firstDupe?.where_sold ? `Observed alternative retail context: ${firstDupe.where_sold}` : "",
            ],
          });
          existing = { ...inserted.rows[0] };
          productsFound += 1;
        }

        await insertFinding(scanId, {
          product_id: existing.id,
          brand: product.brand,
          product_name: product.name,
          type: "viral_product",
          headline: product.why_viral || `${product.name} is showing current viral activity.`,
          significance: product.viral_platform ? `Viral signal source: ${product.viral_platform}` : null,
          source: "Google Search grounding",
        });
        findingsCount += 1;

        for (const dupe of product.known_dupes || []) {
          await insertFinding(scanId, {
            product_id: existing.id,
            brand: dupe.dupe_brand || null,
            product_name: dupe.dupe_product || null,
            type: "new_dupe",
            headline: `${dupe.dupe_product || "An alternative product"} is being compared with ${product.name}.`,
            significance: dupe.where_sold ? `Observed retail context: ${dupe.where_sold}` : null,
            source: "Google Search grounding",
          });
          findingsCount += 1;
        }
      }

      await db.execute({
        sql: "UPDATE scan_runs SET status = 'stage1_complete', products_found = ? WHERE id = ?",
        args: [productsFound, scanId],
      });
    } catch (error) {
      if (error.rawResponse) console.error("Discovery raw response:", error.rawResponse);
      console.error("Discovery stage failed:", error);
      failedStages.push("discovery");
      await db.execute({
        sql: "UPDATE scan_runs SET status = 'failed', products_found = ? WHERE id = ?",
        args: [productsFound, scanId],
      });
    }

    try {
      const { data } = await runDepth();
      const findings = Array.isArray(data.findings) ? data.findings : [];
      const responses = Array.isArray(data.mass_market_responses) ? data.mass_market_responses : [];

      for (const finding of findings) {
        await insertFinding(scanId, {
          brand: finding.brand,
          product_name: finding.product,
          type: finding.type,
          headline: finding.headline,
          significance: finding.significance,
          source: finding.source,
        });
        findingsCount += 1;
      }

      for (const response of responses) {
        await db.execute({
          sql: `INSERT INTO mass_market_signals
            (scan_id, responding_brand, launched_product, appears_to_mirror, prestige_brand, category, estimated_lag_months, significance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            scanId,
            response.responding_brand || null,
            response.launched_product || null,
            response.appears_to_mirror || null,
            response.prestige_brand || null,
            response.category || null,
            response.estimated_lag_months ?? null,
            response.significance || null,
          ],
        });
      }
    } catch (error) {
      if (error.rawResponse) console.error("Depth raw response:", error.rawResponse);
      console.error("Depth stage failed:", error);
      failedStages.push("depth");
    }

    const finalStatus = failedStages.length === 2 ? "failed" : "complete";
    await db.execute({
      sql: "UPDATE scan_runs SET status = ?, products_found = ?, findings_count = ?, completed_at = datetime('now') WHERE id = ?",
      args: [finalStatus, productsFound, findingsCount, scanId],
    });

    const payload = await getScanPayload(scanId, { failed_stages: failedStages });
    return NextResponse.json(payload, { status: finalStatus === "failed" ? 500 : 200 });
  } catch (error) {
    console.error("Scan orchestration failed:", error);
    await db.execute({
      sql: "UPDATE scan_runs SET status = 'failed', completed_at = datetime('now') WHERE id = ?",
      args: [scanId],
    });
    return NextResponse.json({ error: error.message, failed_stages: failedStages }, { status: 500 });
  }
}
