import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LojaClient } from "@/components/LojaClient";
import { getAllProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Loja — Gu3Dias",
  description: "Explora todos os produtos impressos em 3D da Gu3Dias, por categoria.",
};

export default async function LojaPage() {
  const products = await getAllProducts();

  return (
    <>
      <Suspense fallback={<div className="container-page py-24" />}>
        <LojaClient products={products} />
      </Suspense>
      <div className="container-page pb-14 text-center">
        <p className="text-sm text-stone-900/60">Não encontraste o que procuravas?</p>
        <Link href="/imagina" className="btn-secondary mt-3 inline-flex">
          Imagina a tua peça
        </Link>
      </div>
    </>
  );
}
