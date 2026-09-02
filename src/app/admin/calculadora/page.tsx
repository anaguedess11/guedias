import type { Metadata } from "next";
import { PriceCalculator } from "@/components/PriceCalculator";

export const metadata: Metadata = {
  title: "Calculadora de preço — Guedias",
};

export default function CalculadoraPage() {
  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        Calculadora de preço justo
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-stone-900/55">
        Estima um preço que cobre filamento, energia, desgaste da máquina, acabamento, embalagem
        e o teu tempo — e ainda deixa margem. Os valores ficam guardados neste navegador.
      </p>
      <div className="mt-8">
        <PriceCalculator />
      </div>
    </div>
  );
}
