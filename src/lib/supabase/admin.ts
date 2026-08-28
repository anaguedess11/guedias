import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/env";

/**
 * Cliente Supabase com a service role key — ignora Row Level Security.
 * NUNCA importar isto num componente cliente ("use client") nem expor
 * SUPABASE_SERVICE_ROLE_KEY com o prefixo NEXT_PUBLIC_. Usar apenas em
 * Route Handlers e código que corre exclusivamente no servidor (ex.:
 * o webhook do Stripe, que precisa de escrever encomendas ignorando RLS).
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase admin client não configurado: define NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
