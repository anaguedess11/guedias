"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { CalculatorSettingsWriteInput, FilamentWriteInput } from "@/lib/types";

interface ActionResult {
  error?: string;
  id?: string;
}

function validateFilament(input: FilamentWriteInput): string | null {
  if (!input.name.trim()) return "O nome é obrigatório.";
  if (!input.color.trim()) return "A cor é obrigatória.";
  if (!input.material.trim()) return "O tipo de material é obrigatório.";
  if (!Number.isFinite(input.price_per_kg_cents) || input.price_per_kg_cents <= 0) {
    return "O preço por kg tem de ser maior que zero.";
  }
  return null;
}

export async function createFilament(input: FilamentWriteInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const validationError = validateFilament(input);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const { data, error } = await supabase.from("filaments").insert(input).select("id").single();

  if (error || !data) {
    console.error("[guedias] erro ao criar filamento:", error?.message);
    return { error: "Não foi possível guardar o filamento." };
  }

  revalidatePath("/admin/filamentos");
  revalidatePath("/admin/calculadora");

  return { id: data.id };
}

export async function updateFilament(id: string, input: FilamentWriteInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const validationError = validateFilament(input);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const { error } = await supabase.from("filaments").update(input).eq("id", id);

  if (error) {
    console.error("[guedias] erro ao editar filamento:", error.message);
    return { error: "Não foi possível guardar o filamento." };
  }

  revalidatePath("/admin/filamentos");
  revalidatePath("/admin/calculadora");

  return { id };
}

export async function deleteFilament(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const supabase = createClient();
  const { error } = await supabase.from("filaments").delete().eq("id", id);

  if (error) {
    console.error("[guedias] erro ao apagar filamento:", error.message);
    return { error: "Não foi possível apagar o filamento." };
  }

  revalidatePath("/admin/filamentos");
  revalidatePath("/admin/calculadora");

  return {};
}

export async function saveCalculatorSettings(
  input: CalculatorSettingsWriteInput
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  if (!Number.isFinite(input.machine_rate_cents) || input.machine_rate_cents < 0) {
    return { error: "A taxa de máquina tem de ser maior ou igual a zero." };
  }
  if (!Number.isFinite(input.labor_rate_cents) || input.labor_rate_cents < 0) {
    return { error: "A taxa do teu trabalho tem de ser maior ou igual a zero." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("calculator_settings")
    .upsert({ id: "default", ...input, updated_at: new Date().toISOString() });

  if (error) {
    console.error("[guedias] erro ao guardar configurações da calculadora:", error.message);
    return { error: "Não foi possível guardar as configurações." };
  }

  revalidatePath("/admin/filamentos");
  revalidatePath("/admin/calculadora");

  return {};
}
