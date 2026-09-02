"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { PrintedObject } from "@/components/PrintedObject";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";

const FREE_SHIPPING_THRESHOLD = 35;

type ShippingMethod = "standard" | "expresso";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAddress, setSavedAddress] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("shipping_name, shipping_line1, shipping_line2, shipping_postal_code, shipping_city")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.shipping_line1) {
        setSavedAddress(
          [
            data.shipping_name,
            data.shipping_line1,
            data.shipping_line2,
            [data.shipping_postal_code, data.shipping_city].filter(Boolean).join(" "),
          ]
            .filter(Boolean)
            .join(", ")
        );
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

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingMethod,
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
      if (!res.ok || !data.url) {
        setError(data.error ?? "Não foi possível iniciar o pagamento.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Não foi possível ligar ao servidor de pagamentos.");
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
        Rever e pagar
      </h1>
      <p className="mt-2 max-w-lg text-sm text-stone-900/55">
        Confirma os artigos e a morada e o pagamento é feito na página segura do Stripe — nós
        nunca vemos nem guardamos os dados do teu cartão.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key} className="card flex gap-4 p-4">
                <PrintedObject
                  profile={item.profile}
                  color="#C7430F"
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

          {savedAddress && (
            <div className="card flex flex-wrap items-start justify-between gap-3 p-5">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Morada de envio</h2>
                <p className="mt-1 text-sm text-stone-900/60">{savedAddress}</p>
                <p className="mt-1 text-xs text-stone-900/45">
                  Aparece pré-preenchida no pagamento — podes alterá-la lá.
                </p>
              </div>
              <Link
                href="/conta/perfil"
                className="text-xs font-medium text-clay-600 hover:text-clay-700"
              >
                Editar
              </Link>
            </div>
          )}

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
            <p className="pt-1 text-xs text-stone-900/45">
              Enviamos para Portugal. Morada, email e método de pagamento são recolhidos na
              página segura do Stripe no passo seguinte.
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
            <button onClick={handlePay} disabled={loading} className="btn-primary">
              {loading ? "A abrir pagamento seguro…" : "Pagar com segurança"}
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
    </div>
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
