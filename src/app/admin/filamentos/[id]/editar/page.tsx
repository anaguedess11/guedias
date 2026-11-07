import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFilamentById } from "@/lib/data/filaments";
import { FilamentForm } from "@/components/FilamentForm";

export const metadata: Metadata = {
  title: "Editar filamento — Gu3Dias",
};

export default async function EditarFilamentoPage({ params }: { params: { id: string } }) {
  const filament = await getFilamentById(params.id);
  if (!filament) notFound();

  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        Editar {filament.name}
      </h1>
      <div className="mt-8 max-w-3xl">
        <FilamentForm filament={filament} />
      </div>
    </div>
  );
}
