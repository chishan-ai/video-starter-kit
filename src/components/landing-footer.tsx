import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] py-16">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Brand */}
          <div>
            <span className="font-bold text-white text-base">Mozoria</span>
            <p className="text-sm text-gray-600 mt-2">
              AI storyboard studio for anime creators.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <h4 className="text-xs font-medium text-gray-500 tracking-wider uppercase mb-4">
                Product
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500 tracking-wider uppercase mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.04] text-xs text-gray-700">
          &copy; {new Date().getFullYear()} Mozoria
        </div>
      </div>
    </footer>
  );
}
