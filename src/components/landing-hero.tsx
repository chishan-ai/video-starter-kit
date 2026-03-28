import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const PLACEHOLDER =
  "A young samurai stands at the edge of a burning village. The wind carries embers past his face...";

export default function Hero() {
  return (
    <section className="relative h-screen flex flex-col justify-end overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/mock/hero-bg.mp4"
        muted
        loop
        playsInline
        autoPlay
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d14] via-[#0c0d14]/70 to-transparent" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-12 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] text-white mb-4">
          From script to anime.
        </h1>
        <p className="text-gray-300 text-base md:text-lg mb-8 max-w-lg mx-auto">
          AI storyboard studio — paste a script, get shots with consistent
          characters, voiceover & video.
        </p>

        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 bg-white/[0.08] backdrop-blur-md border border-white/[0.12] rounded-full px-2 py-2 script-input-glow">
            <input
              type="text"
              placeholder={PLACEHOLDER}
              className="flex-1 bg-transparent text-white placeholder:text-gray-500 text-sm md:text-base focus:outline-none px-4"
            />
            <Link href="/login">
              <Button className="bg-white text-black font-semibold hover:bg-gray-100 rounded-full px-6 h-10 text-sm shrink-0">
                Create
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-5 mt-4 text-xs text-gray-500">
            <span>50 free credits</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>No credit card</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>Start in 30 seconds</span>
          </div>
        </div>
      </div>
    </section>
  );
}
