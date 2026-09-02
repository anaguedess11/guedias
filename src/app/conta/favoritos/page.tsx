import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProductsByIds } from "@/lib/data/products";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Os meus favoritos — Guedias",
};

export default async function FavoritosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/conta/entrar");

  const supabase = createClient();
  const { data: favs } = await supabase
    .from("favorites")
    .select("product_id, created_at")
    .order("created_at", { ascending: false });

  const products = await getProductsByIds((favs ?? []).map((f) => f.product_id as string));

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href="/conta" className="text-xs font-medium text-clay-600 hover:text-clay-700">
        ← A minha conta
      </Link>
      <p className="eyebrow mt-3">A minha conta</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        Os meus favoritos
      </h1>
      <p className="mt-2 text-sm text-stone-900/55">
        {products.length === 0
          ? "Ainda não guardaste nenhum produto."
          : `${products.length} ${products.length === 1 ? "produto guardado" : "produtos guardados"}.`}
      </p>

      {products.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <p className="text-sm text-stone-900/55">
            Toca no coração de um produto para o guardares aqui.
          </p>
          <Link href="/loja" className="btn-primary mt-4 inline-flex">
            Explorar a loja
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
