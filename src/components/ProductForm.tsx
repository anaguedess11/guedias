"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/data/categories";
import { Filament, Product, ProductColor, ProductWriteInput, SavedCalculation } from "@/lib/types";
import { createProduct, updateProduct } from "@/app/admin/actions";
import { ImageGalleryField } from "@/components/ImageUploadField";
import { formatPrice } from "@/lib/format";

const PROFILE_PRESETS: { label: string; profile: number[] }[] = [
  { label: "Vaso", profile: [0.34, 0.48, 0.62, 0.78, 0.88, 0.8, 0.62, 0.46, 0.55, 0.66] },
  { label: "Caixa", profile: [0.85, 0.85, 0.85, 0.85, 0.85] },
  { label: "Suporte", profile: [0.9, 0.35, 0.3, 0.3, 0.35, 0.9] },
  { label: "Chaveiro", profile: [0.4, 0.6, 0.6, 0.4] },
];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFormState(product?: Product) {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category: product?.category ?? categories[0].key,
    price: product ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    details: product?.details?.join("\n") ?? "",
    // Os materiais dos filamentos escolhidos são acrescentados ao guardar.
    materials:
      product?.materials
        ?.filter((m) => !product.colors.some((c) => c.material === m))
        .join(", ") ?? "",
    customizable: product?.customizable ?? false,
    customizationLabel: product?.customizationLabel ?? "",
    customizationNote: product?.customizationNote ?? "",
    profile: product?.profile?.join(", ") ?? PROFILE_PRESETS[0].profile.join(", "),
    printTimeHours: product ? String(product.printTimeHours) : "2",
    dimensions: product?.dimensions ?? "",
    featured: product?.featured ?? false,
    tags: product?.tags?.join(", ") ?? "",
    models: product?.models?.join("\n") ?? "",
  };
}

export function ProductForm({
  product,
  savedCalculations = [],
  filaments = [],
}: {
  product?: Product;
  savedCalculations?: SavedCalculation[];
  filaments?: Filament[];
}) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [form, setForm] = useState(toFormState(product));
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [colors, setColors] = useState<ProductColor[]>(product?.colors ?? []);

  // Podem existir várias bobines iguais: mostra-se cada cor + material uma só vez.
  const filamentOptions = useMemo(() => {
    const seen = new Map<string, Filament>();
    for (const f of filaments) {
      const key = `${f.color}::${f.material}`;
      if (!seen.has(key)) seen.set(key, f);
    }
    return Array.from(seen.values()).sort((a, b) => a.color.localeCompare(b.color, "pt"));
  }, [filaments]);

  const manualColors = colors
    .map((color, index) => ({ color, index }))
    .filter(({ color }) => !color.material);

  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(value: string) {
    set("name", value);
    if (!slugTouched) set("slug", slugify(value));
  }

  function updateColor(index: number, patch: Partial<ProductColor>) {
    setColors((cs) => cs.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function addColor() {
    setColors((cs) => [...cs, { name: "", hex: "#C0663E" }]);
  }

  function removeColor(index: number) {
    setColors((cs) => cs.filter((_, i) => i !== index));
  }

  function isFilamentSelected(f: Filament) {
    return colors.some((c) => c.name === f.color && c.material === f.material);
  }

  function toggleFilament(f: Filament) {
    setColors((cs) =>
      isFilamentSelected(f)
        ? cs.filter((c) => !(c.name === f.color && c.material === f.material))
        : // O cliente escolhe pelo nome da cor, por isso cada nome só pode existir uma vez.
          [...cs.filter((c) => c.name !== f.color), { name: f.color, hex: f.hex, material: f.material }]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceEuros = parseFloat(form.price.replace(",", "."));
    if (!Number.isFinite(priceEuros) || priceEuros <= 0) {
      setError("Indica um preço válido.");
      return;
    }
    const compareAtEuros = form.compareAtPrice
      ? parseFloat(form.compareAtPrice.replace(",", "."))
      : null;

    const profileValues = form.profile
      .split(",")
      .map((v) => parseFloat(v.trim()))
      .filter((n) => Number.isFinite(n));

    const cleanColors = colors
      .map((c) => ({
        name: c.name.trim(),
        hex: c.hex.trim(),
        ...(c.material ? { material: c.material } : {}),
      }))
      .filter((c) => c.name && c.hex);

    const typedMaterials = form.materials.split(",").map((m) => m.trim()).filter(Boolean);
    const filamentMaterials = cleanColors.flatMap((c) => (c.material ? [c.material] : []));
    const hasManualColor = cleanColors.some((c) => !c.material);
    const materials = Array.from(new Set([...typedMaterials, ...filamentMaterials]));

    if (hasManualColor && typedMaterials.length === 0) {
      setError("Indica o material das cores adicionadas à mão.");
      return;
    }

    const input: ProductWriteInput = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      category_key: form.category,
      price_cents: Math.round(priceEuros * 100),
      compare_at_price_cents:
        compareAtEuros && Number.isFinite(compareAtEuros) ? Math.round(compareAtEuros * 100) : null,
      short_description: form.shortDescription.trim(),
      description: form.description.trim(),
      details: form.details.split("\n").map((d) => d.trim()).filter(Boolean),
      materials,
      colors: cleanColors,
      image_url: images[0] ?? null,
      image_urls: images,
      customizable: form.customizable,
      customization_label: form.customizable ? form.customizationLabel.trim() || null : null,
      customization_note: form.customizable ? form.customizationNote.trim() || null : null,
      profile: profileValues,
      // 0 significa "por definir": a página do produto não mostra o tempo.
      print_time_hours: parseFloat(form.printTimeHours) || 0,
      dimensions: form.dimensions.trim(),
      featured: form.featured,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      models: [...new Set(form.models.split("\n").map((m) => m.trim()).filter(Boolean))],
    };

    setSaving(true);
    const result = isEdit && product ? await updateProduct(product.id, input) : await createProduct(input);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-stone-900">Informação geral</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Slug (URL)</label>
            <input
              className="input"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => set("category", e.target.value as typeof form.category)}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Preço (€)</label>
            <input
              className="input"
              required
              inputMode="decimal"
              placeholder="24.90"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          {savedCalculations.length > 0 && (
            <div className="sm:col-span-2">
              <label className="label">Importar preço de um cálculo guardado</label>
              <select
                className="input"
                defaultValue=""
                onChange={(e) => {
                  const calc = savedCalculations.find((c) => c.id === e.target.value);
                  if (calc) set("price", String(calc.suggestedPrice));
                  e.target.value = "";
                }}
              >
                <option value="" disabled>
                  Escolher um cálculo…
                </option>
                {savedCalculations.map((calc) => (
                  <option key={calc.id} value={calc.id}>
                    {calc.name} — {formatPrice(calc.suggestedPrice)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Preço antes de desconto (€, opcional)</label>
            <input
              className="input"
              inputMode="decimal"
              placeholder=""
              value={form.compareAtPrice}
              onChange={(e) => set("compareAtPrice", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descrição curta (usada no catálogo)</label>
            <input
              className="input"
              required
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descrição completa</label>
            <textarea
              className="input min-h-[110px] resize-y"
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Detalhes de impressão (uma linha por detalhe)</label>
            <textarea
              className="input min-h-[90px] resize-y"
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-stone-900">Cores e fotografias</h2>

        {filamentOptions.length > 0 && (
          <div>
            <span className="label">Filamentos disponíveis para este produto</span>
            <p className="mb-2 text-xs text-stone-900/45">
              Marca os que podem ser usados. O cliente só vê as cores.
            </p>
            <div className="flex flex-wrap gap-2">
              {filamentOptions.map((f) => {
                const selected = isFilamentSelected(f);
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => toggleFilament(f)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      selected
                        ? "border-clay-500 bg-clay-50 text-stone-900"
                        : "border-black/10 bg-white text-stone-900/70 hover:border-clay-500/40"
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: f.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
                    />
                    <span>
                      <span className="block font-medium">{f.color}</span>
                      <span className="block text-stone-900/50">{f.material}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <span className="label">
            {filamentOptions.length > 0 ? "Outras cores (opcional)" : "Cores"}
          </span>
          <div className="space-y-2">
            {manualColors.map(({ color: c, index: i }) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-black/10"
                  value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#C0663E"}
                  onChange={(e) => updateColor(i, { hex: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Nome da cor (ex: Terracota)"
                  value={c.name}
                  onChange={(e) => updateColor(i, { name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeColor(i)}
                  className="shrink-0 text-xs font-medium text-stone-900/45 hover:text-red-600"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addColor} className="btn-secondary mt-3">
            + Adicionar cor à mão
          </button>
        </div>

        {manualColors.length > 0 && (
          <div>
            <label className="label">Material das cores à mão (separados por vírgula)</label>
            <input
              className="input"
              placeholder="PLA"
              value={form.materials}
              onChange={(e) => set("materials", e.target.value)}
            />
          </div>
        )}

        <ImageGalleryField value={images} onChange={setImages} slug={form.slug || form.name} />
      </div>

      <div className="card space-y-3 p-6">
        <h2 className="text-sm font-semibold text-stone-900">Modelos (opcional)</h2>
        <p className="text-xs text-stone-900/50">
          Um modelo por linha (ex.: Meia de Natal, Laço). O cliente escolhe um. Deixa vazio se o
          produto só tiver um modelo.
        </p>
        <textarea
          className="input min-h-[110px] resize-y"
          placeholder={"Meia de Natal\nÁrvore de Natal\nLaço"}
          value={form.models}
          onChange={(e) => set("models", e.target.value)}
        />
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-stone-900">Personalização</h2>
        <label className="flex items-center gap-2 text-sm text-stone-900">
          <input
            type="checkbox"
            checked={form.customizable}
            onChange={(e) => set("customizable", e.target.checked)}
          />
          Este produto é personalizável (nome, texto, foto...)
        </label>
        {form.customizable && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Etiqueta do campo</label>
              <input
                className="input"
                placeholder="Nome ou texto (máx. 12 caracteres)"
                value={form.customizationLabel}
                onChange={(e) => set("customizationLabel", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Nota de ajuda (opcional)</label>
              <input
                className="input"
                value={form.customizationNote}
                onChange={(e) => set("customizationNote", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-stone-900">Impressão e catálogo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tempo de impressão (horas)</label>
            <input
              className="input"
              inputMode="decimal"
              value={form.printTimeHours}
              onChange={(e) => set("printTimeHours", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Dimensões</label>
            <input
              className="input"
              placeholder="18 × 10 × 10 cm"
              value={form.dimensions}
              onChange={(e) => set("dimensions", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Silhueta do placeholder visual (números 0–1, separados por vírgula)</label>
            <input
              className="input"
              value={form.profile}
              onChange={(e) => set("profile", e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {PROFILE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => set("profile", p.profile.join(", "))}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs text-stone-900/60 hover:border-clay-500/40"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Tags (separadas por vírgula)</label>
            <input
              className="input"
              placeholder="vaso, sala, flores"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-stone-900">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              Mostrar em destaque na página inicial
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Criar produto"}
        </button>
        <button type="button" onClick={() => router.push("/admin/produtos")} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
