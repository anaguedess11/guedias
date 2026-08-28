"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { AuthMenu } from "@/components/AuthMenu";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/loja", label: "Loja" },
  { href: "/sobre", label: "Sobre" },
];

export function Header({
  user,
}: {
  user: { email: string; isAdmin: boolean } | null;
}) {
  const { totalQty, isHydrated } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-stone-25/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-500 font-display text-base font-bold text-white">
            G
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-stone-900">
            Guedias
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  active ? "text-clay-600" : "text-stone-900/70 hover:text-stone-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/admin") ? "text-clay-600" : "text-stone-900/70 hover:text-stone-900"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <AuthMenu user={user} />
          </div>

          <Link
            href="/carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            aria-label="Ver carrinho"
          >
            <CartIcon />
            {isHydrated && totalQty > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay-500 px-1 text-[11px] font-semibold text-white">
                {totalQty}
              </span>
            )}
          </Link>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-stone-25 md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900/80 hover:bg-black/5"
              >
                {link.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900/80 hover:bg-black/5"
              >
                Admin
              </Link>
            )}
            <div className="mt-1 flex flex-col gap-1 border-t border-black/5 pt-2">
              <AuthMenu user={user} variant="mobile" onNavigate={() => setOpen(false)} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="21" r="1.4" />
      <circle cx="18" cy="21" r="1.4" />
      <path d="M2.5 3h2.2l2.1 12.2a1.8 1.8 0 0 0 1.8 1.5h8.6a1.8 1.8 0 0 0 1.77-1.47l1.35-7.53H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
    </svg>
  );
}
