import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <Clapperboard className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">
            Mozoria
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white text-sm"
            >
              Log in
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="sm"
              className="bg-white text-black font-semibold hover:bg-gray-200 text-sm rounded-full h-9 px-5"
            >
              Try Mozoria
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
