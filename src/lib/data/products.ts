import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CategoryKey, Product } from "@/lib/types";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category_key: CategoryKey;
  price_cents: number;
  compare_at_price_cents: number | null;
  short_description: string;
  description: string;
  details: string[] | null;
  materials: string[] | null;
  colors: { name: string; hex: string }[] | null;
  customizable: boolean;
  customization_label: string | null;
  customization_note: string | null;
  profile: number[] | null;
  print_time_hours: number;
  dimensions: string;
  featured: boolean;
  tags: string[] | null;
}

const SELECT_COLUMNS =
  "id, slug, name, category_key, price_cents, compare_at_price_cents, short_description, description, details, materials, colors, customizable, customization_label, customization_note, profile, print_time_hours, dimensions, featured, tags";

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category_key,
    price: row.price_cents / 100,
    compareAtPrice:
      row.compare_at_price_cents != null ? row.compare_at_price_cents / 100 : undefined,
    shortDescription: row.short_description,
    description: row.description,
    details: row.details ?? [],
    materials: row.materials ?? [],
    colors: row.colors ?? [],
    customizable: row.customizable,
    customizationLabel: row.customization_label ?? undefined,
    customizationNote: row.customization_note ?? undefined,
    profile: row.profile ?? [],
    printTimeHours: Number(row.print_time_hours),
    dimensions: row.dimensions,
    featured: row.featured,
    tags: row.tags ?? undefined,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[guedias] erro ao carregar produtos:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(mapRow);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT_COLUMNS)
    .eq("featured", true)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[guedias] erro ao carregar produtos em destaque:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(mapRow);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as ProductRow);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(SELECT_COLUMNS)
    .eq("category_key", product.category)
    .neq("id", product.id)
    .limit(limit);
  if (error) {
    console.error("[guedias] erro ao carregar produtos relacionados:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(mapRow);
}
