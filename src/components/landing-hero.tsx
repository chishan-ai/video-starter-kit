import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm mb-8">
            <span className="text-purple-300">
              AI-Powered Storyboard Studio
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
            Turn Scripts into Anime
            <br />
            Shot by Shot
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
            Upload your script, define characters, and let AI generate
            storyboards with consistent characters, voiceovers, and video. All
            in one place.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-purple-600 text-white hover:bg-purple-500 min-w-[200px]"
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* App Screenshot Placeholder */}
        <div className="relative group max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 blur-3xl opacity-20" />
          <div className="relative rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-1">
            <div className="rounded-lg bg-black/80 aspect-video flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-24 h-16 rounded bg-purple-500/20 border border-purple-500/30" />
                  <div className="w-24 h-16 rounded bg-purple-500/20 border border-purple-500/30" />
                  <div className="w-24 h-16 rounded bg-purple-500/20 border border-purple-500/30" />
                  <div className="w-24 h-16 rounded bg-purple-500/20 border border-purple-500/30" />
                </div>
                <p className="text-sm text-gray-500">
                  Storyboard Editor Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
