"use client";

import { useEffect, useState } from "react";
import { FindingCard, formatDate, PageHeader } from "../components";

export default function ArchivePage() {
  const [scans, setScans] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setScans(data.scans || []));
  }, []);

  return (
    <section>
      <PageHeader eyebrow="Back issues" title="Archive">
        Previous scan runs, ordered newest first, with the market notes recorded at the time.
      </PageHeader>
      <div className="grid gap-4">
        {scans.length ? scans.map((scan) => (
          <article key={scan.id} className="border-t border-[var(--border)] py-6">
            <button className="grid w-full grid-cols-1 gap-4 text-left md:grid-cols-[1fr_auto]" onClick={() => setOpen(open === scan.id ? null : scan.id)}>
              <div>
                <div className="font-display text-3xl text-[var(--black)]">{formatDate(scan.triggered_at)}</div>
                <div className="mt-2 text-sm text-[var(--warm-gray)]">{scan.status}</div>
              </div>
              <div className="text-sm text-[var(--warm-gray)] md:text-right">
                <div>{scan.products_found} products found</div>
                <div>{scan.findings_count} findings</div>
              </div>
            </button>
            {open === scan.id && (
              <div className="mt-8 grid gap-7">
                {scan.findings?.length ? scan.findings.map((finding) => <FindingCard key={finding.id} finding={finding} />) : (
                  <div className="text-sm text-[var(--warm-gray)]">No findings recorded.</div>
                )}
              </div>
            )}
          </article>
        )) : <div className="border-t border-[var(--border)] py-8 text-sm text-[var(--warm-gray)]">No scans recorded yet.</div>}
      </div>
    </section>
  );
}

