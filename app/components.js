"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [lastScan, setLastScan] = useState(null);
  const links = [
    ["/intelligence", "Intelligence"],
    ["/scan", "Weekly scan"],
    ["/archive", "Archive"],
    ["/market-responses", "Market responses"],
  ];

  useEffect(() => {
    fetch("/api/scan/latest")
      .then((res) => res.json())
      .then((data) => setLastScan(data.scan))
      .catch(() => setLastScan(null));
  }, [pathname]);

  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-[220px] md:flex-col md:border-r md:border-[var(--border)] md:bg-[var(--cream)] md:px-8 md:py-10">
        <Link href="/intelligence" className="font-display text-3xl leading-none text-[var(--black)]">
          DUPE ECONOMY
        </Link>
        <div className="my-8 h-px w-10 bg-[var(--border)]" />
        <nav className="flex flex-col gap-4 text-sm">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "text-[var(--gold)]" : "text-[var(--black)] hover:text-[var(--gold)]"}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-[var(--border)] pt-6 text-[11px] uppercase tracking-[0.12em] text-[var(--warm-gray)]">
          Last scan: {lastScan?.completed_at ? formatDate(lastScan.completed_at) : "none"}
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--cream)] px-5 py-4 md:hidden">
        <Link href="/intelligence" className="font-display text-2xl text-[var(--black)]">
          DUPE ECONOMY
        </Link>
        <Link href="/scan" className="text-xs uppercase tracking-[0.12em] text-[var(--gold)]">
          Scan
        </Link>
      </header>
    </>
  );
}

export function StatusDot({ status }) {
  const color = status === "acquired" ? "bg-[var(--gold)]" : status === "active" ? "bg-[var(--black)]" : "bg-[var(--warm-gray)]";
  return <span className={`mt-2 block h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

export function CategoryLabel({ children }) {
  if (!children) return null;
  return <div className="category-label">{children}</div>;
}

export function ProductRow({ product }) {
  const [open, setOpen] = useState(false);
  const differential = useMemo(() => {
    if (!product.price_original || !product.price_dupe) return null;
    return Math.round(((product.price_original - product.price_dupe) / product.price_original) * 100);
  }, [product.price_original, product.price_dupe]);

  return (
    <article className="border-t border-[var(--border)] py-7">
      <button className="grid w-full grid-cols-[18px_1fr_auto] gap-4 text-left" onClick={() => setOpen(!open)}>
        <StatusDot status={product.status} />
        <div>
          <CategoryLabel>{product.category}</CategoryLabel>
          <div className="mt-2 font-display text-lg text-[var(--warm-gray)]">{product.brand}</div>
          <div className="font-display text-3xl leading-tight text-[var(--black)]">{product.name}</div>
          <div className="mt-4 grid grid-cols-[22px_1fr] gap-3">
            <span className="text-[var(--warm-gray)]">-&gt;</span>
            <div>
              <div className="text-sm text-[var(--warm-gray)]">{product.dupe_brand || "Alternative signal pending"}</div>
              <div className="text-base text-[var(--black)]">{product.dupe_product || "No named alternative recorded"}</div>
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-[var(--black)]">
          {differential === null ? "n/a" : `${differential}%`}
          {product.discovered_by === "scan" && <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[var(--warm-gray)]">discovered</div>}
        </div>
      </button>
      {open && (
        <div className="ml-[34px] mt-5 grid gap-3 border-l border-[var(--border)] pl-5 text-sm text-[var(--warm-gray)] md:grid-cols-3">
          <Detail label="Viral driver" value={product.viral_driver} />
          <Detail label="T0" value={product.t0_date} />
          <Detail label="Notes" value={product.notes || (product.discovered_by === "scan" ? "Discovered by scan." : "")} />
        </div>
      )}
    </article>
  );
}

export function FindingCard({ finding }) {
  return (
    <article className="border-l border-[var(--gold)] py-1 pl-5">
      <CategoryLabel>{finding.type}</CategoryLabel>
      <h3 className="mt-2 font-display text-2xl leading-tight text-[var(--black)]">{finding.headline}</h3>
      {finding.significance && <p className="mt-3 text-sm leading-6 text-[var(--warm-gray)]">{finding.significance}</p>}
      {finding.source && <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[var(--warm-gray)]">{finding.source}</div>}
    </article>
  );
}

export function MarketResponse({ response }) {
  return (
    <article className="border-l-2 border-[var(--gold)] py-1 pl-5">
      <h3 className="font-display text-2xl leading-tight text-[var(--black)]">
        {response.responding_brand || "Unknown"} -&gt; {response.appears_to_mirror || "Unspecified"}
      </h3>
      <div className="mt-2 text-sm text-[var(--warm-gray)]">
        {response.estimated_lag_months || response.estimated_lag_months === 0 ? `${response.estimated_lag_months} month lag` : "Lag unknown"}
        {response.category ? ` / ${response.category}` : ""}
      </div>
      {response.significance && <p className="mt-3 text-sm leading-6 text-[var(--warm-gray)]">{response.significance}</p>}
    </article>
  );
}

export function PageHeader({ eyebrow, title, children }) {
  return (
    <header className="mb-10 border-b border-[var(--border)] pb-8">
      <CategoryLabel>{eyebrow}</CategoryLabel>
      <h1 className="mt-3 font-display text-5xl leading-none text-[var(--black)] md:text-7xl">{title}</h1>
      {children && <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--warm-gray)]">{children}</p>}
    </header>
  );
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value.replace(" ", "T") + "Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Detail({ label, value }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.12em]">{label}</div>
      <div className="mt-1 text-[var(--black)]">{value || "Not recorded"}</div>
    </div>
  );
}

