import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SavedCalculation } from "@/lib/types";

interface SavedCalculationRow {
  id: string;
  name: string;
  filament_id: string | null;
  inputs: Record<string, unknown>;
  total_cost_cents: number;
  suggested_price_cents: number;
  profit_cents: number;
  margin_percent: number;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  "id, name, filament_id, inputs, total_cost_cents, suggested_price_cents, profit_cents, margin_percent, created_at, updated_at";

function mapRow(row: SavedCalculationRow): SavedCalculation {
  return {
    id: row.id,
    name: row.name,
    filamentId: row.filament_id,
    inputs: row.inputs ?? {},
    totalCost: row.total_cost_cents / 100,
    suggestedPrice: row.suggested_price_cents / 100,
    profit: row.profit_cents / 100,
    marginPercent: Number(row.margin_percent),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllSavedCalculations(): Promise<SavedCalculation[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_calculations")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[guedias] erro ao carregar cálculos guardados:", error.message);
    return [];
  }
  return (data as SavedCalculationRow[]).map(mapRow);
}
