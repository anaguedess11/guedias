import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CalculatorSettings } from "@/lib/types";

export const DEFAULT_CALCULATOR_SETTINGS: CalculatorSettings = {
  machineRate: 0.5,
  laborRate: 12,
  failureRatePercent: 8,
  feePercent: 1.5,
  feeFixed: 0.25,
  vatPercent: 23,
  vatEnabled: false,
};

interface SettingsRow {
  machine_rate_cents: number;
  labor_rate_cents: number;
  failure_reserve_percent: number;
  fee_percent: number;
  fee_fixed_cents: number;
  vat_percent: number;
  vat_enabled: boolean;
}

const SELECT_COLUMNS =
  "machine_rate_cents, labor_rate_cents, failure_reserve_percent, fee_percent, fee_fixed_cents, vat_percent, vat_enabled";

function mapRow(row: SettingsRow): CalculatorSettings {
  return {
    machineRate: row.machine_rate_cents / 100,
    laborRate: row.labor_rate_cents / 100,
    failureRatePercent: Number(row.failure_reserve_percent),
    feePercent: Number(row.fee_percent),
    feeFixed: row.fee_fixed_cents / 100,
    vatPercent: Number(row.vat_percent),
    vatEnabled: row.vat_enabled,
  };
}

export async function getCalculatorSettings(): Promise<CalculatorSettings> {
  if (!isSupabaseConfigured) return DEFAULT_CALCULATOR_SETTINGS;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("calculator_settings")
    .select(SELECT_COLUMNS)
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return DEFAULT_CALCULATOR_SETTINGS;
  return mapRow(data as SettingsRow);
}
