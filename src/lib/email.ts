import "server-only";
import { Resend } from "resend";
import { formatPrice } from "@/lib/format";

export const isResendConfigured = Boolean(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Guedias <onboarding@resend.dev>";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não está definida.");
  }
  return new Resend(apiKey);
}

export interface EmailOrderItem {
  name: string;
  qty: number;
  price_cents: number;
  color: string | null;
  material: string | null;
  personalization: string | null;
}

export interface EmailOrder {
  id: string;
  email: string;
  shipping_name: string | null;
  shipping_address: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
  } | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
}

function layout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; background:#F7F5F1; padding:32px 16px;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #EFEBE4;">
      <div style="background:#233833; padding:24px 32px;">
        <span style="display:inline-flex; align-items:center; gap:10px;">
          <span style="display:inline-block; width:28px; height:28px; border-radius:9999px; background:#C0663E; color:#fff; font-weight:700; text-align:center; line-height:28px; font-size:14px;">G</span>
          <span style="color:#ffffff; font-size:18px; font-weight:600;">Guedias</span>
        </span>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px; font-size:20px; color:#232320;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px; background:#F7F5F1; font-size:12px; color:#8a8880;">
        Guedias — objetos impressos em 3D, camada a camada.
      </div>
    </div>
  </div>`;
}

function itemsTable(items: EmailOrderItem[]): string {
  const rows = items
    .map((item) => {
      const variant = [item.color, item.material].filter(Boolean).join(" · ");
      const note = item.personalization ? `<br/><em style="color:#8a8880;">“${item.personalization}”</em>` : "";
      return `
      <tr>
        <td style="padding:8px 0; font-size:14px; color:#232320; border-bottom:1px solid #EFEBE4;">
          ${item.qty}× ${item.name}
          ${variant ? `<br/><span style="color:#8a8880; font-size:12px;">${variant}</span>` : ""}
          ${note}
        </td>
        <td style="padding:8px 0; font-size:14px; color:#232320; text-align:right; white-space:nowrap; border-bottom:1px solid #EFEBE4;">
          ${formatPrice((item.price_cents * item.qty) / 100)}
        </td>
      </tr>`;
    })
    .join("");

  return `<table style="width:100%; border-collapse:collapse; margin:16px 0;">${rows}</table>`;
}

function totalsBlock(order: EmailOrder): string {
  return `
  <table style="width:100%; border-collapse:collapse; font-size:14px; color:#5a5850;">
    <tr>
      <td style="padding:4px 0;">Subtotal</td>
      <td style="padding:4px 0; text-align:right;">${formatPrice(order.subtotal_cents / 100)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;">Envio</td>
      <td style="padding:4px 0; text-align:right;">
        ${order.shipping_cents === 0 ? "Grátis" : formatPrice(order.shipping_cents / 100)}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 0 0; font-weight:700; color:#232320; border-top:1px solid #EFEBE4;">Total</td>
      <td style="padding:8px 0 0; font-weight:700; color:#232320; text-align:right; border-top:1px solid #EFEBE4;">
        ${formatPrice(order.total_cents / 100)}
      </td>
    </tr>
  </table>`;
}

export async function sendOrderConfirmationEmail(order: EmailOrder, items: EmailOrderItem[]) {
  if (!isResendConfigured) {
    console.warn("[guedias] RESEND_API_KEY não configurada — email de confirmação não enviado.");
    return;
  }
  if (!order.email) return;

  const address = order.shipping_address;
  const addressLine = address
    ? [address.line1, address.line2, [address.postal_code, address.city].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : null;

  const html = layout(
    "A tua encomenda foi confirmada",
    `
    <p style="color:#5a5850; font-size:14px; line-height:1.6;">
      Obrigada${order.shipping_name ? `, ${order.shipping_name.split(" ")[0]}` : ""}! Recebemos o teu
      pagamento e a encomenda <strong>#${order.id.slice(0, 8)}</strong> vai começar a ser impressa em
      breve na nossa Creality Hi Combo.
    </p>
    ${itemsTable(items)}
    ${totalsBlock(order)}
    ${addressLine ? `<p style="margin-top:20px; font-size:13px; color:#8a8880;">A enviar para: ${addressLine}</p>` : ""}
    `
  );

  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `Encomenda confirmada #${order.id.slice(0, 8)} — Guedias`,
      html,
    });
  } catch (err) {
    console.error("[guedias] falha ao enviar email de confirmação:", err);
  }
}

const STATUS_COPY: Record<string, { subject: string; title: string; message: string }> = {
  in_production: {
    subject: "A tua encomenda está em produção",
    title: "Em produção",
    message: "A tua encomenda entrou em produção — está a ser impressa camada a camada, agora mesmo.",
  },
  shipped: {
    subject: "A tua encomenda foi enviada",
    title: "Enviada",
    message: "A tua encomenda foi enviada e está a caminho.",
  },
  delivered: {
    subject: "A tua encomenda foi entregue",
    title: "Entregue",
    message: "A tua encomenda foi entregue. Esperamos que gostes — obrigada por comprares Guedias!",
  },
};

export async function sendOrderStatusEmail(
  order: EmailOrder,
  status: "in_production" | "shipped" | "delivered"
) {
  if (!isResendConfigured) {
    console.warn("[guedias] RESEND_API_KEY não configurada — email de atualização não enviado.");
    return;
  }
  if (!order.email) return;

  const copy = STATUS_COPY[status];
  const html = layout(
    copy.title,
    `
    <p style="color:#5a5850; font-size:14px; line-height:1.6;">
      Olá${order.shipping_name ? `, ${order.shipping_name.split(" ")[0]}` : ""}. ${copy.message}
    </p>
    <p style="color:#8a8880; font-size:13px; margin-top:16px;">Encomenda #${order.id.slice(0, 8)}</p>
    `
  );

  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `${copy.subject} #${order.id.slice(0, 8)} — Guedias`,
      html,
    });
  } catch (err) {
    console.error("[guedias] falha ao enviar email de atualização:", err);
  }
}
