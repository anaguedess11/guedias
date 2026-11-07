import type { Metadata } from "next";
import { ProductForm } from "@/components/ProductForm";
import { getAllSavedCalculations } from "@/lib/data/savedCalculations";
import { getAllFilaments } from "@/lib/data/filaments";

export const metadata: Metadata = {
  title: "Novo produto — Gu3Dias",
};

export default async function NovoProdutoPage() {
  const [savedCalculations, filaments] = await Promise.all([
    getAllSavedCalculations(),
    getAllFilaments(),
  ]);

  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        Novo produto
      </h1>
      <div className="mt-8 max-w-3xl">
        <ProductForm savedCalculations={savedCalculations} filaments={filaments} />
      </div>
    </div>
  );
}
