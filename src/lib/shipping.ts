// Regras de envio partilhadas entre o browser (carrinho/checkout) e o servidor.
// O valor cobrado é sempre recalculado no servidor, em /api/checkout.

export const FREE_SHIPPING_THRESHOLD_CENTS = 3500;
export const STANDARD_SHIPPING_CENTS = 390;
export const EXPRESS_SHIPPING_CENTS = 790;

export type ShippingMethod = "standard" | "expresso" | "maos_coimbra" | "maos_santarem";

export const PICKUP_CITIES: Partial<Record<ShippingMethod, string>> = {
  maos_coimbra: "Coimbra",
  maos_santarem: "Santarém",
};

export function isShippingMethod(value: unknown): value is ShippingMethod {
  return (
    value === "standard" ||
    value === "expresso" ||
    value === "maos_coimbra" ||
    value === "maos_santarem"
  );
}

export function isPickup(method: string | null | undefined): boolean {
  return method === "maos_coimbra" || method === "maos_santarem";
}

export function shippingCostCents(method: ShippingMethod, subtotalCents: number): number {
  if (isPickup(method)) return 0;
  if (method === "expresso") return EXPRESS_SHIPPING_CENTS;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
}

export function shippingMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "standard":
      return "Envio normal";
    case "expresso":
      return "Envio expresso";
    case "maos_coimbra":
      return "Entrega em mão em Coimbra";
    case "maos_santarem":
      return "Entrega em mão em Santarém";
    default:
      return method ?? "";
  }
}
