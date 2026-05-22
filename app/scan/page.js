"use client";

import { useEffect, useMemo, useState } from "react";
import { FindingCard, formatDate, MarketResponse, PageHeader, ProductRow } from "../components";

export default function ScanPage() {
  const [latest, setLatest] = useState(null);
  const [stage, setStage] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/scan/latest")
      .then((res) => res.json())
      .then((data) => setLatest(data.scan))
      .catch(() => setLatest(null));
  }, []);

  const cooldown = useMemo(() => {
    if (!latest?.completed_at) return "";
    const completed = new Date(latest.completed_at.replace(" ", "T") + "Z").getTime();
    const remaining = completed + 6 * 60 * 60 * 1000 - Date.now();
    if (remaining <= 0) return "";
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.ceil((remaining % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }, [latest]);

  async function runScan() {
    setRunning(true);
    setError("");
    setStage("Stage 1: Discovery...");
    const timer = setTimeout(() => setStage("Stage 2: Depth..."), 2500);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const data = await res.json();
      clearTimeout(timer);
      setStage(data.from_cache ? "Cooldown active" : "Complete");
      setLatest(data.from_cache ? data.scan : {
        ...data.scan,
        findings: data.findings || [],
        mass_market_signals: data.mass_market_signals || [],
        newly_discovered: data.newly_discovered || [],
      });
      if (!res.ok) setError(data.error || "Scan completed with failed stages.");
    } catch (err) {
      clearTimeout(timer);
      setError(err.message);
      setStage("");
    } finally {
      setRunning(false);
    }
  }

  const findings = latest?.findings || [];
  const responses = latest?.mass_market_signals || [];
  const newlyDiscovered = latest?.newly_discovered || [];

  return (
    <section>
      <PageHeader eyebrow="Weekly scan" title="Scan">
        Run a grounded scan for current product virality, new alternatives, brand responses, and market signals.
      </PageHeader>
      <div className="mb-10 flex flex-col gap-4 border-y border-[var(--border)] py-6 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[var(--warm-gray)]">
          Most recent: {latest?.completed_at ? formatDate(latest.completed_at) : "No completed scan"}
          {cooldown && <span> / cooldown remaining {cooldown}</span>}
        </div>
        <button
          onClick={runScan}
          disabled={running || Boolean(cooldown)}
          className="w-fit border border-[var(--border)] px-5 py-3 text-sm text-[var(--black)] disabled:text-[var(--warm-gray)]"
        >
          {cooldown ? "Run this week's scan" : running ? stage : "Run this week's scan"}
        </button>
      </div>
      {stage && <div className="mb-8 text-sm text-[var(--gold)]">{stage}</div>}
      {error && <div className="mb-8 text-sm text-[var(--warm-gray)]">{error}</div>}
      <ScanSection title="Newly discovered">
        {newlyDiscovered.length ? newlyDiscovered.map((product) => <ProductRow key={product.id} product={product} />) : <Empty />}
      </ScanSection>
      <ScanSection title="Market signals">
        {findings.length ? findings.map((finding) => <FindingCard key={finding.id} finding={finding} />) : <Empty />}
      </ScanSection>
      <ScanSection title="Mass market response">
        {responses.length ? responses.map((response) => <MarketResponse key={response.id} response={response} />) : <Empty />}
      </ScanSection>
    </section>
  );
}

function ScanSection({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="mb-6 font-display text-3xl text-[var(--black)]">{title}</h2>
      <div className="grid gap-6">{children}</div>
    </section>
  );
}

function Empty() {
  return <div className="border-t border-[var(--border)] py-6 text-sm text-[var(--warm-gray)]">No records yet.</div>;
}
