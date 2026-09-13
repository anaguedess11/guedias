import "server-only";
import { Resend } from "resend";
import { formatPrice } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import { PAYMENT_METHOD_LABEL, paymentDetails, type PaymentMethod } from "@/lib/payment-details";

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
  const logoUrl = `${getSiteUrl()}/logo-wordmark.png`;
  return `
  <div style="font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; background:#F1EFEC; padding:32px 16px;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #E7E2DB;">
      <div style="background:#ffffff; padding:22px 32px; border-bottom:3px solid #A97464;">
        <img src="${logoUrl}" alt="Guedias" height="28" style="display:block; height:28px; width:auto;" />
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px; font-size:20px; color:#171412;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px; background:#F1EFEC; font-size:12px; color:#8A8480;">
        Guedias — imprime a tua ideia, camada a camada.
      </div>
    </div>
  </div>`;
}

function itemsTable(items: EmailOrderItem[]): string {
  const rows = items
    .map((item) => {
      const variant = [item.color, item.material].filter(Boolean).join(" · ");
      const note = item.personalization ? `<br/><em style="color:#8A8480;">"${item.personalization}"</em>` : "";
      return `
      <tr>
        <td style="padding:8px 0; font-size:14px; color:#171412; border-bottom:1px solid #E7E2DB;">
          ${item.qty}× ${item.name}
          ${variant ? `<br/><span style="color:#8A8480; font-size:12px;">${variant}</span>` : ""}
          ${note}
        </td>
        <td style="padding:8px 0; font-size:14px; color:#171412; text-align:right; white-space:nowrap; border-bottom:1px solid #E7E2DB;">
          ${formatPrice((item.price_cents * item.qty) / 100)}
        </td>
      </tr>`;
    })
    .join("");

  return `<table style="width:100%; border-collapse:collapse; margin:16px 0;">${rows}</table>`;
}

function totalsBlock(order: EmailOrder): string {
  return `
  <table style="width:100%; border-collapse:collapse; font-size:14px; color:#5C5650;">
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
      <td style="padding:8px 0 0; font-weight:700; color:#171412; border-top:1px solid #E7E2DB;">Total</td>
      <td style="padding:8px 0 0; font-weight:700; color:#171412; text-align:right; border-top:1px solid #E7E2DB;">
        ${formatPrice(order.total_cents / 100)}
      </td>
    </tr>
  </table>`;
}

function paymentInstructionsBlock(paymentMethod: PaymentMethod, totalCents: number): string {
  const amount = formatPrice(totalCents / 100);
  if (paymentMethod === "mbway") {
    return `
    <div style="margin-top:20px; padding:16px; border-radius:12px; background:#F8F2EE; border:1px solid #EBD9CC;">
      <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#171412;">Como pagar por MB WAY</p>
      <p style="margin:0; font-size:13px; color:#5C5650; line-height:1.6;">
        Envia ${amount} para o número <strong>${paymentDetails.mbwayPhone || "(a confirmar)"}</strong>
        via MB WAY. Assim que recebermos o pagamento, confirmamos por email.
      </p>
    </div>`;
  }
  return `
  <div style="margin-top:20px; padding:16px; border-radius:12px; background:#F8F2EE; border:1px solid #EBD9CC;">
    <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#171412;">Como pagar por transferência bancária</p>
    <p style="margin:0; font-size:13px; color:#5C5650; line-height:1.6;">
      Titular: <strong>${paymentDetails.bankHolder || "(a confirmar)"}</strong><br/>
      IBAN: <strong>${paymentDetails.bankIban || "(a confirmar)"}</strong>
      ${paymentDetails.bankName ? `<br/>Banco: ${paymentDetails.bankName}` : ""}<br/>
      Valor: <strong>${amount}</strong><br/>
      Descrição: indica o número da encomenda para identificarmos o pagamento.
    </p>
  </div>`;
}

export async function sendOrderReceivedEmail(
  order: EmailOrder,
  items: EmailOrderItem[],
  paymentMethod: PaymentMethod
) {
  if (!isResendConfigured) {
    console.warn("[guedias] RESEND_API_KEY não configurada — email de encomenda recebida não enviado.");
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
    "Recebemos a tua encomenda",
    `
    <p style="color:#5C5650; font-size:14px; line-height:1.6;">
      Obrigada${order.shipping_name ? `, ${order.shipping_name.split(" ")[0]}` : ""}! A tua encomenda
      <strong>#${order.id.slice(0, 8)}</strong> está registada e fica reservada assim que
      confirmarmos o pagamento por ${PAYMENT_METHOD_LABEL[paymentMethod]}.
    </p>
    ${itemsTable(items)}
    ${totalsBlock(order)}
    ${paymentInstructionsBlock(paymentMethod, order.total_cents)}
    ${addressLine ? `<p style="margin-top:20px; font-size:13px; color:#8A8480;">A enviar para: ${addressLine}</p>` : ""}
    `
  );

  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `Encomenda recebida #${order.id.slice(0, 8)} — Guedias`,
      html,
    });
  } catch (err) {
    console.error("[guedias] falha ao enviar email de encomenda recebida:", err);
  }
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
    "O teu pagamento foi confirmado",
    `
    <p style="color:#5C5650; font-size:14px; line-height:1.6;">
      Obrigada${order.shipping_name ? `, ${order.shipping_name.split(" ")[0]}` : ""}! Recebemos o teu
      pagamento e a encomenda <strong>#${order.id.slice(0, 8)}</strong> vai começar a ser impressa em
      breve na nossa Creality Hi Combo.
    </p>
    ${itemsTable(items)}
    ${totalsBlock(order)}
    ${addressLine ? `<p style="margin-top:20px; font-size:13px; color:#8A8480;">A enviar para: ${addressLine}</p>` : ""}
    `
  );

  try {
    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `Pagamento confirmado #${order.id.slice(0, 8)} — Guedias`,
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
    <p style="color:#5C5650; font-size:14px; line-height:1.6;">
      Olá${order.shipping_name ? `, ${order.shipping_name.split(" ")[0]}` : ""}. ${copy.message}
    </p>
    <p style="color:#8A8480; font-size:13px; margin-top:16px;">Encomenda #${order.id.slice(0, 8)}</p>
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
