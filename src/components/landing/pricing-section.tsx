"use client";

import { PricingTable } from "@/components/billing/pricing-table";

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-400">
            Start free. Upgrade when you need more credits. No hidden fees.
          </p>
        </div>

        <PricingTable showCta={false} />

        <div className="mt-12 max-w-xl mx-auto text-center text-sm text-gray-500 space-y-2">
          <p>All plans include 1080p export, character consistency, and AI voiceover.</p>
          <p>Need more credits? Purchase one-time packs anytime. Credits never expire.</p>
        </div>
      </div>
    </section>
  );
}
