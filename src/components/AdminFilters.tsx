"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface FilterSelect {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  /** Texto da opção "sem filtro" (por omissão "<label>: tudo"). */
  emptyLabel?: string;
}

interface Props {
  search?: { param: string; placeholder: string };
  selects?: FilterSelect[];
}

export function AdminFilters({ search, selects = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [term, setTerm] = useState(search ? params.get(search.param) ?? "" : "");

  function apply(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    apply(next);
  }

  // Pesquisa com debounce
  useEffect(() => {
    if (!search) return;
    const current = params.get(search.param) ?? "";
    if (term === current) return;
    const t = setTimeout(() => setParam(search.param, term.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  // Se a URL for limpa por fora, reflete no input
  useEffect(() => {
    if (search) setTerm(params.get(search.param) ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const activeCount =
    (selects.filter((s) => params.get(s.param)).length) + (search && params.get(search.param) ? 1 : 0);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2.5">
      {search && (
        <div className="relative min-w-[16rem] flex-1 sm:max-w-xs">
          <input
            className="input py-2.5 pl-9"
            placeholder={search.placeholder}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-900/40"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {selects.map((s) => {
        const value = params.get(s.param) ?? "";
        return (
          <select
            key={s.param}
            value={value}
            onChange={(e) => setParam(s.param, e.target.value)}
            className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              value
                ? "border-clay-500 bg-clay-50 text-clay-700"
                : "border-pine-900/15 bg-white text-stone-900/70 hover:border-pine-700/40"
            }`}
            aria-label={s.label}
          >
            <option value="">{s.emptyLabel ?? `${s.label}: tudo`}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {s.label}: {o.label}
              </option>
            ))}
          </select>
        );
      })}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setTerm("");
            router.replace(pathname, { scroll: false });
          }}
          className="text-xs font-medium text-stone-900/50 hover:text-red-600"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
