import type { Metadata } from "next";
import { FilamentForm } from "@/components/FilamentForm";

export const metadata: Metadata = {
  title: "Novo filamento — Gu3Dias",
};

export default function NovoFilamentoPage() {
  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        Novo filamento
      </h1>
      <div className="mt-8 max-w-3xl">
        <FilamentForm />
      </div>
    </div>
  );
}
