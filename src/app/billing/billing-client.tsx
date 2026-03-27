"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, ExternalLink } from "lucide-react";
import { PricingTable } from "@/components/billing/pricing-table";
import { useCreditsBalance } from "@/hooks/use-project";

const CREDIT_PACKS = [
  { id: "pack-200", credits: 200, price: 15 },
  { id: "pack-500", credits: 500, price: 35 },
  { id: "pack-1000", credits: 1000, price: 60 },
];

interface BillingClientProps {
  email: string;
  plan: string;
  balance: number;
  hasStripeCustomer: boolean;
}

export function BillingClient({
  email,
  plan,
  balance: initialBalance,
  hasStripeCustomer,
}: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { data: creditsData } = useCreditsBalance();
  const balance = creditsData?.balance ?? initialBalance;

  async function handleSelectPlan(planKey: string, interval: "month" | "year") {
    if (planKey === "free") return;
    setLoading(planKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription", plan: planKey, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleBuyPack(packId: string) {
    setLoading(packId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "credits", packId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleManageSubscription() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-semibold">Billing</h1>
          </div>
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        {/* Current status */}
        <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card p-6">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-xl font-bold capitalize">{plan}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-sm text-muted-foreground">Credits Balance</p>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <p className="text-xl font-bold">{balance}</p>
            </div>
          </div>
          {hasStripeCustomer && (
            <>
              <div className="h-10 w-px bg-border" />
              <button
                type="button"
                onClick={handleManageSubscription}
                disabled={loading === "portal"}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                Manage Subscription
              </button>
            </>
          )}
        </div>

        {/* Plans */}
        <section>
          <h2 className="mb-6 text-center text-2xl font-bold">
            Choose Your Plan
          </h2>
          <PricingTable
            currentPlan={plan}
            onSelectPlan={handleSelectPlan}
            ctaText={loading ? "Loading..." : "Upgrade"}
          />
        </section>

        {/* Credit packs */}
        <section>
          <h2 className="mb-4 text-xl font-bold">Buy Credits</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Need more credits? Purchase a one-time pack. Credits never expire.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => handleBuyPack(pack.id)}
                disabled={loading === pack.id}
                className="flex items-center justify-between rounded-xl border border-border p-5 text-left transition-colors hover:border-primary/50 hover:bg-accent disabled:opacity-50"
              >
                <div>
                  <p className="text-lg font-bold">{pack.credits} credits</p>
                  <p className="text-sm text-muted-foreground">
                    ${((pack.price / pack.credits) * 100).toFixed(1)} per 100
                  </p>
                </div>
                <span className="text-xl font-bold">${pack.price}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
