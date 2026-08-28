"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderStatusEmail } from "@/lib/email";

type FulfillmentStatus = "not_started" | "in_production" | "shipped" | "delivered";

interface ActionResult {
  error?: string;
}

export async function updateOrderFulfillment(
  orderId: string,
  status: FulfillmentStatus
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const supabase = createAdminClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, email, shipping_name, shipping_address, subtotal_cents, shipping_cents, total_cents, status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !order) {
    return { error: "Encomenda não encontrada." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ fulfillment_status: status })
    .eq("id", orderId);

  if (error) {
    console.error("[guedias] erro ao atualizar estado da encomenda:", error.message);
    return { error: "Não foi possível atualizar o estado." };
  }

  revalidatePath("/admin/encomendas");
  revalidatePath("/conta");

  if (status === "in_production" || status === "shipped" || status === "delivered") {
    await sendOrderStatusEmail(order, status);
  }

  return {};
}
