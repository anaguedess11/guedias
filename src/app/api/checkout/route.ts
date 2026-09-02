import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSiteUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

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

export async function POST(request: Request) {
  if (!isSupabaseConfigured || !isStripeConfigured) {
    return NextResponse.json(
      {
        error:
          "A loja ainda não está configurada (Supabase e/ou Stripe em falta). Consulta o README.md.",
      },
      { status: 503 }
    );
  }

  let body: { items?: CheckoutItemInput[]; shippingMethod?: "standard" | "expresso" };
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

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select(
          "full_name, phone, shipping_name, shipping_line1, shipping_line2, shipping_postal_code, shipping_city, stripe_customer_id"
        )
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const productIds = [...new Set(items.map((it) => it.productId))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price_cents, colors, materials, customizable")
    .in("id", productIds);

  if (productsError || !products) {
    return NextResponse.json({ error: "Não foi possível validar os produtos." }, { status: 500 });
  }

  const productsById = new Map(products.map((p) => [p.id as string, p]));

  let subtotalCents = 0;
  const lineItems: Array<{
    quantity: number;
    metadata: Record<string, string>;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description?: string; metadata: Record<string, string> };
    };
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

    lineItems.push({
      quantity: item.qty,
      metadata: {
        product_id: product.id,
        color: item.color,
        material: item.material,
        personalization,
      },
      price_data: {
        currency: "eur",
        unit_amount: product.price_cents,
        product_data: {
          name: product.name,
          description: [item.color, item.material].filter(Boolean).join(" · ") || undefined,
          metadata: {
            product_id: product.id,
            color: item.color,
            material: item.material,
            personalization,
          },
        },
      },
    });
  }

  const shippingCents =
    shippingMethod === "expresso"
      ? EXPRESS_SHIPPING_CENTS
      : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : STANDARD_SHIPPING_CENTS;

  lineItems.push({
    quantity: 1,
    metadata: { shipping_method: shippingMethod },
    price_data: {
      currency: "eur",
      unit_amount: shippingCents,
      product_data: {
        name:
          shippingMethod === "expresso"
            ? "Envio expresso (1-2 dias úteis)"
            : `Envio normal (3-5 dias úteis)${shippingCents === 0 ? " — grátis" : ""}`,
        metadata: {},
      },
    },
  });

  const siteUrl = getSiteUrl();
  const stripe = getStripe();

  // Cliente Stripe reutilizável — permite pré-preencher a morada guardada
  // no perfil quando o cliente chega ao checkout do Stripe.
  let customerId: string | undefined;
  if (user) {
    try {
      const hasAddress = Boolean(
        profile?.shipping_line1 && profile?.shipping_postal_code && profile?.shipping_city
      );
      const shipping = hasAddress
        ? {
            name: profile!.shipping_name || profile!.full_name || user.email || "Cliente",
            address: {
              line1: profile!.shipping_line1 as string,
              line2: (profile!.shipping_line2 as string) || undefined,
              postal_code: profile!.shipping_postal_code as string,
              city: profile!.shipping_city as string,
              country: "PT",
            },
          }
        : undefined;

      customerId = profile?.stripe_customer_id ?? undefined;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: profile?.full_name || undefined,
          phone: profile?.phone || undefined,
          shipping,
        });
        customerId = customer.id;
        await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
      } else if (shipping) {
        await stripe.customers.update(customerId, {
          shipping,
          phone: profile?.phone || undefined,
        });
      }
    } catch (err) {
      console.error("[guedias] não foi possível preparar o cliente Stripe:", err);
      customerId = undefined; // segue com customer_email
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["PT"] },
      ...(customerId ? { customer: customerId } : { customer_email: user?.email }),
      locale: "pt",
      success_url: `${siteUrl}/checkout/confirmacao?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
      metadata: {
        user_id: user?.id ?? "",
        shipping_method: shippingMethod,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Não foi possível iniciar o pagamento." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[guedias] erro Stripe:", err);
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento." }, { status: 500 });
  }
}
