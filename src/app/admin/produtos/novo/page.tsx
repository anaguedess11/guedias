import type { Metadata } from "next";
import { ProductForm } from "@/components/ProductForm";

export const metadata: Metadata = {
  title: "Novo produto — Guedias",
};

export default function NovoProdutoPage() {
  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        Novo produto
      </h1>
      <div className="mt-8 max-w-3xl">
        <ProductForm />
      </div>
    </div>
  );
}
