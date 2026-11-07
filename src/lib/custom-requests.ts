export type CustomRequestStatus = "new" | "talking" | "accepted" | "declined";

export const CUSTOM_REQUEST_STATUS_LABEL: Record<CustomRequestStatus, string> = {
  new: "Nova",
  talking: "Em conversa",
  accepted: "Aceite",
  declined: "Recusada",
};

export function isCustomRequestStatus(value: unknown): value is CustomRequestStatus {
  return typeof value === "string" && value in CUSTOM_REQUEST_STATUS_LABEL;
}

export const MAX_IDEA_IMAGES = 3;
// A Vercel recusa pedidos acima de ~4,5 MB, por isso as 3 imagens têm de caber nesse limite.
export const MAX_IDEA_IMAGE_BYTES = 1_400_000;
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 2000;

/** Link de WhatsApp para o número indicado. Números de 9 dígitos são tratados como portugueses. */
export function whatsappUrl(phone: string, text: string): string | null {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 9 || digits.length > 15) return null;
  const international = digits.length === 9 ? `351${digits}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(text)}`;
}
