import type { Metadata } from "next";
import { PriceCalculator } from "@/components/PriceCalculator";
import { getAllFilaments } from "@/lib/data/filaments";
import { getCalculatorSettings } from "@/lib/data/calculatorSettings";
import { getAllSavedCalculations } from "@/lib/data/savedCalculations";

export const metadata: Metadata = {
  title: "Calculadora de preço — Gu3Dias",
};

export default async function CalculadoraPage() {
  const [filaments, settings, savedCalculations] = await Promise.all([
    getAllFilaments(),
    getCalculatorSettings(),
    getAllSavedCalculations(),
  ]);

  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        Calculadora de preço justo
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-900/55">
        Estima um preço que cobre filamento, energia, desgaste da máquina, acabamento, embalagem
        e o teu tempo — e ainda deixa margem. Seleciona um filamento guardado ou introduz o preço
        manualmente; as taxas vêm pré-preenchidas das Configurações em /admin/filamentos.
      </p>
      <div className="mt-8">
        <PriceCalculator
          filaments={filaments}
          settings={settings}
          savedCalculations={savedCalculations}
        />
      </div>
    </div>
  );
}
