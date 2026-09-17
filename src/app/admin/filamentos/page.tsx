import Link from "next/link";
import type { Metadata } from "next";
import { getAllFilaments } from "@/lib/data/filaments";
import { getCalculatorSettings } from "@/lib/data/calculatorSettings";
import { formatPrice } from "@/lib/format";
import { DeleteFilamentButton } from "@/components/DeleteFilamentButton";
import { CalculatorSettingsForm } from "@/components/CalculatorSettingsForm";

export const metadata: Metadata = {
  title: "Filamentos — Guedias",
};

export default async function AdminFilamentsPage() {
  const [filaments, settings] = await Promise.all([getAllFilaments(), getCalculatorSettings()]);

  return (
    <div className="space-y-10">
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Administração</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Filamentos
            </h1>
            <p className="mt-1 text-sm text-stone-900/55">
              {filaments.length} filamento{filaments.length === 1 ? "" : "s"} guardado
              {filaments.length === 1 ? "" : "s"}.
            </p>
          </div>
          <Link href="/admin/filamentos/novo" className="btn-primary">
            Novo filamento
          </Link>
        </div>

        {filaments.length === 0 ? (
          <div className="card p-6 text-center text-sm text-stone-900/55">
            Ainda não há filamentos guardados. Cria o primeiro.
          </div>
        ) : (
          <div className="space-y-3">
            {filaments.map((filament) => (
              <div key={filament.id} className="card flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{filament.name}</p>
                  <p className="mt-0.5 text-xs text-stone-900/45">
                    {filament.material} · {filament.color}
                    {filament.brand && <> · {filament.brand}</>}
                  </p>
                  {filament.notes && (
                    <p className="mt-0.5 truncate text-xs text-stone-900/40">{filament.notes}</p>
                  )}
                </div>

                <span className="whitespace-nowrap text-sm font-semibold text-stone-900">
                  {formatPrice(filament.pricePerKg)}/kg
                </span>

                <div className="flex items-center gap-4">
                  <Link
                    href={`/admin/filamentos/${filament.id}/editar`}
                    className="text-xs font-medium text-clay-600 hover:text-clay-700"
                  >
                    Editar
                  </Link>
                  <DeleteFilamentButton id={filament.id} name={filament.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl">
        <CalculatorSettingsForm settings={settings} />
      </div>
    </div>
  );
}
