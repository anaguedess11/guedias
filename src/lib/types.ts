export type CategoryKey =
  | "decoracao"
  | "utilidades"
  | "gadgets"
  | "personalizados";

export type ShapeProfile = number[];

export interface ProductColor {
  name: string;
  hex: string;
  /** Material do filamento desta cor. O cliente só escolhe a cor. */
  material?: string;
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
  /** Foto de capa: é sempre a primeira de `images`. */
  imageUrl?: string;
  images: string[];
  customizable: boolean;
  customizationLabel?: string;
  customizationNote?: string;
  profile: ShapeProfile;
  printTimeHours: number;
  dimensions: string;
  featured?: boolean;
  tags?: string[];
  /** Oculto da loja: só aparece no admin e não pode ser comprado. */
  hidden: boolean;
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
  imageUrl?: string;
  colorHex?: string;
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
  image_urls: string[];
  customizable: boolean;
  customization_label: string | null;
  customization_note: string | null;
  profile: number[];
  print_time_hours: number;
  dimensions: string;
  featured: boolean;
  tags: string[];
}

// ─────────────────────────────────────────────────────────────
// Filamentos
// ─────────────────────────────────────────────────────────────
export interface Filament {
  id: string;
  name: string;
  brand: string | null;
  color: string;
  hex: string;
  material: string;
  pricePerKg: number;
  notes: string | null;
  createdAt: string;
}

export interface FilamentWriteInput {
  name: string;
  brand: string | null;
  color: string;
  hex: string;
  material: string;
  price_per_kg_cents: number;
  notes: string | null;
}

// ─────────────────────────────────────────────────────────────
// Configurações gerais da calculadora
// ─────────────────────────────────────────────────────────────
export interface CalculatorSettings {
  machineRate: number;
  laborRate: number;
  failureRatePercent: number;
  feePercent: number;
  feeFixed: number;
  vatPercent: number;
  vatEnabled: boolean;
}

export interface CalculatorSettingsWriteInput {
  machine_rate_cents: number;
  labor_rate_cents: number;
  failure_reserve_percent: number;
  fee_percent: number;
  fee_fixed_cents: number;
  vat_percent: number;
  vat_enabled: boolean;
}

// ─────────────────────────────────────────────────────────────
// Cálculos guardados
// ─────────────────────────────────────────────────────────────
export interface SavedCalculation {
  id: string;
  name: string;
  filamentId: string | null;
  inputs: Record<string, unknown>;
  totalCost: number;
  suggestedPrice: number;
  profit: number;
  marginPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedCalculationWriteInput {
  name: string;
  filament_id: string | null;
  inputs: Record<string, unknown>;
  total_cost_cents: number;
  suggested_price_cents: number;
  profit_cents: number;
  margin_percent: number;
}
