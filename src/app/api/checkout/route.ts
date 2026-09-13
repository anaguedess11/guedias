import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isPaymentMethod } from "@/lib/payment-details";
import { sendOrderReceivedEmail } from "@/lib/email";

const FREE_SHIPPING_THRESHOLD_CENTS = 3500;
const STANDARD_SHIPPING_CENTS = 390;
const EXPRESS_SHIPPING_CENTS = 790;

interface CheckoutItemInput {
  productId: string;
  qty: number;
  color: string;
  material: string;
  personalization?: string;
}

interface ShippingInput {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "A loja ainda não está configurada (Supabase em falta). Consulta o README.md." },
      { status: 503 }
    );
  }

  let body: {
    items?: CheckoutItemInput[];
    shippingMethod?: "standard" | "expresso";
    paymentMethod?: string;
    email?: string;
    shipping?: Partial<ShippingInput>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const items = body.items ?? [];
  const shippingMethod = body.shippingMethod === "expresso" ? "expresso" : "standard";

  if (items.length === 0) {
    return NextResponse.json({ error: "O carrinho está vazio." }, { status: 400 });
  }
  if (items.some((it) => !it.productId || !Number.isFinite(it.qty) || it.qty < 1 || it.qty > 20)) {
    return NextResponse.json({ error: "Item de carrinho inválido." }, { status: 400 });
  }

  if (!isPaymentMethod(body.paymentMethod)) {
    return NextResponse.json({ error: "Escolhe um método de pagamento válido." }, { status: 400 });
  }
  const paymentMethod = body.paymentMethod;

  const email = (body.email ?? "").trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Indica um email válido." }, { status: 400 });
  }

  const shipping = body.shipping ?? {};
  const shippingName = (shipping.name ?? "").trim();
  const line1 = (shipping.line1 ?? "").trim();
  const line2 = (shipping.line2 ?? "").trim();
  const postalCode = (shipping.postalCode ?? "").trim();
  const city = (shipping.city ?? "").trim();
  const phone = (shipping.phone ?? "").trim();

  if (!shippingName || !line1 || !postalCode || !city) {
    return NextResponse.json(
      { error: "Preenche o nome e a morada de envio completa." },
      { status: 400 }
    );
  }
  if (paymentMethod === "mbway" && !phone) {
    return NextResponse.json(
      { error: "Indica o número de telemóvel associado ao MB WAY." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const productIds = [...new Set(items.map((it) => it.productId))];
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, price_cents, colors, materials, customizable")
    .in("id", productIds);

  if (productsError || !products) {
    return NextResponse.json({ error: "Não foi possível validar os produtos." }, { status: 500 });
  }

  const productsById = new Map(products.map((p) => [p.id as string, p]));

  let subtotalCents = 0;
  const orderItems: Array<{
    product_id: string;
    name: string;
    price_cents: number;
    qty: number;
    color: string | null;
    material: string | null;
    personalization: string | null;
  }> = [];

  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 400 });
    }

    const colorNames = ((product.colors as { name: string }[]) ?? []).map((c) => c.name);
    if (colorNames.length > 0 && !colorNames.includes(item.color)) {
      return NextResponse.json({ error: `Cor inválida para ${product.name}.` }, { status: 400 });
    }
    const materials = (product.materials as string[]) ?? [];
    if (materials.length > 0 && !materials.includes(item.material)) {
      return NextResponse.json({ error: `Material inválido para ${product.name}.` }, { status: 400 });
    }
    const personalization = (item.personalization ?? "").trim();
    if (product.customizable && personalization.length === 0) {
      return NextResponse.json(
        { error: `Falta a personalização de ${product.name}.` },
        { status: 400 }
      );
    }

    subtotalCents += product.price_cents * item.qty;

    orderItems.push({
      product_id: product.id,
      name: product.name,
      price_cents: product.price_cents,
      qty: item.qty,
      color: item.color || null,
      material: item.material || null,
      personalization: personalization || null,
    });
  }

  const shippingCents =
    shippingMethod === "expresso"
      ? EXPRESS_SHIPPING_CENTS
      : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : STANDARD_SHIPPING_CENTS;

  const totalCents = subtotalCents + shippingCents;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      status: "pending",
      payment_method: paymentMethod,
      email,
      shipping_name: shippingName,
      shipping_address: { line1, line2: line2 || null, postal_code: postalCode, city },
      shipping_method: shippingMethod,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency: "eur",
      admin_notes: phone ? `Telefone: ${phone}` : null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("[guedias] erro ao gravar encomenda:", orderError?.message);
    return NextResponse.json({ error: "Não foi possível registar a encomenda." }, { status: 500 });
  }

  const itemsToInsert = orderItems.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await admin.from("order_items").insert(itemsToInsert);
  if (itemsError) {
    console.error("[guedias] erro ao gravar itens da encomenda:", itemsError.message);
  }

  await sendOrderReceivedEmail(
    {
      id: order.id,
      email,
      shipping_name: shippingName,
      shipping_address: { line1, line2, postal_code: postalCode, city },
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
    },
    orderItems,
    paymentMethod
  );

  return NextResponse.json({ orderId: order.id });
}
