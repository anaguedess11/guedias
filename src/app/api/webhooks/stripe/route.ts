import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// O corpo tem de chegar em bruto (não interpretado) para a verificação de
// assinatura do Stripe funcionar — por isso lemos com request.text().
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[guedias] assinatura de webhook inválida:", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  const sessionSummary = event.data.object as Stripe.Checkout.Session;

  const session = await stripe.checkout.sessions.retrieve(sessionSummary.id, {
    expand: ["line_items", "payment_intent"],
  });

  const finalized = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  if (!finalized) {
    // Método de pagamento diferido (ex: referência Multibanco) ainda por confirmar.
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, orderId: existing.id });
  }

  const lineItems = session.line_items?.data ?? [];
  const productLines = lineItems.filter((li) => li.metadata?.product_id);
  const shippingLine = lineItems.find((li) => !li.metadata?.product_id);

  const productIds = [...new Set(productLines.map((li) => li.metadata!.product_id))];
  const { data: dbProducts } = await admin.from("products").select("id, name").in("id", productIds);
  const nameById = new Map((dbProducts ?? []).map((p) => [p.id as string, p.name as string]));

  const subtotalCents = productLines.reduce(
    (sum, li) => sum + (li.price?.unit_amount ?? 0) * (li.quantity ?? 1),
    0
  );
  const shippingCents = shippingLine?.price?.unit_amount ?? 0;
  const totalCents = session.amount_total ?? subtotalCents + shippingCents;

  const shippingDetails = session.collected_information?.shipping_details;
  const customerDetails = session.customer_details;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const userId = session.metadata?.user_id || null;
  const shippingMethod = session.metadata?.shipping_method ?? shippingLine?.metadata?.shipping_method ?? null;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent: paymentIntentId,
      status: "paid",
      email: customerDetails?.email ?? null,
      shipping_name: shippingDetails?.name ?? customerDetails?.name ?? null,
      shipping_address: shippingDetails?.address ?? customerDetails?.address ?? null,
      shipping_method: shippingMethod,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency: session.currency ?? "eur",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[guedias] erro ao gravar encomenda:", orderError?.message);
    return NextResponse.json({ error: "Erro ao gravar encomenda." }, { status: 500 });
  }

  if (productLines.length > 0) {
    const orderItems = productLines.map((li) => ({
      order_id: order.id,
      product_id: li.metadata!.product_id,
      name: nameById.get(li.metadata!.product_id) ?? "Produto",
      price_cents: li.price?.unit_amount ?? 0,
      qty: li.quantity ?? 1,
      color: li.metadata?.color || null,
      material: li.metadata?.material || null,
      personalization: li.metadata?.personalization || null,
    }));

    const { error: itemsError } = await admin.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("[guedias] erro ao gravar itens da encomenda:", itemsError.message);
    }
  }

  return NextResponse.json({ received: true, orderId: order.id });
}
