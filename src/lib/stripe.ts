import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    credits: 50,
    price: 0,
    monthlyPriceId: null,
    annualPriceId: null,
    features: [
      "50 credits/month",
      "2 test shots",
      "720p export",
      "Community support",
    ],
  },
  starter: {
    name: "Starter",
    credits: 500,
    price: 29,
    monthlyPriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? null,
    features: [
      "500 credits/month",
      "5-8 full videos",
      "1080p export",
      "F5-TTS voiceover",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    credits: 1500,
    price: 79,
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? null,
    features: [
      "1,500 credits/month",
      "15-25 full videos",
      "1080p export",
      "All TTS voices",
      "Priority support",
      "Kling 3.0 Pro access",
    ],
  },
  studio: {
    name: "Studio",
    credits: 4000,
    price: 149,
    monthlyPriceId: process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID ?? null,
    annualPriceId: process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID ?? null,
    features: [
      "4,000 credits/month",
      "40-65 full videos",
      "1080p export",
      "All TTS voices",
      "Priority support",
      "Kling 3.0 Pro access",
      "Batch generation",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const CREDIT_PACKS = [
  {
    id: "pack-200",
    credits: 200,
    price: 15,
    priceId: process.env.STRIPE_PACK_200_PRICE_ID ?? null,
  },
  {
    id: "pack-500",
    credits: 500,
    price: 35,
    priceId: process.env.STRIPE_PACK_500_PRICE_ID ?? null,
  },
  {
    id: "pack-1000",
    credits: 1000,
    price: 60,
    priceId: process.env.STRIPE_PACK_1000_PRICE_ID ?? null,
  },
] as const;

export function getPlanByPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.monthlyPriceId === priceId || plan.annualPriceId === priceId) {
      return key as PlanKey;
    }
  }
  return null;
}

export function getCreditPackByPriceId(priceId: string) {
  return CREDIT_PACKS.find((p) => p.priceId === priceId) ?? null;
}
