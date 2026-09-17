"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { CalculatorSettings, Filament, SavedCalculation, SavedCalculationWriteInput } from "@/lib/types";
import {
  createSavedCalculation,
  deleteSavedCalculation,
  updateSavedCalculation,
} from "@/app/admin/calculadora/actions";

// Todos os valores numéricos são guardados como texto (facilita o input com vírgula).
const MANUAL_DEFAULTS = {
  // Filamento
  filamentId: "",
  spoolPrice: "22",
  partWeight: "50",
  // Energia
  printerPower: "1150",
  printMinutes: "180",
  kwhPrice: "0.16",
  // Ajuda para calcular a taxa de máquina
  printerPrice: "300",
  lifespanHours: "3000",
  annualMaintenance: "80",
  annualPrintHours: "800",
  // Acabamento
  finishingMinutes: "15",
  finishingMaterials: "0.30",
  // Trabalho
  prepMinutes: "10",
  handlingMinutes: "10",
  // Embalagem
  packagingCost: "0.80",
  // Margem
  margin: "30",
};

function defaultsFromSettings(settings: CalculatorSettings) {
  return {
    ...MANUAL_DEFAULTS,
    machineRate: String(settings.machineRate),
    laborRate: String(settings.laborRate),
    failureRate: String(settings.failureRatePercent),
    feePercent: String(settings.feePercent),
    feeFixed: String(settings.feeFixed),
    vatEnabled: settings.vatEnabled,
    vatPercent: String(settings.vatPercent),
  };
}

type State = ReturnType<typeof defaultsFromSettings>;

function num(value: string): number {
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function roundToCharm(x: number): number {
  const base = Math.floor(x);
  let r = base + 0.9;
  if (r < x - 1e-9) r += 1;
  return r;
}

// Cálculos guardados antes da mudança de "Tempo de impressão" de horas
// para minutos ainda têm `printHours` nos inputs em vez de `printMinutes`.
// Converte à entrada para que continuem a abrir com o valor certo.
function migrateInputs(inputs: Record<string, unknown>): Partial<State> {
  const migrated: Record<string, unknown> = { ...inputs };
  if (migrated.printMinutes === undefined && migrated.printHours !== undefined) {
    migrated.printMinutes = String(num(String(migrated.printHours)) * 60);
  }
  delete migrated.printHours;
  return migrated as Partial<State>;
}

export function PriceCalculator({
  filaments,
  settings,
  savedCalculations,
}: {
  filaments: Filament[];
  settings: CalculatorSettings;
  savedCalculations: SavedCalculation[];
}) {
  const router = useRouter();
  const [s, setS] = useState<State>(() => defaultsFromSettings(settings));
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState<{ id: string; name: string } | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function set<K extends keyof State>(key: K, value: State[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    setCopied(false);
  }

  function handleFilamentChange(id: string) {
    if (!id) {
      set("filamentId", "");
      return;
    }
    const filament = filaments.find((f) => f.id === id);
    setS((prev) => ({
      ...prev,
      filamentId: id,
      spoolPrice: filament ? String(filament.pricePerKg) : prev.spoolPrice,
    }));
    setCopied(false);
  }

  const r = useMemo(() => {
    const filamentCost = (num(s.spoolPrice) * num(s.partWeight)) / 1000;
    const printMinutes = num(s.printMinutes);
    // Energia é medida em kWh, por isso precisa das horas; a taxa de máquina
    // (€/h nas Configurações) é convertida para €/min antes de multiplicar.
    const energyCost = (num(s.printerPower) / 1000) * (printMinutes / 60) * num(s.kwhPrice);
    const machineCost = (num(s.machineRate) / 60) * printMinutes;
    const finishingMaterials = num(s.finishingMaterials);
    const packagingCost = num(s.packagingCost);

    const laborMinutes = num(s.prepMinutes) + num(s.handlingMinutes) + num(s.finishingMinutes);
    const laborCost = (num(s.laborRate) * laborMinutes) / 60;

    const directCost =
      filamentCost + energyCost + machineCost + finishingMaterials + packagingCost + laborCost;

    const f = Math.min(Math.max(num(s.failureRate) / 100, 0), 0.9);
    const wastedBase = filamentCost + energyCost + machineCost;
    const failureAdjustment = wastedBase * (1 / (1 - f) - 1);

    const totalCost = directCost + failureAdjustment;

    const margin = num(s.margin) / 100;
    const priceBeforeFees = totalCost * (1 + margin);

    const feePercent = Math.min(Math.max(num(s.feePercent) / 100, 0), 0.9);
    const priceExVat = (priceBeforeFees + num(s.feeFixed)) / (1 - feePercent);

    const vat = s.vatEnabled ? num(s.vatPercent) / 100 : 0;
    const priceIncVat = priceExVat * (1 + vat);

    const suggested = roundToCharm(priceIncVat);
    // Lucro estimado ao preço arredondado: remove IVA, taxa e custo.
    const netAtSuggested = suggested / (1 + vat) - num(s.feeFixed);
    const feeAtSuggested = netAtSuggested * feePercent;
    const profit = netAtSuggested - feeAtSuggested - totalCost;
    const effectiveMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return {
      lines: [
        { label: "Filamento", value: filamentCost },
        { label: "Energia", value: energyCost },
        { label: "Desgaste + manutenção", value: machineCost },
        { label: "Materiais de acabamento", value: finishingMaterials },
        { label: "Embalagem", value: packagingCost },
        { label: "O teu trabalho", value: laborCost },
        { label: `Reserva para falhas (${(f * 100).toFixed(0)}%)`, value: failureAdjustment },
      ],
      totalCost,
      priceExVat,
      priceIncVat,
      suggested,
      profit,
      effectiveMargin,
      laborMinutes,
      vatEnabled: s.vatEnabled,
    };
  }, [s]);

  const machineHelper = useMemo(() => {
    const depreciation = num(s.lifespanHours) > 0 ? num(s.printerPrice) / num(s.lifespanHours) : 0;
    const maintenance =
      num(s.annualPrintHours) > 0 ? num(s.annualMaintenance) / num(s.annualPrintHours) : 0;
    return depreciation + maintenance;
  }, [s.printerPrice, s.lifespanHours, s.annualMaintenance, s.annualPrintHours]);

  async function copyPrice() {
    try {
      await navigator.clipboard.writeText(r.suggested.toFixed(2));
      setCopied(true);
    } catch {
      // ignora
    }
  }

  function startNew() {
    setS(defaultsFromSettings(settings));
    setLoaded(null);
    setNameDraft(null);
    setSaveError(null);
  }

  function openCalculation(calc: SavedCalculation) {
    setS({ ...defaultsFromSettings(settings), ...migrateInputs(calc.inputs) });
    setLoaded({ id: calc.id, name: calc.name });
    setNameDraft(null);
    setSaveError(null);
    setCopied(false);
  }

  function buildInput(name: string): SavedCalculationWriteInput {
    return {
      name,
      filament_id: s.filamentId || null,
      inputs: s,
      total_cost_cents: Math.round(r.totalCost * 100),
      suggested_price_cents: Math.round(r.suggested * 100),
      profit_cents: Math.round(r.profit * 100),
      margin_percent: r.effectiveMargin,
    };
  }

  async function handleSaveAsNew(name: string) {
    if (!name.trim()) {
      setSaveError("Dá um nome ao cálculo.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const result = await createSavedCalculation(buildInput(name.trim()));
    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    setLoaded(result.id ? { id: result.id, name: name.trim() } : null);
    setNameDraft(null);
    router.refresh();
  }

  async function handleUpdate() {
    if (!loaded) return;
    setSaving(true);
    setSaveError(null);
    const result = await updateSavedCalculation(loaded.id, buildInput(loaded.name));
    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(calc: SavedCalculation) {
    if (!window.confirm(`Apagar o cálculo "${calc.name}"? Esta ação não pode ser desfeita.`)) return;
    const result = await deleteSavedCalculation(calc.id);
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    if (loaded?.id === calc.id) startNew();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Section title="Filamento">
            <div>
              <label className="label">Filamento guardado</label>
              <select
                className="input"
                value={s.filamentId}
                onChange={(e) => handleFilamentChange(e.target.value)}
              >
                <option value="">Introduzir manualmente</option>
                {filaments.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.material}, {f.color}) — {formatPrice(f.pricePerKg)}/kg
                  </option>
                ))}
              </select>
              {filaments.length === 0 && (
                <p className="mt-1 text-xs text-stone-900/45">
                  Ainda não guardaste filamentos em /admin/filamentos.
                </p>
              )}
            </div>
            <Field
              label="Preço do rolo (€/kg)"
              value={s.spoolPrice}
              onChange={(v) => set("spoolPrice", v)}
              disabled={Boolean(s.filamentId)}
              hint={s.filamentId ? "Vem do filamento selecionado acima." : undefined}
            />
            <Field label="Peso da peça (g)" value={s.partWeight} onChange={(v) => set("partWeight", v)} />
          </Section>

          <Section title="Energia">
            <Field label="Potência da impressora (W)" value={s.printerPower} onChange={(v) => set("printerPower", v)} />
            <Field label="Tempo de impressão (min)" value={s.printMinutes} onChange={(v) => set("printMinutes", v)} />
            <Field label="Preço da eletricidade (€/kWh)" value={s.kwhPrice} onChange={(v) => set("kwhPrice", v)} />
          </Section>

          <Section title="Desgaste e manutenção da impressora">
            <Field
              label="Taxa de máquina (€/h)"
              value={s.machineRate}
              onChange={(v) => set("machineRate", v)}
              hint="Depreciação + peças de manutenção por hora de impressão. Vem das Configurações em /admin/filamentos."
            />
            <details className="rounded-lg bg-black/[0.03] p-3 text-sm">
              <summary className="cursor-pointer text-xs font-medium text-stone-900/60">
                Ajudar a calcular a taxa de máquina
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Preço da impressora (€)" value={s.printerPrice} onChange={(v) => set("printerPrice", v)} />
                <Field label="Vida útil (h)" value={s.lifespanHours} onChange={(v) => set("lifespanHours", v)} />
                <Field label="Manutenção anual (€)" value={s.annualMaintenance} onChange={(v) => set("annualMaintenance", v)} />
                <Field label="Horas de impressão / ano" value={s.annualPrintHours} onChange={(v) => set("annualPrintHours", v)} />
              </div>
              <button
                type="button"
                onClick={() => set("machineRate", machineHelper.toFixed(2))}
                className="btn-secondary mt-3 text-xs"
              >
                Usar {formatPrice(machineHelper)}/h
              </button>
            </details>
          </Section>

          <Section title="Acabamento">
            <Field label="Tempo de acabamento (min)" value={s.finishingMinutes} onChange={(v) => set("finishingMinutes", v)} />
            <Field
              label="Materiais de acabamento (€)"
              value={s.finishingMaterials}
              onChange={(v) => set("finishingMaterials", v)}
              hint="Lixa, primário, tinta, cola…"
            />
          </Section>

          <Section title="O teu tempo de trabalho">
            <Field
              label="Valor à hora (€/h)"
              value={s.laborRate}
              onChange={(v) => set("laborRate", v)}
              hint="Vem das Configurações em /admin/filamentos."
            />
            <Field label="Preparação / modelação / slicing (min)" value={s.prepMinutes} onChange={(v) => set("prepMinutes", v)} />
            <Field
              label="Remoção de suportes, montagem, controlo (min)"
              value={s.handlingMinutes}
              onChange={(v) => set("handlingMinutes", v)}
            />
            <p className="text-xs text-stone-900/45">
              Total de trabalho: {r.laborMinutes.toFixed(0)} min (inclui o acabamento acima).
            </p>
          </Section>

          <Section title="Embalagem">
            <Field
              label="Custo de embalagem (€)"
              value={s.packagingCost}
              onChange={(v) => set("packagingCost", v)}
              hint="Caixa, papel, autocolante, etiqueta de envio."
            />
          </Section>

          <Section title="Ajustes finais">
            <Field
              label="Taxa de impressões falhadas (%)"
              value={s.failureRate}
              onChange={(v) => set("failureRate", v)}
              hint="Acrescenta uma reserva sobre material, energia e máquina. Vem das Configurações."
            />
            <Field label="Margem de lucro (%)" value={s.margin} onChange={(v) => set("margin", v)} />
            <Field label="Taxa de pagamento (%)" value={s.feePercent} onChange={(v) => set("feePercent", v)} />
            <Field label="Taxa de pagamento fixa (€)" value={s.feeFixed} onChange={(v) => set("feeFixed", v)} />
            <label className="flex items-center gap-2 text-sm text-stone-900">
              <input
                type="checkbox"
                checked={s.vatEnabled}
                onChange={(e) => set("vatEnabled", e.target.checked)}
              />
              Somar IVA ao preço final
            </label>
            {s.vatEnabled && (
              <Field label="IVA (%)" value={s.vatPercent} onChange={(v) => set("vatPercent", v)} />
            )}
          </Section>

          <button
            type="button"
            onClick={startNew}
            className="text-xs font-medium text-stone-900/45 hover:text-red-600"
          >
            {loaded ? "Novo cálculo (limpa o formulário)" : "Repor valores por omissão"}
          </button>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-stone-900">Resultado</h2>

            <ul className="space-y-1.5 text-sm">
              {r.lines.map((line) => (
                <li key={line.label} className="flex justify-between gap-3 text-stone-900/60">
                  <span>{line.label}</span>
                  <span className="whitespace-nowrap">{formatPrice(line.value)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 border-t border-black/5 pt-1.5 font-semibold text-stone-900">
                <span>Custo total</span>
                <span className="whitespace-nowrap">{formatPrice(r.totalCost)}</span>
              </li>
            </ul>

            <div className="rounded-xl bg-clay-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-clay-700">
                Preço sugerido{r.vatEnabled ? " (c/ IVA)" : ""}
              </p>
              <p className="mt-1 font-display text-3xl font-semibold text-stone-900">
                {formatPrice(r.suggested)}
              </p>
              <p className="mt-1 text-xs text-stone-900/55">
                Exato: {formatPrice(r.priceIncVat)}
                {r.vatEnabled && <> · s/ IVA {formatPrice(r.priceExVat)}</>}
              </p>
              <button type="button" onClick={copyPrice} className="btn-secondary mt-3 w-full text-xs">
                {copied ? "Copiado!" : "Copiar preço"}
              </button>
            </div>

            <dl className="space-y-1 text-sm">
              <div className="flex justify-between text-stone-900/60">
                <dt>Lucro estimado</dt>
                <dd className={r.profit < 0 ? "text-red-600" : ""}>{formatPrice(r.profit)}</dd>
              </div>
              <div className="flex justify-between text-stone-900/60">
                <dt>Margem efetiva</dt>
                <dd className={r.effectiveMargin < 0 ? "text-red-600" : ""}>
                  {r.effectiveMargin.toFixed(0)}%
                </dd>
              </div>
            </dl>

            {r.profit < 0 && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                Ao preço arredondado ficas a perder dinheiro. Sobe a margem ou revê os custos.
              </p>
            )}

            <div className="space-y-2 border-t border-black/5 pt-4">
              {loaded && (
                <p className="text-xs text-stone-900/55">
                  A editar: <span className="font-medium text-stone-900">{loaded.name}</span>
                </p>
              )}

              {nameDraft !== null ? (
                <div className="space-y-2">
                  <input
                    className="input"
                    autoFocus
                    placeholder="Nome do cálculo (ex: Porta-velas Lua)"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveAsNew(nameDraft)}
                      className="btn-primary flex-1 text-xs"
                    >
                      {saving ? "A guardar…" : "Confirmar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNameDraft(null)}
                      className="btn-ghost text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : loaded ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleUpdate}
                    className="btn-primary text-xs"
                  >
                    {saving ? "A guardar…" : "Guardar alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNameDraft("")}
                    className="btn-secondary text-xs"
                  >
                    Guardar como novo cálculo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setNameDraft("")}
                  className="btn-primary w-full text-xs"
                >
                  Guardar cálculo
                </button>
              )}

              {saveError && <p className="text-xs text-red-600">{saveError}</p>}
            </div>
          </div>
        </aside>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-stone-900">Cálculos guardados</h2>
        {savedCalculations.length === 0 ? (
          <p className="mt-2 text-sm text-stone-900/55">Ainda não guardaste nenhum cálculo.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {savedCalculations.map((calc) => (
              <div key={calc.id} className="card flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{calc.name}</p>
                  <p className="mt-0.5 text-xs text-stone-900/45">
                    Custo {formatPrice(calc.totalCost)} · Margem {calc.marginPercent.toFixed(0)}%
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-stone-900">
                  {formatPrice(calc.suggestedPrice)}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => openCalculation(calc)}
                    className="text-xs font-medium text-clay-600 hover:text-clay-700"
                  >
                    Abrir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(calc)}
                    className="text-xs font-medium text-stone-900/45 hover:text-red-600"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-stone-900/45">{hint}</p>}
    </div>
  );
}
