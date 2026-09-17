"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalculatorSettings, CalculatorSettingsWriteInput } from "@/lib/types";
import { saveCalculatorSettings } from "@/app/admin/filamentos/actions";

function num(value: string): number {
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function CalculatorSettingsForm({ settings }: { settings: CalculatorSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    machineRate: String(settings.machineRate),
    laborRate: String(settings.laborRate),
    failureRatePercent: String(settings.failureRatePercent),
    feePercent: String(settings.feePercent),
    feeFixed: String(settings.feeFixed),
    vatPercent: String(settings.vatPercent),
    vatEnabled: settings.vatEnabled,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: CalculatorSettingsWriteInput = {
      machine_rate_cents: Math.round(num(form.machineRate) * 100),
      labor_rate_cents: Math.round(num(form.laborRate) * 100),
      failure_reserve_percent: num(form.failureRatePercent),
      fee_percent: num(form.feePercent),
      fee_fixed_cents: Math.round(num(form.feeFixed) * 100),
      vat_percent: num(form.vatPercent),
      vat_enabled: form.vatEnabled,
    };

    setSaving(true);
    const result = await saveCalculatorSettings(input);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div>
        <h2 className="text-sm font-semibold text-stone-900">Configurações da calculadora</h2>
        <p className="mt-1 text-xs text-stone-900/55">
          Valores usados como ponto de partida em /admin/calculadora — continuam editáveis em cada cálculo.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Taxa de máquina (€/hora)</label>
          <input
            className="input"
            inputMode="decimal"
            value={form.machineRate}
            onChange={(e) => set("machineRate", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Taxa do teu trabalho (€/hora)</label>
          <input
            className="input"
            inputMode="decimal"
            value={form.laborRate}
            onChange={(e) => set("laborRate", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Reserva para impressões falhadas (%)</label>
          <input
            className="input"
            inputMode="decimal"
            value={form.failureRatePercent}
            onChange={(e) => set("failureRatePercent", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Taxa de pagamento (%)</label>
          <input
            className="input"
            inputMode="decimal"
            value={form.feePercent}
            onChange={(e) => set("feePercent", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Taxa de pagamento fixa (€)</label>
          <input
            className="input"
            inputMode="decimal"
            value={form.feeFixed}
            onChange={(e) => set("feeFixed", e.target.value)}
          />
        </div>
        <div>
          <label className="label">IVA (%)</label>
          <input
            className="input"
            inputMode="decimal"
            value={form.vatPercent}
            onChange={(e) => set("vatPercent", e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-900">
        <input
          type="checkbox"
          checked={form.vatEnabled}
          onChange={(e) => set("vatEnabled", e.target.checked)}
        />
        Somar IVA por omissão na calculadora
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "A guardar…" : "Guardar configurações"}
        </button>
        {saved && <span className="text-xs font-medium text-pine-600">Guardado!</span>}
      </div>
    </form>
  );
}
