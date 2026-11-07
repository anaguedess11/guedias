"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCustomRequestStatus } from "@/lib/custom-requests";

interface ActionResult {
  error?: string;
}

export async function updateCustomRequestStatus(id: string, status: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };
  if (!isCustomRequestStatus(status)) return { error: "Estado inválido." };

  const { error } = await createAdminClient().from("custom_requests").update({ status }).eq("id", id);
  if (error) {
    console.error("[guedias] erro ao atualizar ideia:", error.message);
    return { error: "Não foi possível atualizar o estado." };
  }

  revalidatePath("/admin/ideias");
  return {};
}

export async function deleteCustomRequest(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const supabase = createAdminClient();
  const { data } = await supabase.from("custom_requests").select("image_paths").eq("id", id).maybeSingle();
  if (!data) return { error: "Ideia não encontrada." };

  const { error } = await supabase.from("custom_requests").delete().eq("id", id);
  if (error) {
    console.error("[guedias] erro ao apagar ideia:", error.message);
    return { error: "Não foi possível apagar a ideia." };
  }

  const paths = (data.image_paths as string[]) ?? [];
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("custom-request-images").remove(paths);
    if (storageError) console.error("[guedias] erro ao apagar imagens de ideia:", storageError.message);
  }

  revalidatePath("/admin/ideias");
  return {};
}
