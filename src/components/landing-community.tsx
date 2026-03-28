"use client";

import { useEffect, useRef } from "react";
import { X, Check, Zap } from "lucide-react";

const oldWay = [
  "ChatGPT for scripts",
  "Midjourney for character images",
  "Kling / RunwayML for video",
  "ElevenLabs for voiceover",
  "CapCut to stitch everything",
  "Characters never look the same",
];

const mozoriaWay = [
  "Paste script, AI splits into shots",
  "Upload ref images, characters stay consistent",
  "Generate video per shot, pick best take",
  "AI voiceover built into each shot",
  "One-click export to finished video",
  "Full shot-level control & editing",
];

export default function Community() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("revealed");
        }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    el.querySelectorAll(".reveal").forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-28 relative">
      {/* Section glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(239,68,68,0.04),transparent)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16 reveal">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-red-300/80 uppercase tracking-wider">
              The problem
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
            Stop juggling{" "}
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              5 different tools
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            Most AI anime creators spend 3-4 hours per short video, switching
            between tools and fighting inconsistent characters.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old way */}
          <div className="reveal reveal-delay-1 glass rounded-2xl p-7 relative overflow-hidden group hover:border-red-500/20 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.05] to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-200">
                  The old way
                </h3>
              </div>
              <ul className="space-y-4">
                {oldWay.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <X className="w-4 h-4 text-red-500/60 mt-0.5 shrink-0" />
                    <span className="text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mozoria way */}
          <div className="reveal reveal-delay-2 glass rounded-2xl p-7 relative overflow-hidden group hover:border-emerald-500/20 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-200">
                  With Mozoria
                </h3>
              </div>
              <ul className="space-y-4">
                {mozoriaWay.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-emerald-500/80 mt-0.5 shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
