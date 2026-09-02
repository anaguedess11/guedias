import Link from "next/link";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/data/products";
import { categories, getCategory } from "@/data/categories";
import { formatPrice } from "@/lib/format";
import { PrintedObject } from "@/components/PrintedObject";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { AdminFilters } from "@/components/AdminFilters";

export const metadata: Metadata = {
  title: "Administração de produtos — Guedias",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    categoria?: string;
    destaque?: string;
    personalizavel?: string;
    foto?: string;
    ordenar?: string;
  };
}) {
  const all = await getAllProducts();

  const q = (searchParams.q ?? "").toLowerCase().trim();

  let products = all.filter((p) => {
    if (searchParams.categoria && p.category !== searchParams.categoria) return false;
    if (searchParams.destaque === "sim" && !p.featured) return false;
    if (searchParams.destaque === "nao" && p.featured) return false;
    if (searchParams.personalizavel === "sim" && !p.customizable) return false;
    if (searchParams.personalizavel === "nao" && p.customizable) return false;
    if (searchParams.foto === "com" && !p.imageUrl) return false;
    if (searchParams.foto === "sem" && p.imageUrl) return false;
    if (q && !`${p.name} ${p.slug}`.toLowerCase().includes(q)) return false;
    return true;
  });

  switch (searchParams.ordenar) {
    case "nome":
      products = [...products].sort((a, b) => a.name.localeCompare(b.name, "pt"));
      break;
    case "preco-asc":
      products = [...products].sort((a, b) => a.price - b.price);
      break;
    case "preco-desc":
      products = [...products].sort((a, b) => b.price - a.price);
      break;
    default:
      // Por omissão: mais recentes primeiro (getAllProducts vem por created_at asc).
      products = [...products].reverse();
  }

  const filtered = products.length !== all.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Administração</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-stone-900/55">
            {filtered ? `${products.length} de ${all.length}` : `${all.length}`} produtos na loja.
          </p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-primary">
          Novo produto
        </Link>
      </div>

      <AdminFilters
        search={{ param: "q", placeholder: "Procurar por nome ou slug…" }}
        selects={[
          {
            param: "categoria",
            label: "Categoria",
            options: categories.map((c) => ({ value: c.key, label: c.label })),
          },
          {
            param: "destaque",
            label: "Destaque",
            options: [
              { value: "sim", label: "sim" },
              { value: "nao", label: "não" },
            ],
          },
          {
            param: "personalizavel",
            label: "Personalizável",
            options: [
              { value: "sim", label: "sim" },
              { value: "nao", label: "não" },
            ],
          },
          {
            param: "foto",
            label: "Foto",
            options: [
              { value: "com", label: "com foto" },
              { value: "sem", label: "sem foto" },
            ],
          },
          {
            param: "ordenar",
            label: "Ordenar",
            emptyLabel: "Ordenar: recentes",
            options: [
              { value: "nome", label: "nome A–Z" },
              { value: "preco-asc", label: "preço ↑" },
              { value: "preco-desc", label: "preço ↓" },
            ],
          },
        ]}
      />

      {products.length === 0 ? (
        <div className="card p-6 text-center text-sm text-stone-900/55">
          {all.length === 0
            ? "Ainda não há produtos. Cria o primeiro."
            : "Nenhum produto corresponde aos filtros."}
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
                  color={product.colors[0]?.hex ?? "#C7430F"}
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
                  {product.customizable && (
                    <span className="ml-2 rounded-full bg-pine-50 px-2 py-0.5 text-pine-600">
                      Personalizável
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
