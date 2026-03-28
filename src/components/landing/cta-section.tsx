"use client";

import Link from "next/link";
import { useScrollReveal } from "@/components/scroll-reveal";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  const sectionRef = useScrollReveal();

  return (
    <section ref={sectionRef} className="py-32 md:py-40 relative text-center">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="reveal">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-white mb-6">
            Start creating now.
          </h2>
          <p className="text-gray-500 text-base mb-10 max-w-md mx-auto">
            50 free credits. No credit card. Start in 30 seconds.
          </p>
          <Link href="/login">
            <Button className="bg-white text-black font-semibold hover:bg-gray-100 rounded-full px-8 h-12 text-base gap-2">
              Try Mozoria Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
