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
