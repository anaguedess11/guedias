import "server-only";
import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import { PAYMENT_METHOD_LABEL, paymentDetails, type PaymentMethod } from "@/lib/payment-details";
import { PICKUP_CITIES, isPickup, type ShippingMethod } from "@/lib/shipping";

// Nomes, moradas e personalizações vêm do cliente: nunca entram em bruto no HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstNameSuffix(order: EmailOrder): string {
  return order.shipping_name ? `, ${escapeHtml(order.shipping_name.split(" ")[0])}` : "";
}

function deliveryBlock(order: EmailOrder): string {
  const style = 'style="margin-top:20px; font-size:13px; color:#8A8480;"';
  if (isPickup(order.shipping_method)) {
    const city = PICKUP_CITIES[order.shipping_method as ShippingMethod];
    return `<p ${style}>Entrega em mão em ${city}. Depois de confirmarmos o pagamento, contactamos-te para combinar o local e a hora.</p>`;
  }
  const address = order.shipping_address;
  if (!address) return "";
  const line = [address.line1, address.line2, [address.postal_code, address.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return line ? `<p ${style}>A enviar para: ${escapeHtml(line)}</p>` : "";
}

const GMAIL_USER = process.env.GMAIL_USER ?? "guediasgeral@gmail.com";
// O Google mostra a palavra-passe de app com espaços, que não fazem parte dela.
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "");

export const isEmailConfigured = Boolean(GMAIL_APP_PASSWORD);

// Uma falha no email nunca pode impedir a encomenda de ficar registada.
async function sendMail(to: string, subject: string, html: string, context: string, replyTo?: string) {
  if (!isEmailConfigured) {
    console.warn(`[guedias] GMAIL_APP_PASSWORD não configurada — ${context} não enviado.`);
    return;
  }
  if (!to) return;

  try {
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transport.sendMail({ from: { name: "Gu3Dias", address: GMAIL_USER }, to, subject, html, replyTo });
  } catch (err) {
    console.error(`[guedias] falha ao enviar ${context}:`, err);
  }
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
  shipping_method?: string | null;
  customer_phone?: string | null;
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
        <img src="${logoUrl}" alt="Gu3Dias" height="28" style="display:block; height:28px; width:auto;" />
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px; font-size:20px; color:#171412;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px; background:#F1EFEC; font-size:12px; color:#8A8480;">
        Gu3Dias — criamos o que imaginas.
      </div>
    </div>
  </div>`;
}

function itemsTable(items: EmailOrderItem[]): string {
  const rows = items
    .map((item) => {
      const variant = escapeHtml([item.color, item.material].filter(Boolean).join(" · "));
      const note = item.personalization
        ? `<br/><em style="color:#8A8480;">"${escapeHtml(item.personalization)}"</em>`
        : "";
      return `
      <tr>
        <td style="padding:8px 0; font-size:14px; color:#171412; border-bottom:1px solid #E7E2DB;">
          ${item.qty}× ${escapeHtml(item.name)}
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
      <td style="padding:4px 0;">${isPickup(order.shipping_method) ? "Entrega em mão" : "Envio"}</td>
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
  const html = layout(
    "Recebemos a tua encomenda",
    `
    <p style="color:#5C5650; font-size:14px; line-height:1.6;">
      Obrigada${firstNameSuffix(order)}! A tua encomenda
      <strong>#${order.id.slice(0, 8)}</strong> está registada e fica reservada assim que
      confirmarmos o pagamento por ${PAYMENT_METHOD_LABEL[paymentMethod]}.
    </p>
    ${itemsTable(items)}
    ${totalsBlock(order)}
    ${paymentInstructionsBlock(paymentMethod, order.total_cents)}
    ${deliveryBlock(order)}
    `
  );

  await sendMail(
    order.email,
    `Encomenda recebida #${order.id.slice(0, 8)} — Gu3Dias`,
    html,
    "email de encomenda recebida"
  );
}

// Aviso interno: vai para a caixa da loja, com o necessário para contactar o cliente.
export async function sendNewOrderNotification(
  order: EmailOrder,
  items: EmailOrderItem[],
  paymentMethod: PaymentMethod
) {
  const adminUrl = `${getSiteUrl()}/admin/encomendas/${order.id}`;
  const delivery = isPickup(order.shipping_method)
    ? `Entrega em mão em ${PICKUP_CITIES[order.shipping_method as ShippingMethod]}`
    : deliveryBlock(order);
  const contact = [order.shipping_name, order.email, order.customer_phone]
    .filter(Boolean)
    .map((value) => escapeHtml(value as string))
    .join("<br/>");

  const html = layout(
    "Nova encomenda",
    `
    <p style="color:#5C5650; font-size:14px; line-height:1.6;">
      Encomenda <strong>#${order.id.slice(0, 8)}</strong>, a aguardar pagamento por
      ${PAYMENT_METHOD_LABEL[paymentMethod]}.
    </p>
    <p style="color:#171412; font-size:14px; line-height:1.6;">${contact}</p>
    ${itemsTable(items)}
    ${totalsBlock(order)}
    <div style="margin-top:20px; font-size:13px; color:#5C5650;">${delivery}</div>
    <p style="margin-top:20px;">
      <a href="${adminUrl}" style="color:#8A5B4C; font-size:14px; font-weight:700;">Abrir a encomenda</a>
    </p>
    `
  );

  await sendMail(
    GMAIL_USER,
    `Nova encomenda #${order.id.slice(0, 8)} — ${formatPrice(order.total_cents / 100)}`,
    html,
    "aviso de nova encomenda"
  );
}

// Aviso interno de uma ideia nova. Responder ao email escreve diretamente ao cliente.
export async function sendCustomRequestNotification(request: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  size: string | null;
  colors: string | null;
  needed_by: string | null;
  quantity: number | null;
  image_paths: string[];
}) {
  const details = [
    ["Tamanho", request.size],
    ["Cores", request.colors],
    ["Para quando", request.needed_by],
    ["Quantidade", request.quantity === null ? null : String(request.quantity)],
    ["Imagens", request.image_paths.length ? String(request.image_paths.length) : null],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${escapeHtml(value as string)}`)
    .join("<br/>");
  const contact = [request.name, request.email, request.phone]
    .filter(Boolean)
    .map((value) => escapeHtml(value as string))
    .join("<br/>");

  const html = layout(
    "Nova ideia",
    `
    <p style="color:#171412; font-size:14px; line-height:1.6;">${contact}</p>
    <p style="color:#5C5650; font-size:14px; line-height:1.6; white-space:pre-wrap;">${escapeHtml(request.description)}</p>
    ${details ? `<p style="color:#5C5650; font-size:13px; line-height:1.6;">${details}</p>` : ""}
    <p style="margin-top:20px;">
      <a href="${getSiteUrl()}/admin/ideias" style="color:#8A5B4C; font-size:14px; font-weight:700;">Abrir no admin</a>
    </p>
    `
  );

  await sendMail(
    GMAIL_USER,
    `Nova ideia de ${request.name.slice(0, 60)} — Imagina a tua peça`,
    html,
    "aviso de nova ideia",
    request.email
  );
}

export async function sendOrderConfirmationEmail(order: EmailOrder, items: EmailOrderItem[]) {
  const html = layout(
    "O teu pagamento foi confirmado",
    `
    <p style="color:#5C5650; font-size:14px; line-height:1.6;">
      Obrigada${firstNameSuffix(order)}! Recebemos o teu
      pagamento e a encomenda <strong>#${order.id.slice(0, 8)}</strong> vai começar a ser impressa em
      breve na nossa Impressora 3D.
    </p>
    ${itemsTable(items)}
    ${totalsBlock(order)}
    ${deliveryBlock(order)}
    `
  );

  await sendMail(
    order.email,
    `Pagamento confirmado #${order.id.slice(0, 8)} — Gu3Dias`,
    html,
    "email de confirmação"
  );
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
    message: "A tua encomenda foi entregue. Esperamos que gostes — obrigada por comprares Gu3Dias!",
  },
};

export async function sendOrderStatusEmail(
  order: EmailOrder,
  status: "in_production" | "shipped" | "delivered"
) {
  const copy =
    status === "shipped" && isPickup(order.shipping_method)
      ? {
          subject: "A tua encomenda está pronta",
          title: "Pronta para entrega",
          message: "A tua encomenda está pronta. Vamos contactar-te para combinar a entrega em mão.",
        }
      : STATUS_COPY[status];
  const html = layout(
    copy.title,
    `
    <p style="color:#5C5650; font-size:14px; line-height:1.6;">
      Olá${firstNameSuffix(order)}. ${copy.message}
    </p>
    <p style="color:#8A8480; font-size:13px; margin-top:16px;">Encomenda #${order.id.slice(0, 8)}</p>
    `
  );

  await sendMail(
    order.email,
    `${copy.subject} #${order.id.slice(0, 8)} — Gu3Dias`,
    html,
    "email de atualização"
  );
}
