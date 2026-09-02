"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FavoritesContextValue {
  ready: boolean;
  loggedIn: boolean;
  ids: Set<string>;
  isFavorite: (productId: string) => boolean;
  /** Alterna o favorito. Devolve false se o utilizador não tiver sessão. */
  toggle: (productId: string) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setLoggedIn(false);
        setReady(true);
        return;
      }
      setLoggedIn(true);
      const { data } = await supabase.from("favorites").select("product_id");
      if (!active) return;
      setIds(new Set((data ?? []).map((r) => r.product_id as string)));
      setReady(true);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isFavorite = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const wasFav = ids.has(productId);
      // Otimista
      setIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(productId);
        else next.add(productId);
        return next;
      });

      const { error } = wasFav
        ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId)
        : await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });

      if (error) {
        // Reverte
        setIds((prev) => {
          const next = new Set(prev);
          if (wasFav) next.add(productId);
          else next.delete(productId);
          return next;
        });
      }
      return true;
    },
    [ids]
  );

  const value = useMemo(
    () => ({ ready, loggedIn, ids, isFavorite, toggle }),
    [ready, loggedIn, ids, isFavorite, toggle]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de <FavoritesProvider>");
  return ctx;
}
