import Link from "next/link";
import { Film } from "lucide-react";

export const metadata = {
  title: "Terms of Service - Mozoria",
  description: "Mozoria Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="w-6 h-6 text-purple-400" />
            <span className="font-bold text-lg">Mozoria</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-500">Last updated: March 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Mozoria (&quot;the Service&quot;), you agree
              to be bound by these Terms of Service. If you do not agree, please
              do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              2. Description of Service
            </h2>
            <p>
              Mozoria is an AI-powered storyboard studio that helps creators
              turn scripts into animated content. The Service includes script
              splitting, character management, AI video generation, and audio
              synthesis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              3. User Accounts
            </h2>
            <p>
              You must create an account to use the Service. You are responsible
              for maintaining the security of your account and all activities
              that occur under it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              4. Credits and Payments
            </h2>
            <p>
              The Service uses a credit-based system. Credits are consumed when
              generating AI content. Purchased credits do not expire.
              Subscription plans provide monthly credit allocations. Refunds are
              handled according to our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              5. Content Ownership
            </h2>
            <p>
              You retain ownership of the scripts and creative direction you
              provide. AI-generated content (videos, images, audio) created
              through the Service may be used by you for any lawful purpose,
              including commercial use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              6. Acceptable Use
            </h2>
            <p>
              You agree not to use the Service to generate content that is
              illegal, harmful, or violates the rights of others. We reserve the
              right to suspend accounts that violate this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              7. Limitation of Liability
            </h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties. We
              are not liable for any indirect, incidental, or consequential
              damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              8. Changes to Terms
            </h2>
            <p>
              We may update these Terms from time to time. Continued use of the
              Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              9. Contact
            </h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a
                href="mailto:support@mozoria.com"
                className="text-purple-400 hover:text-purple-300"
              >
                support@mozoria.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
