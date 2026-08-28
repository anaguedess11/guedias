import Link from "next/link";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { PrintedObject } from "@/components/PrintedObject";
import { getCategory } from "@/data/categories";

export function ProductCard({ product }: { product: Product }) {
  const category = getCategory(product.category);

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="card group block overflow-hidden hover:shadow-card"
    >
      <div className="relative aspect-[4/5] w-full">
        <PrintedObject
          profile={product.profile}
          color={product.colors[0]?.hex ?? "#C0663E"}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.customizable && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-clay-700 shadow-soft">
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
          <span className="font-display text-base font-semibold text-stone-900">
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
  );
}
