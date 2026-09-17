"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Filament, FilamentWriteInput } from "@/lib/types";
import { createFilament, updateFilament } from "@/app/admin/filamentos/actions";

const MATERIAL_OPTIONS = ["PLA", "PETG", "ABS", "TPU", "ASA", "PC", "Nylon", "Resina"];

function toFormState(filament?: Filament) {
  return {
    name: filament?.name ?? "",
    brand: filament?.brand ?? "",
    color: filament?.color ?? "",
    material: filament?.material ?? MATERIAL_OPTIONS[0],
    pricePerKg: filament ? String(filament.pricePerKg) : "",
    notes: filament?.notes ?? "",
  };
}

export function FilamentForm({ filament }: { filament?: Filament }) {
  const router = useRouter();
  const isEdit = Boolean(filament);
  const [form, setForm] = useState(toFormState(filament));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceEuros = parseFloat(form.pricePerKg.replace(",", "."));
    if (!Number.isFinite(priceEuros) || priceEuros <= 0) {
      setError("Indica um preço por kg válido.");
      return;
    }

    const input: FilamentWriteInput = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      color: form.color.trim(),
      material: form.material.trim(),
      price_per_kg_cents: Math.round(priceEuros * 100),
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    const result =
      isEdit && filament ? await updateFilament(filament.id, input) : await createFilament(input);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/filamentos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-stone-900">Informação do filamento</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome</label>
            <input
              className="input"
              required
              placeholder="PLA Branco Mate"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Marca (opcional)</label>
            <input className="input" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
          <div>
            <label className="label">Cor</label>
            <input
              className="input"
              required
              placeholder="Branco"
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Tipo de material</label>
            <input
              className="input"
              required
              list="material-options"
              value={form.material}
              onChange={(e) => set("material", e.target.value)}
            />
            <datalist id="material-options">
              {MATERIAL_OPTIONS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label">Preço por kg (€)</label>
            <input
              className="input"
              required
              inputMode="decimal"
              placeholder="22.00"
              value={form.pricePerKg}
              onChange={(e) => set("pricePerKg", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notas (opcional)</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Onde compro, referência do fornecedor…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
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
          {saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Criar filamento"}
        </button>
        <button type="button" onClick={() => router.push("/admin/filamentos")} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
