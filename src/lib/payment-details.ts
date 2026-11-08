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

// O valor de exemplo do .env.local.example ("PT50 0000 …") não é um IBAN a sério.
const isPlaceholderIban = /^PT50[\s0]*$/i.test(paymentDetails.bankIban.trim());

// A transferência só é oferecida ao cliente depois de o IBAN estar preenchido. O titular é opcional.
export const isBankTransferAvailable = Boolean(paymentDetails.bankIban.trim()) && !isPlaceholderIban;

/** IBAN em grupos de 4, mais fácil de ler e copiar: PT50 0000 0000 … */
export function formatIban(iban: string): string {
  return iban.replace(/\s/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === "mbway" || value === "transferencia";
}
