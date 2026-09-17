import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Filament } from "@/lib/types";

interface FilamentRow {
  id: string;
  name: string;
  brand: string | null;
  color: string;
  material: string;
  price_per_kg_cents: number;
  notes: string | null;
  created_at: string;
}

const SELECT_COLUMNS = "id, name, brand, color, material, price_per_kg_cents, notes, created_at";

function mapRow(row: FilamentRow): Filament {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    color: row.color,
    material: row.material,
    pricePerKg: row.price_per_kg_cents / 100,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function getAllFilaments(): Promise<Filament[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("filaments")
    .select(SELECT_COLUMNS)
    .order("name", { ascending: true });
  if (error) {
    console.error("[guedias] erro ao carregar filamentos:", error.message);
    return [];
  }
  return (data as FilamentRow[]).map(mapRow);
}

export async function getFilamentById(id: string): Promise<Filament | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("filaments")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as FilamentRow);
}
