"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { useCart } from "@/components/CartProvider";

export function AddToCartForm({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();

  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [material, setMaterial] = useState(product.materials[0] ?? "");
  const [personalization, setPersonalization] = useState("");
  const [qty, setQty] = useState(1);
  const [feedback, setFeedback] = useState<"idle" | "added">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (product.customizable && personalization.trim().length === 0) return false;
    return true;
  }, [product.customizable, personalization]);

  function handleAdd() {
    if (!canSubmit) {
      setError("Preenche a personalização antes de adicionar ao carrinho.");
      return;
    }
    setError(null);
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      color,
      material,
      personalization: product.customizable ? personalization.trim() : undefined,
      profile: product.profile,
      qty,
    });
    setFeedback("added");
    setTimeout(() => setFeedback("idle"), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Cor */}
      <div>
        <span className="label">Cor — {color}</span>
        <div className="flex flex-wrap gap-2.5">
          {product.colors.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setColor(c.name)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                color === c.name ? "border-clay-500 scale-110" : "border-transparent hover:border-black/10"
              }`}
              title={c.name}
              aria-label={c.name}
            >
              <span
                className="h-8 w-8 rounded-full shadow-inner"
                style={{ backgroundColor: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Material */}
      {product.materials.length > 1 && (
        <div>
          <span className="label">Material</span>
          <div className="flex flex-wrap gap-2">
            {product.materials.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMaterial(m)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  material === m
                    ? "border-clay-500 bg-clay-500 text-white"
                    : "border-black/10 bg-white text-stone-900/70 hover:border-clay-500/40"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Personalização */}
      {product.customizable && (
        <div>
          <label className="label" htmlFor="personalization">
            {product.customizationLabel ?? "Personalização"}
          </label>
          <textarea
            id="personalization"
            className="input min-h-[84px] resize-none"
            placeholder="Escreve aqui o que queres na tua peça…"
            value={personalization}
            onChange={(e) => setPersonalization(e.target.value)}
            maxLength={140}
          />
          {product.customizationNote && (
            <p className="mt-1.5 text-xs text-stone-900/50">{product.customizationNote}</p>
          )}
        </div>
      )}

      {/* Quantidade */}
      <div>
        <span className="label">Quantidade</span>
        <div className="inline-flex items-center rounded-full border border-black/10">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-lg text-stone-900/70 hover:text-stone-900"
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(20, q + 1))}
            className="flex h-10 w-10 items-center justify-center text-lg text-stone-900/70 hover:text-stone-900"
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={handleAdd} className="btn-primary w-full sm:w-auto">
          {feedback === "added" ? "Adicionado ✓" : "Adicionar ao carrinho"}
        </button>
        <button
          type="button"
          onClick={() => {
            handleAdd();
            router.push("/carrinho");
          }}
          className="btn-secondary w-full sm:w-auto"
        >
          Comprar agora
        </button>
      </div>

      {feedback === "added" && (
        <p className="animate-fade-in text-sm text-pine-500">
          Adicionado ao carrinho. Podes continuar a explorar ou{" "}
          <a href="/carrinho" className="underline underline-offset-2">
            ver o carrinho
          </a>
          .
        </p>
      )}
    </div>
  );
}
