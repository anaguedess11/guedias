"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { sendOrderConfirmationEmail, sendOrderStatusEmail, type EmailOrder } from "@/lib/email";

type FulfillmentStatus = "not_started" | "in_production" | "shipped" | "delivered";

interface ActionResult {
  error?: string;
  ok?: boolean;
}

const ORDER_EMAIL_COLUMNS =
  "id, email, shipping_name, shipping_address, subtotal_cents, shipping_cents, total_cents";

function revalidateOrder(orderId: string) {
  revalidatePath("/admin/encomendas");
  revalidatePath(`/admin/encomendas/${orderId}`);
  revalidatePath("/conta");
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

  revalidateOrder(orderId);

  if (status === "in_production" || status === "shipped" || status === "delivered") {
    await sendOrderStatusEmail(order, status);
  }

  return { ok: true };
}

export async function saveOrderNotes(orderId: string, notes: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({ admin_notes: notes.trim() || null })
    .eq("id", orderId);

  if (error) {
    console.error("[guedias] erro ao guardar notas da encomenda:", error.message);
    return { error: "Não foi possível guardar as notas." };
  }

  revalidateOrder(orderId);
  return { ok: true };
}

export interface ShippingInput {
  shipping_name: string;
  line1: string;
  line2: string;
  postal_code: string;
  city: string;
}

export async function updateOrderShipping(
  orderId: string,
  input: ShippingInput
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  if (!input.shipping_name.trim()) return { error: "O nome é obrigatório." };
  if (!input.line1.trim() || !input.city.trim() || !input.postal_code.trim()) {
    return { error: "Morada, código postal e localidade são obrigatórios." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({
      shipping_name: input.shipping_name.trim(),
      shipping_address: {
        line1: input.line1.trim(),
        line2: input.line2.trim() || null,
        postal_code: input.postal_code.trim(),
        city: input.city.trim(),
      },
    })
    .eq("id", orderId);

  if (error) {
    console.error("[guedias] erro ao atualizar morada da encomenda:", error.message);
    return { error: "Não foi possível atualizar a morada." };
  }

  revalidateOrder(orderId);
  return { ok: true };
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { error: "Encomenda não encontrada." };
  if (order.status === "refunded") {
    return { error: "Esta encomenda já foi reembolsada." };
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "canceled" })
    .eq("id", orderId);

  if (error) {
    console.error("[guedias] erro ao cancelar encomenda:", error.message);
    return { error: "Não foi possível cancelar a encomenda." };
  }

  revalidateOrder(orderId);
  return { ok: true };
}

export async function refundOrder(
  orderId: string,
  amountCents?: number
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  if (!isStripeConfigured) {
    return { error: "O Stripe não está configurado — não é possível reembolsar." };
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total_cents, refunded_cents, stripe_payment_intent")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { error: "Encomenda não encontrada." };
  if (order.status !== "paid" && order.status !== "canceled") {
    return { error: "Só é possível reembolsar encomendas pagas." };
  }
  if (!order.stripe_payment_intent) {
    return { error: "Esta encomenda não tem um pagamento Stripe associado." };
  }

  const remaining = order.total_cents - (order.refunded_cents ?? 0);
  if (remaining <= 0) return { error: "Esta encomenda já foi totalmente reembolsada." };

  const amount = amountCents && amountCents > 0 ? Math.min(Math.round(amountCents), remaining) : remaining;

  try {
    await getStripe().refunds.create({
      payment_intent: order.stripe_payment_intent,
      amount,
    });
  } catch (err) {
    console.error("[guedias] erro ao reembolsar no Stripe:", err);
    return { error: "O Stripe recusou o reembolso. Verifica o painel do Stripe." };
  }

  const newRefunded = (order.refunded_cents ?? 0) + amount;
  const { error } = await supabase
    .from("orders")
    .update({
      refunded_cents: newRefunded,
      status: newRefunded >= order.total_cents ? "refunded" : order.status,
    })
    .eq("id", orderId);

  if (error) {
    console.error("[guedias] reembolso feito no Stripe mas erro ao gravar:", error.message);
    return { error: "Reembolso feito no Stripe, mas não foi possível atualizar a encomenda." };
  }

  revalidateOrder(orderId);
  return { ok: true };
}

export async function resendConfirmationEmail(orderId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Sem permissões de administração." };

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select(`${ORDER_EMAIL_COLUMNS}, order_items(name, qty, price_cents, color, material, personalization)`)
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { error: "Encomenda não encontrada." };
  if (!order.email) return { error: "Esta encomenda não tem email de cliente." };

  const { order_items, ...emailOrder } = order as EmailOrder & {
    order_items: {
      name: string;
      qty: number;
      price_cents: number;
      color: string | null;
      material: string | null;
      personalization: string | null;
    }[];
  };

  await sendOrderConfirmationEmail(emailOrder, order_items ?? []);

  return { ok: true };
}
