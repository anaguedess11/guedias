"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { PrintedObject } from "@/components/PrintedObject";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import type { PaymentMethod } from "@/lib/payment-details";

const FREE_SHIPPING_THRESHOLD = 35;

type ShippingMethod = "standard" | "expresso";

interface ShippingForm {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
}

const EMPTY_SHIPPING: ShippingForm = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  postalCode: "",
  city: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mbway");
  const [email, setEmail] = useState("");
  const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      if (user.email) setEmail(user.email);
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, shipping_name, shipping_line1, shipping_line2, shipping_postal_code, shipping_city")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setShipping({
          name: data.shipping_name || data.full_name || "",
          phone: data.phone || "",
          line1: data.shipping_line1 || "",
          line2: data.shipping_line2 || "",
          postalCode: data.shipping_postal_code || "",
          city: data.shipping_city || "",
        });
      }
    });
  }, []);

  const shippingCost = useMemo(() => {
    if (shippingMethod === "expresso") return 7.9;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 3.9;
  }, [shippingMethod, subtotal]);

  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-stone-900">
          O teu carrinho está vazio
        </h1>
        <p className="mt-2 max-w-sm text-sm text-stone-900/55">
          Adiciona produtos ao carrinho antes de avançar para o checkout.
        </p>
        <Link href="/loja" className="btn-primary mt-6">
          Ir para a loja
        </Link>
      </div>
    );
  }

  function updateShipping<K extends keyof ShippingForm>(key: K, value: ShippingForm[K]) {
    setShipping((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingMethod,
          paymentMethod,
          email,
          shipping: {
            name: shipping.name,
            phone: shipping.phone,
            line1: shipping.line1,
            line2: shipping.line2,
            postalCode: shipping.postalCode,
            city: shipping.city,
          },
          items: items.map((it) => ({
            productId: it.productId,
            qty: it.qty,
            color: it.color,
            material: it.material,
            personalization: it.personalization,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.orderId) {
        setError(data.error ?? "Não foi possível registar a encomenda.");
        setLoading(false);
        return;
      }
      clear();
      router.push(`/checkout/confirmacao?order_id=${data.orderId}`);
    } catch {
      setError("Não foi possível ligar ao servidor.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="container-page py-10 sm:py-14">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
        Rever e confirmar
      </h1>
      <p className="mt-2 max-w-lg text-sm text-stone-900/55">
        Paga por MB WAY ou transferência bancária — sem cartão, sem plataformas de terceiros.
        Confirmamos assim que recebermos o pagamento.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="card flex gap-4 p-4">
                <PrintedObject
                  profile={item.profile}
                  color="#A97464"
                  className="h-20 w-20 shrink-0 rounded-xl"
                />
                <div className="flex flex-1 flex-col justify-center">
                  <p className="text-sm font-medium text-stone-900">{item.name}</p>
                  <p className="mt-0.5 text-xs text-stone-900/50">
                    {item.qty}× · {item.color} · {item.material}
                  </p>
                  {item.personalization && (
                    <p className="mt-0.5 text-xs italic text-stone-900/60">
                      “{item.personalization}”
                    </p>
                  )}
                </div>
                <span className="whitespace-nowrap text-sm font-medium text-stone-900">
                  {formatPrice(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="card space-y-3 p-6">
            <h2 className="text-sm font-semibold text-stone-900">Contacto</h2>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="card space-y-3 p-6">
            <h2 className="text-sm font-semibold text-stone-900">Morada de envio</h2>
            <div>
              <label className="label">Nome</label>
              <input
                required
                className="input"
                placeholder="Nome completo"
                value={shipping.name}
                onChange={(e) => updateShipping("name", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Telemóvel {paymentMethod === "mbway" && "(para o MB WAY)"}</label>
              <input
                required={paymentMethod === "mbway"}
                className="input"
                placeholder="9xx xxx xxx"
                value={shipping.phone}
                onChange={(e) => updateShipping("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Morada</label>
              <input
                required
                className="input"
                placeholder="Rua, número"
                value={shipping.line1}
                onChange={(e) => updateShipping("line1", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Morada (linha 2, opcional)</label>
              <input
                className="input"
                placeholder="Andar, apartamento…"
                value={shipping.line2}
                onChange={(e) => updateShipping("line2", e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Código postal</label>
                <input
                  required
                  className="input"
                  placeholder="0000-000"
                  value={shipping.postalCode}
                  onChange={(e) => updateShipping("postalCode", e.target.value)}
                />
              </div>
              <div className="flex-[2]">
                <label className="label">Localidade</label>
                <input
                  required
                  className="input"
                  placeholder="Cidade"
                  value={shipping.city}
                  onChange={(e) => updateShipping("city", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card space-y-3 p-6">
            <h2 className="text-sm font-semibold text-stone-900">Método de envio</h2>
            <RadioCard
              selected={shippingMethod === "standard"}
              onSelect={() => setShippingMethod("standard")}
              title="Envio normal (3-5 dias úteis)"
              description={subtotal >= FREE_SHIPPING_THRESHOLD ? "Grátis para esta encomenda" : formatPrice(3.9)}
            />
            <RadioCard
              selected={shippingMethod === "expresso"}
              onSelect={() => setShippingMethod("expresso")}
              title="Envio expresso (1-2 dias úteis)"
              description={formatPrice(7.9)}
            />
          </div>

          <div className="card space-y-3 p-6">
            <h2 className="text-sm font-semibold text-stone-900">Método de pagamento</h2>
            <RadioCard
              selected={paymentMethod === "mbway"}
              onSelect={() => setPaymentMethod("mbway")}
              title="MB WAY"
              description="Enviamos-te o nosso número — pagas tu, pela tua app MB WAY."
            />
            <RadioCard
              selected={paymentMethod === "transferencia"}
              onSelect={() => setPaymentMethod("transferencia")}
              title="Transferência bancária"
              description="Enviamos-te o IBAN e a referência a usar na transferência."
            />
            <p className="pt-1 text-xs text-stone-900/45">
              A encomenda fica reservada assim que confirmamos a receção do pagamento.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link href="/carrinho" className="btn-ghost">
              ← Voltar ao carrinho
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "A confirmar…" : "Confirmar encomenda"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h2 className="text-sm font-semibold text-stone-900">Resumo</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-stone-900/65">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-900/65">
                <span>Envio</span>
                <span>{shippingCost === 0 ? "Grátis" : formatPrice(shippingCost)}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-black/5 pt-4 font-display text-base font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function RadioCard({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
        selected ? "border-clay-500 bg-clay-50" : "border-black/10 hover:border-black/20"
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-stone-900">{title}</span>
        <span className="block text-xs text-stone-900/50">{description}</span>
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-clay-500" : "border-black/20"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-clay-500" />}
      </span>
    </button>
  );
}
