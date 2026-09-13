"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

// Singleton: cada chamada a createBrowserClient() cria uma nova instância do
// GoTrueClient, e várias instâncias em simultâneo (ex.: Header + Favoritos,
// que montam em todas as páginas) competem pelo mesmo Web Lock do token de
// sessão — o que faz operações como signOut() falharem silenciosamente com
// "NavigatorLockAcquireTimeoutError". Reutilizar sempre o mesmo cliente evita
// essa disputa.
let client: SupabaseClient | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
