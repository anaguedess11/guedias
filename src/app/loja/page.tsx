import { Suspense } from "react";
import type { Metadata } from "next";
import { LojaClient } from "@/components/LojaClient";
import { getAllProducts } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "Loja — Guedias",
  description: "Explora todos os produtos impressos em 3D da Guedias, por categoria.",
};

export default async function LojaPage() {
  const products = await getAllProducts();

  return (
    <Suspense fallback={<div className="container-page py-24" />}>
      <LojaClient products={products} />
    </Suspense>
  );
}
