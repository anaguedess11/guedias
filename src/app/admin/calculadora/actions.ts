"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { SavedCalculationWriteInput } from "@/lib/types";

interface ActionResult {
  error?: string;
  id?: string;
}

function validate(input: SavedCalculationWriteInput): string | null {
  if (!input.name.trim()) return "Dá um nome ao cálculo.";
  return null;
}

export async function createSavedCalculation(
  input: SavedCalculationWriteInput
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("saved_calculations")
    .insert(input)
    .select("id")
    .single();

  if (error || !data) {
    console.error("[guedias] erro ao guardar cálculo:", error?.message);
    return { error: "Não foi possível guardar o cálculo." };
  }

  revalidatePath("/admin/calculadora");
  revalidatePath("/admin/produtos");

  return { id: data.id };
}

export async function updateSavedCalculation(
  id: string,
  input: SavedCalculationWriteInput
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const validationError = validate(input);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const { error } = await supabase
    .from("saved_calculations")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[guedias] erro ao editar cálculo:", error.message);
    return { error: "Não foi possível guardar o cálculo." };
  }

  revalidatePath("/admin/calculadora");
  revalidatePath("/admin/produtos");

  return { id };
}

export async function deleteSavedCalculation(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const supabase = createClient();
  const { error } = await supabase.from("saved_calculations").delete().eq("id", id);

  if (error) {
    console.error("[guedias] erro ao apagar cálculo:", error.message);
    return { error: "Não foi possível apagar o cálculo." };
  }

  revalidatePath("/admin/calculadora");
  revalidatePath("/admin/produtos");

  return {};
}
