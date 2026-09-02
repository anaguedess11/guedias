"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthMenu({
  user,
  variant = "desktop",
  onNavigate,
}: {
  user: { email: string } | null;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    onNavigate?.();
    window.location.assign("/");
  }

  if (variant === "mobile") {
    return user ? (
      <>
        <Link
          href="/conta"
          onClick={onNavigate}
          className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900/80 hover:bg-black/5"
        >
          A minha conta
        </Link>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-stone-900/50 hover:bg-black/5"
        >
          Sair
        </button>
      </>
    ) : (
      <Link
        href="/conta/entrar"
        onClick={onNavigate}
        className="rounded-lg px-3 py-2.5 text-sm font-medium text-stone-900/80 hover:bg-black/5"
      >
        Entrar
      </Link>
    );
  }

  if (!user) {
    return (
      <Link href="/conta/entrar" className="text-sm font-medium text-stone-900/70 hover:text-stone-900">
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/conta" className="text-sm font-medium text-stone-900/70 hover:text-stone-900">
        A minha conta
      </Link>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="text-sm text-stone-900/45 hover:text-stone-900"
      >
        Sair
      </button>
    </div>
  );
}
