import Link from "next/link";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ProductVisual } from "@/components/ProductVisual";
import { FavoriteButton } from "@/components/FavoriteButton";
import { getCategory } from "@/data/categories";

export function ProductCard({ product }: { product: Product }) {
  const category = getCategory(product.category);

  return (
    <div className="card group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <ProductVisual
            imageUrl={product.imageUrl}
            profile={product.profile}
            color={product.colors[0]?.hex ?? "#C7430F"}
            className="media-zoom h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pine-900/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute bottom-3 left-3 translate-y-2 text-xs font-semibold uppercase tracking-wide text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Ver produto →
          </span>
          {product.customizable && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-clay-700 shadow-soft">
              Personalizável
            </span>
          )}
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-900/45">
            {category?.label}
          </p>
          <h3 className="mt-1 text-[15px] font-medium leading-snug text-stone-900">
            {product.name}
          </h3>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="font-display text-base font-semibold text-clay-600">
              {formatPrice(product.price)}
            </span>
            <div className="flex -space-x-1.5">
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c.hex}
                  className="h-4 w-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </Link>

      {/* Fora do <Link> para o clique alternar o favorito sem navegar. */}
      <FavoriteButton productId={product.id} />
    </div>
  );
}
