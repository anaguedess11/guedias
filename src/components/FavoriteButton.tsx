"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/components/FavoritesProvider";

export function FavoriteButton({
  productId,
  variant = "overlay",
}: {
  productId: string;
  /** "overlay" — botão redondo sobre a imagem; "inline" — com etiqueta de texto */
  variant?: "overlay" | "inline";
}) {
  const { isFavorite, toggle } = useFavorites();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const fav = isFavorite(productId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const ok = await toggle(productId);
    setBusy(false);
    if (!ok) router.push("/conta/entrar");
  }

  const heart = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={fav ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      className={fav ? "text-red-500 transition-colors" : "transition-colors"}
      aria-hidden
    >
      <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c1.9 0 3.2 1 3.9 2 .1.1.3.1.4 0 .7-1 2-2 3.9-2 3 0 4.5 3 3 6-2.5 4.15-9.5 8.5-9.5 8.5z" />
    </svg>
  );

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={fav}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
          fav
            ? "border-red-200 bg-red-50 text-stone-900"
            : "border-pine-900/15 bg-white text-stone-900/70 hover:border-clay-500/40"
        }`}
      >
        {heart}
        {fav ? "Nos favoritos" : "Adicionar aos favoritos"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={fav}
      className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-900/55 shadow-soft backdrop-blur transition-colors hover:text-red-500 disabled:opacity-60"
    >
      {heart}
    </button>
  );
}
