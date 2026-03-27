import Header from "@/components/landing-header";
import Hero from "@/components/landing-hero";
import Features from "@/components/landing-features";
import Community from "@/components/landing-community";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";
import Footer from "@/components/landing-footer";

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header />
      <main className="lg:pt-48">
        <Hero />
        <Community />
        <Features />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
