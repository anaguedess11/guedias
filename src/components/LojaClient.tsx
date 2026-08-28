"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/data/categories";
import { CategoryKey, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

type FilterKey = CategoryKey | "todos";

export function LojaClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("categoria") as FilterKey) || "todos";

  const [active, setActive] = useState<FilterKey>(
    categories.some((c) => c.key === initialCategory) ? initialCategory : "todos"
  );
  const [query, setQuery] = useState("");

  function selectCategory(key: FilterKey) {
    setActive(key);
    const params = new URLSearchParams(searchParams.toString());
    if (key === "todos") {
      params.delete("categoria");
    } else {
      params.set("categoria", key);
    }
    router.replace(`/loja${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = active === "todos" || p.category === active;
      const matchesQuery =
        query.trim().length === 0 ||
        p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        p.shortDescription.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [active, query]);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-xl">
        <p className="eyebrow">Loja</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
          Todos os produtos
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-900/60 sm:text-base">
          {products.length} peças impressas em 3D, organizadas por categoria.
          Explora, filtra e encontra o objeto certo para ti.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Chip label="Todos" active={active === "todos"} onClick={() => selectCategory("todos")} />
          {categories.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              active={active === c.key}
              onClick={() => selectCategory(c.key)}
            />
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar produtos…"
            className="input pl-9"
          />
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-900/35" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <p className="text-base font-medium text-stone-900">Sem resultados</p>
          <p className="max-w-xs text-sm text-stone-900/55">
            Não encontrámos produtos para esta pesquisa. Tenta outro termo ou categoria.
          </p>
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-clay-500 bg-clay-500 text-white"
          : "border-black/10 bg-white text-stone-900/70 hover:border-clay-500/40 hover:text-stone-900"
      }`}
    >
      {label}
    </button>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
