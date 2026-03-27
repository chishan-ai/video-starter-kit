"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Plan {
  key: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    price: 0,
    credits: 50,
    features: [
      "50 credits/month",
      "2 test shots",
      "720p export",
      "Community support",
    ],
  },
  {
    key: "starter",
    name: "Starter",
    price: 29,
    credits: 500,
    features: [
      "500 credits/month",
      "5-8 full videos",
      "1080p export",
      "F5-TTS voiceover",
      "Email support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 79,
    credits: 1500,
    popular: true,
    features: [
      "1,500 credits/month",
      "15-25 full videos",
      "1080p export",
      "All TTS voices",
      "Priority support",
      "Kling 3.0 Pro access",
    ],
  },
  {
    key: "studio",
    name: "Studio",
    price: 149,
    credits: 4000,
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
];

interface PricingTableProps {
  currentPlan?: string;
  onSelectPlan?: (plan: string, interval: "month" | "year") => void;
  showCta?: boolean;
  ctaText?: string;
}

export function PricingTable({
  currentPlan,
  onSelectPlan,
  showCta = true,
  ctaText = "Get Started",
}: PricingTableProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const discount = interval === "year" ? 0.8 : 1;

  return (
    <div>
      {/* Interval toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setInterval("month")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            interval === "month"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            interval === "year"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Annual
          <span className="ml-1.5 rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-500">
            -20%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const price =
            plan.price === 0 ? 0 : Math.round(plan.price * discount);

          return (
            <div
              key={plan.key}
              className={cn(
                "relative flex flex-col rounded-xl border p-5",
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-semibold">{plan.name}</h3>

              <div className="mt-3">
                <span className="text-3xl font-bold">${price}</span>
                {plan.price > 0 && (
                  <span className="text-sm text-muted-foreground">
                    /{interval === "year" ? "mo" : "mo"}
                  </span>
                )}
                {interval === "year" && plan.price > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ${price * 12}/year
                  </p>
                )}
              </div>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {showCta && (
                <button
                  type="button"
                  onClick={() => onSelectPlan?.(plan.key, interval)}
                  disabled={isCurrent || plan.key === "free"}
                  className={cn(
                    "mt-5 w-full rounded-lg py-2 text-sm font-medium transition-colors",
                    isCurrent
                      ? "cursor-default bg-secondary text-secondary-foreground"
                      : plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border hover:bg-accent",
                    plan.key === "free" && "cursor-default opacity-50",
                  )}
                >
                  {isCurrent
                    ? "Current Plan"
                    : plan.key === "free"
                      ? "Free"
                      : ctaText}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
