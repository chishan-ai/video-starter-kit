import Header from "@/components/landing-header";
import Hero from "@/components/landing-hero";
import Features from "@/components/landing-features";
import Workflow from "@/components/landing-workflow";
import { PricingSection } from "@/components/landing/pricing-section";
import FAQ from "@/components/landing-faq";
import { CtaSection } from "@/components/landing/cta-section";
import Footer from "@/components/landing-footer";

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-[#0c0d14] text-white relative">
      <Header />
      <main>
        <Hero />
        <Features />
        <Workflow />
        <PricingSection />
        <FAQ />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
