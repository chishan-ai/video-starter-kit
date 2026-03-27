import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-20 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to create your first AI animation?
          </h2>
          <p className="text-gray-400 mb-8">
            50 free credits to start. No credit card required.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-purple-600 text-white hover:bg-purple-500 min-w-[200px]"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
