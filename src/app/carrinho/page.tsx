"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { PrintedObject } from "@/components/PrintedObject";
import { formatPrice } from "@/lib/format";

const FREE_SHIPPING_THRESHOLD = 35;
const SHIPPING_COST = 3.9;

export default function CarrinhoPage() {
  const { items, removeItem, updateQty, subtotal, isHydrated } = useCart();

  if (isHydrated && items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-clay-500/10">
          <CartEmptyIcon />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-stone-900">
          O teu carrinho está vazio
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-900/55">
          Ainda não adicionaste nenhuma peça. Explora a loja e encontra o teu próximo objeto impresso em 3D.
        </p>
        <Link href="/loja" className="btn-primary mt-6">
          Ir para a loja
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">Carrinho</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
        O teu carrinho
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div
              key={item.key}
              className="card flex gap-4 p-4 sm:p-5"
            >
              <Link href={`/produto/${item.slug}`} className="shrink-0">
                <PrintedObject
                  profile={item.profile}
                  color={colorHexFromName(item.color) ?? "#C7430F"}
                  className="h-24 w-24 rounded-xl sm:h-28 sm:w-28"
                />
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/produto/${item.slug}`}
                      className="text-sm font-medium text-stone-900 hover:text-clay-600 sm:text-base"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-stone-900/50">
                      {item.color} · {item.material}
                    </p>
                    {item.personalization && (
                      <p className="mt-1 text-xs italic text-stone-900/60">
                        “{item.personalization}”
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap font-display text-sm font-semibold text-stone-900 sm:text-base">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-black/10">
                    <button
                      onClick={() => updateQty(item.key, item.qty - 1)}
                      className="flex h-8 w-8 items-center justify-center text-stone-900/70 hover:text-stone-900"
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.key, item.qty + 1)}
                      className="flex h-8 w-8 items-center justify-center text-stone-900/70 hover:text-stone-900"
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    className="text-xs font-medium text-stone-900/45 hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h2 className="text-sm font-semibold text-stone-900">Resumo da encomenda</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-stone-900/65">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-900/65">
                <span>Envio</span>
                <span>{shipping === 0 ? "Grátis" : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-clay-600">
                  Faltam {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} para envio grátis.
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-between border-t border-black/5 pt-4 font-display text-base font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Link href="/checkout" className="btn-primary mt-6 w-full">
              Finalizar compra
            </Link>
            <Link href="/loja" className="btn-ghost mt-2 w-full">
              Continuar a comprar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function colorHexFromName(name: string): string | undefined {
  const map: Record<string, string> = {
    Branco: "#F4F1EA",
    Preto: "#232320",
    "Cinza Grafite": "#54534D",
    "Verde-sálvia": "#8A9A78",
    Terracota: "#C0663E",
    "Azul-petróleo": "#2C5F63",
    "Amarelo-mostarda": "#D9A441",
    "Rosa-pastel": "#E8B4BC",
    Natural: "#E3DCCB",
    Madeira: "#9C7A54",
  };
  return map[name];
}

function CartEmptyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A24F30" strokeWidth="1.6">
      <circle cx="9" cy="21" r="1.4" />
      <circle cx="18" cy="21" r="1.4" />
      <path d="M2.5 3h2.2l2.1 12.2a1.8 1.8 0 0 0 1.8 1.5h8.6a1.8 1.8 0 0 0 1.77-1.47l1.35-7.53H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
