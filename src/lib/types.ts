export type CategoryKey =
  | "decoracao"
  | "utilidades"
  | "gadgets"
  | "personalizados";

export type ShapeProfile = number[];

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategoryKey;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  details: string[];
  materials: string[];
  colors: ProductColor[];
  imageUrl?: string;
  customizable: boolean;
  customizationLabel?: string;
  customizationNote?: string;
  profile: ShapeProfile;
  printTimeHours: number;
  dimensions: string;
  featured?: boolean;
  tags?: string[];
}

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  material: string;
  personalization?: string;
  profile: ShapeProfile;
  qty: number;
}

export interface Category {
  key: CategoryKey;
  label: string;
  description: string;
}

// Forma "pronta para a BD" usada pelo formulário de administração e pelas
// Server Actions de criar/editar produto.
export interface ProductWriteInput {
  slug: string;
  name: string;
  category_key: CategoryKey;
  price_cents: number;
  compare_at_price_cents: number | null;
  short_description: string;
  description: string;
  details: string[];
  materials: string[];
  colors: ProductColor[];
  image_url: string | null;
  customizable: boolean;
  customization_label: string | null;
  customization_note: string | null;
  profile: number[];
  print_time_hours: number;
  dimensions: string;
  featured: boolean;
  tags: string[];
}
