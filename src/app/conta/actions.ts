"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileInput {
  full_name: string;
  phone: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string;
  shipping_postal_code: string;
  shipping_city: string;
}

interface Result {
  error?: string;
  ok?: boolean;
}

export async function updateProfile(input: ProfileInput): Promise<Result> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Precisas de ter sessão iniciada." };

  const clean = (v: string) => v.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: clean(input.full_name),
      phone: clean(input.phone),
      shipping_name: clean(input.shipping_name),
      shipping_line1: clean(input.shipping_line1),
      shipping_line2: clean(input.shipping_line2),
      shipping_postal_code: clean(input.shipping_postal_code),
      shipping_city: clean(input.shipping_city),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[guedias] erro ao atualizar perfil:", error.message);
    return { error: "Não foi possível guardar as alterações." };
  }

  revalidatePath("/conta");
  revalidatePath("/conta/perfil");
  return { ok: true };
}
