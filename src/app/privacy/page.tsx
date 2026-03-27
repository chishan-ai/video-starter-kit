import Link from "next/link";
import { Film } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - Mozoria",
  description: "Mozoria Privacy Policy",
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-invert prose-gray max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-500">Last updated: March 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              1. Information We Collect
            </h2>
            <p>
              We collect information you provide when creating an account (email
              address, name) and usage data related to your interaction with the
              Service (projects created, credits used, generation history).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              2. How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide and improve the Service</li>
              <li>Process payments and manage your account</li>
              <li>Send important service notifications</li>
              <li>Analyze usage patterns to improve features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              3. Data Storage
            </h2>
            <p>
              Your data is stored securely using Supabase infrastructure. We use
              industry-standard encryption and security practices to protect
              your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              4. Third-Party Services
            </h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>Supabase</strong> — Authentication and data storage
              </li>
              <li>
                <strong>Stripe</strong> — Payment processing
              </li>
              <li>
                <strong>fal.ai</strong> — AI video and audio generation
              </li>
              <li>
                <strong>Google Gemini</strong> — AI text processing
              </li>
              <li>
                <strong>Vercel</strong> — Hosting and deployment
              </li>
            </ul>
            <p className="mt-2">
              Each service has its own privacy policy governing how they handle
              your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              5. Your Content
            </h2>
            <p>
              Scripts, character images, and generated content you create are
              yours. We do not use your content for training AI models or share
              it with third parties, except as necessary to provide the Service
              (e.g., sending prompts to AI generation APIs).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              6. Cookies
            </h2>
            <p>
              We use essential cookies for authentication and session
              management. We do not use tracking cookies or third-party
              advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              7. Data Deletion
            </h2>
            <p>
              You can request deletion of your account and associated data by
              contacting us. We will process deletion requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              8. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes via email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">
              9. Contact
            </h2>
            <p>
              For privacy-related questions, contact us at{" "}
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
