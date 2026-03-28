"use client";

import { useScrollReveal } from "@/components/scroll-reveal";
import { PricingTable } from "@/components/billing/pricing-table";

export function PricingSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="pricing" ref={sectionRef} className="pt-12 md:pt-16 pb-24 md:pb-32 relative">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="mb-16 reveal text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
            Simple pricing.
          </h2>
          <p className="mt-4 text-gray-500 text-base max-w-lg mx-auto">
            50 free credits to start. No credit card required. Credits never expire.
          </p>
        </div>

        <div className="reveal reveal-delay-1">
          <PricingTable showCta={false} />
        </div>
      </div>
    </section>
  );
}
