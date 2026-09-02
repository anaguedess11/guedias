"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Produtos", exact: true },
  { href: "/admin/encomendas", label: "Encomendas", exact: false },
  { href: "/admin/calculadora", label: "Calculadora", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-2 border-b border-black/5 pb-3">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? "bg-clay-500 text-white" : "text-stone-900/60 hover:bg-black/5"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
