import Link from "next/link";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="fixed top-0 w-full border-b border-white/10 bg-black/50 backdrop-blur-md z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex flex-1">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="w-6 h-6 text-purple-400" />
            <span className="font-bold text-lg">Mozoria</span>
          </Link>
        </div>

        <nav className="flex-1 hidden md:flex items-center justify-center space-x-8">
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

        <div className="flex flex-1 justify-end items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              Log in
            </Button>
          </Link>
          <Link href="/login">
            <Button className="bg-purple-600 text-white hover:bg-purple-500">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
