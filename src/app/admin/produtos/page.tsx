import Link from "next/link";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/data/products";
import { getCategory } from "@/data/categories";
import { formatPrice } from "@/lib/format";
import { PrintedObject } from "@/components/PrintedObject";
import { DeleteProductButton } from "@/components/DeleteProductButton";

export const metadata: Metadata = {
  title: "Administração de produtos — Guedias",
};

export default async function AdminProductsPage() {
  const products = await getAllProducts();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Administração</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-stone-900/55">{products.length} produtos na loja.</p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-primary">
          Novo produto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card p-6 text-center text-sm text-stone-900/55">
          Ainda não há produtos. Cria o primeiro.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="card flex items-center gap-4 p-4">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <PrintedObject
                  profile={product.profile}
                  color={product.colors[0]?.hex ?? "#C0663E"}
                  className="h-16 w-16 shrink-0 rounded-lg"
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{product.name}</p>
                <p className="mt-0.5 text-xs text-stone-900/45">
                  {getCategory(product.category)?.label} · {product.slug}
                  {product.featured && (
                    <span className="ml-2 rounded-full bg-clay-500/10 px-2 py-0.5 text-clay-700">
                      Destaque
                    </span>
                  )}
                </p>
              </div>

              <span className="whitespace-nowrap text-sm font-semibold text-stone-900">
                {formatPrice(product.price)}
              </span>

              <div className="flex items-center gap-4">
                <Link
                  href={`/admin/produtos/${product.id}/editar`}
                  className="text-xs font-medium text-clay-600 hover:text-clay-700"
                >
                  Editar
                </Link>
                <DeleteProductButton id={product.id} name={product.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
