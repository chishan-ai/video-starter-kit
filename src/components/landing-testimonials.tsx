"use client";

import { useEffect, useRef } from "react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "I used to spend 4 hours per short switching between tools. With Mozoria, I finish in under an hour with better character consistency.",
    name: "Alex K.",
    role: "AI Anime Channel, 120K subs",
    initials: "AK",
    gradient: "from-amber-500/50 to-orange-600/50",
    borderColor: "hover:border-amber-500/30",
    accentColor: "text-amber-400",
  },
  {
    quote:
      "The shot-level control is a game changer. I can regenerate one bad shot without redoing the whole video. Nothing else lets me do this.",
    name: "Yuki T.",
    role: "Anime Series Creator",
    initials: "YT",
    gradient: "from-purple-500/50 to-violet-600/50",
    borderColor: "hover:border-purple-500/30",
    accentColor: "text-purple-400",
  },
  {
    quote:
      "Finally, my characters actually look the same across shots. I went from posting once a week to three times a week.",
    name: "Marcus D.",
    role: "TikTok Shorts Creator",
    initials: "MD",
    gradient: "from-cyan-500/50 to-teal-600/50",
    borderColor: "hover:border-cyan-500/30",
    accentColor: "text-cyan-400",
  },
];

export default function Testimonials() {
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(6,182,212,0.04),transparent)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16 reveal">
          <p className="text-sm font-medium text-cyan-400/80 tracking-wider uppercase mb-4">
            Creator voices
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Built for creators{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              who ship
            </span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={`reveal reveal-delay-${Math.min(i + 1, 5)}`}
            >
              <div
                className={`group glass rounded-2xl p-6 flex flex-col h-full ${t.borderColor} transition-all duration-300`}
              >
                {/* Quote icon */}
                <Quote className={`w-6 h-6 ${t.accentColor} mb-4 opacity-40`} />

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      className="w-4 h-4 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-sm text-gray-300 leading-relaxed flex-1 mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center`}
                  >
                    <span className="text-xs font-bold text-white/90">
                      {t.initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
