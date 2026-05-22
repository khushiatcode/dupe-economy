import { db } from "./db";

const seedProducts = [
  ["Jodie Bag", "Bottega Veneta", "fashion", "Woven hobo bags", "Amazon sellers", 3800, 35, "Celebrity - Hailey Bieber, Rihanna", "Jan 2020", "active", "Defining it-bag of the Daniel Lee era at Bottega.", "seed"],
  ["Jelly Sandals", "The Row", "fashion", "PVC jelly flats", "Amazon sellers", 890, 18, "TikTok quiet luxury", "2024", "active", "Most popular fashion dupe of 2024 per press coverage.", "seed"],
  ["Margaux Bag", "The Row", "fashion", "East-west structured tote", "Amazon / AliExpress", 5500, 45, "Quiet luxury trend", "2023", "active", "", "seed"],
  ["Birkin (the Wirkin)", "Hermès", "fashion", "Wirkin bag", "Walmart", 13000, 78, "TikTok viral - Manny Buckley", "Late 2024", "removed", "Removed from Walmart. Most extreme price differential on record.", "seed"],
  ["Everywhere Belt Bag", "Lululemon", "fashion", "Belt bags", "Amazon", 38, 12, "TikTok", "2022", "active", "", "seed"],
  ["Boston Clog", "Birkenstock", "fashion", "Slip-on clogs", "Amazon / Target", 150, 25, "Celebrity + TikTok", "2022-23", "active", "", "seed"],
  ["Hollywood Flawless Filter", "Charlotte Tilbury", "makeup", "Halo Glow Liquid Filter", "ELF", 44, 14, "TikTok - Mikayla Nogueira side-by-side comparison", "2022", "active", "Brand launched Undupable campaign in 2025 in direct response.", "seed"],
  ["Soft Pinch Liquid Blush", "Rare Beauty", "makeup", "Camo Liquid Blush", "ELF", 23, 10, "TikTok + Selena Gomez", "2022", "active", "", "seed"],
  ["Lip Glow Oil", "Dior", "makeup", "Fat Oil Lip Drip", "NYX", 42, 10, "TikTok pink aesthetic", "2022-23", "active", "", "seed"],
  ["Les Beiges Water Fresh Tint", "Chanel", "makeup", "Halo Glow", "ELF", 60, 14, "TikTok beauty", "2022", "active", "", "seed"],
  ["Cloud Paint", "Glossier", "makeup", "Cheek Heat", "Maybelline", 22, 8, "Clean girl aesthetic", "2021", "active", "", "seed"],
  ["Bum Bum Cream", "Sol de Janeiro", "skincare", "Brazilian Nut Body Butter", "Trader Joe's", 50, 6, "TikTok scent virality", "2022-23", "active", "8,800 monthly dupe searches - #1 most-searched beauty dupe in the US, late 2025.", "seed"],
  ["Crème de la Mer", "La Mer", "skincare", "Blue Tin Cream", "Nivea", 350, 5, "Price vs efficacy debate", "Perennial", "active", "One of the most searched skincare debates in the US as of 2026.", "seed"],
  ["D-Bronzi Drops", "Drunk Elephant", "skincare", "Bronzing Drops", "ELF", 38, 10, "Smoothie routine TikTok", "2022", "active", "", "seed"],
  ["No. 3 Hair Perfector", "Olaplex", "haircare", "Bond Repair", "L'Oreal", 30, 15, "Science-backed claims virality", "2021", "acquired", "Acquired for $1.4B April 2026 at 3.3x 2025 sales.", "seed"],
  ["Peptide Lip Treatment", "Rhode Skin", "skincare", "Glazed lip products", "Ole Henriksen / Laneige", 32, 10, "Hailey Bieber glazed donut skin aesthetic", "2023", "active", "Brand valued at $1B in 2025.", "seed"],
];

let initialized;

export async function initSchema() {
  if (initialized) return;

  await db.batch([
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      dupe_product TEXT,
      dupe_brand TEXT,
      price_original REAL,
      price_dupe REAL,
      viral_driver TEXT,
      t0_date TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      discovered_by TEXT DEFAULT 'seed',
      first_seen TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS scan_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      triggered_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'running',
      products_found INTEGER DEFAULT 0,
      findings_count INTEGER DEFAULT 0,
      completed_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS findings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER REFERENCES scan_runs(id),
      product_id INTEGER REFERENCES products(id),
      brand TEXT,
      product_name TEXT,
      type TEXT,
      headline TEXT,
      significance TEXT,
      source TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS mass_market_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER REFERENCES scan_runs(id),
      responding_brand TEXT,
      launched_product TEXT,
      appears_to_mirror TEXT,
      prestige_brand TEXT,
      category TEXT,
      estimated_lag_months INTEGER,
      significance TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
  ]);

  const count = await db.execute("SELECT COUNT(*) AS count FROM products");
  if (Number(count.rows[0].count) === 0) {
    for (const row of seedProducts) {
      await db.execute({
        sql: `INSERT INTO products
          (name, brand, category, dupe_product, dupe_brand, price_original, price_dupe, viral_driver, t0_date, status, notes, discovered_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: row,
      });
    }
  }

  initialized = true;
}
