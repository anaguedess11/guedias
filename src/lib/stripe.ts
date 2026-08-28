import "server-only";
import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY não está definida. Configura o .env.local (ver README.md)."
    );
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(secretKey);
  }
  return stripeSingleton;
}

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
