"use client";

import { useEffect, useMemo, useState } from "react";
import { MarketResponse, PageHeader } from "../components";

export default function MarketResponsesPage() {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    fetch("/api/market-responses")
      .then((res) => res.json())
      .then((data) => setResponses(data.responses || []));
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    for (const response of responses) {
      const key = response.responding_brand || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(response);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [responses]);

  return (
    <section>
      <PageHeader eyebrow="Market responses" title="Response Patterns">
        Scan-derived patterns showing which discovered responders appear most often, what categories they target, and how quickly they move.
      </PageHeader>
      <div className="grid gap-10">
        {groups.length ? groups.map(([brand, items]) => {
          const categoryCounts = countBy(items, "category");
          const averageLag = average(items.map((item) => item.estimated_lag_months).filter((value) => value || value === 0));
          return (
            <section key={brand} className="border-t border-[var(--border)] pt-7">
              <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-display text-4xl leading-tight text-[var(--black)]">{brand}</h2>
                  <div className="mt-2 text-sm text-[var(--warm-gray)]">{items.length} observed response{items.length === 1 ? "" : "s"}</div>
                </div>
                <div className="text-sm text-[var(--warm-gray)] md:text-right">
                  <div>Categories: {Object.keys(categoryCounts).filter(Boolean).join(", ") || "unknown"}</div>
                  <div>Average lag: {averageLag === null ? "unknown" : `${averageLag} months`}</div>
                </div>
              </div>
              <div className="grid gap-6">
                {items.map((response) => <MarketResponse key={response.id} response={response} />)}
              </div>
            </section>
          );
        }) : <div className="border-t border-[var(--border)] py-8 text-sm text-[var(--warm-gray)]">No response signals recorded yet.</div>}
      </div>
    </section>
  );
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const value = item[field];
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function average(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + Number(value), 0) / values.length);
}

