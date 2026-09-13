export type PaymentMethod = "mbway" | "transferencia";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  mbway: "MB WAY",
  transferencia: "Transferência bancária",
};

// Preenche estes dados nas variáveis de ambiente (ver .env.local.example)
// com o teu número MB WAY e os dados da tua conta bancária.
export const paymentDetails = {
  mbwayPhone: process.env.NEXT_PUBLIC_MBWAY_PHONE ?? "",
  bankHolder: process.env.NEXT_PUBLIC_BANK_HOLDER ?? "",
  bankIban: process.env.NEXT_PUBLIC_BANK_IBAN ?? "",
  bankName: process.env.NEXT_PUBLIC_BANK_NAME ?? "",
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "mbway" || value === "transferencia";
}
