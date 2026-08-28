import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductById } from "@/lib/data/products";
import { ProductForm } from "@/components/ProductForm";

export const metadata: Metadata = {
  title: "Editar produto — Guedias",
};

export default async function EditarProdutoPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id);
  if (!product) notFound();

  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        Editar {product.name}
      </h1>
      <div className="mt-8 max-w-3xl">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
