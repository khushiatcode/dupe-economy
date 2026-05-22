"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, ProductRow } from "../components";

const categories = ["all", "fashion", "makeup", "skincare", "haircare"];

export default function IntelligencePage() {
  const [active, setActive] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = active === "all" ? "" : `?category=${active}`;
    fetch(`/api/products${query}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, [active]);

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => priceDiff(b) - priceDiff(a));
  }, [products]);

  return (
    <section>
      <PageHeader eyebrow="Open intelligence" title="Intelligence">
        Live and seeded signals across the dupe pipeline, sorted by observed price differential.
      </PageHeader>
      <div className="mb-8 flex flex-wrap gap-5 text-sm">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActive(category)}
            className={`capitalize ${active === category ? "border-b border-[var(--gold)] text-[var(--black)]" : "text-[var(--warm-gray)]"}`}
          >
            {category}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="border-t border-[var(--border)] py-8 text-sm text-[var(--warm-gray)]">Loading products...</div>
      ) : (
        <div>{sorted.map((product) => <ProductRow key={product.id} product={product} />)}</div>
      )}
    </section>
  );
}

function priceDiff(product) {
  if (!product.price_original || !product.price_dupe) return 0;
  return ((product.price_original - product.price_dupe) / product.price_original) * 100;
}

