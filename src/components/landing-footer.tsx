import Link from "next/link";
import { Film } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 max-w-screen-md md:grid-cols-3 gap-8 mx-auto">
          <div className="flex flex-col items-start">
            <div className="flex items-center space-x-2 mb-4">
              <Film className="w-6 h-6 text-purple-400" />
              <span className="font-bold">Mozoria</span>
            </div>
            <p className="text-sm text-gray-400">
              AI storyboard studio
              <br />
              for anime creators.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link
                  href="#features"
                  className="hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center text-center">
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Mozoria. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
