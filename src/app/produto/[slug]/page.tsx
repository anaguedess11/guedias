import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { getCategory } from "@/data/categories";
import { formatPrice } from "@/lib/format";
import { PrintedObject } from "@/components/PrintedObject";
import { ProductVisual } from "@/components/ProductVisual";
import { AddToCartForm } from "@/components/AddToCartForm";
import { ProductCard } from "@/components/ProductCard";

// Sem generateStaticParams: os produtos vivem na base de dados e podem
// mudar (preço, disponibilidade), por isso esta página é sempre renderizada
// no pedido em vez de pré-gerada no build.

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Produto não encontrado — Guedias" };
  return {
    title: `${product.name} — Guedias`,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const related = await getRelatedProducts(product);

  return (
    <div className="container-page py-8 sm:py-12">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-stone-900/45">
        <Link href="/" className="hover:text-stone-900">Início</Link>
        <span>/</span>
        <Link href="/loja" className="hover:text-stone-900">Loja</Link>
        <span>/</span>
        <Link href={`/loja?categoria=${product.category}`} className="hover:text-stone-900">
          {category?.label}
        </Link>
        <span>/</span>
        <span className="text-stone-900/70">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Galeria */}
        <div>
          <ProductVisual
            imageUrl={product.imageUrl}
            profile={product.profile}
            color={product.colors[0]?.hex ?? "#C0663E"}
            className="aspect-square w-full rounded-xl2 shadow-card"
          />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {product.colors.map((c) => (
              <PrintedObject
                key={c.hex}
                profile={product.profile}
                color={c.hex}
                className="aspect-square rounded-xl"
                showLines={false}
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="eyebrow">{category?.label}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-stone-900/60">
            {product.shortDescription}
          </p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-2xl font-semibold text-clay-600">
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-stone-900/45">
              Tempo médio de impressão: {product.printTimeHours}h · {product.dimensions}
            </span>
          </div>

          <div className="mt-8 border-t border-black/5 pt-8">
            <AddToCartForm product={product} />
          </div>

          <div className="mt-10 space-y-6 border-t border-black/5 pt-8">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Descrição</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-900/65">
                {product.description}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Detalhes de impressão</h2>
              <ul className="mt-2 space-y-1.5">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-2 text-sm leading-relaxed text-stone-900/65">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-clay-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Também podes gostar
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
