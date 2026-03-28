"use client";

import { useScrollReveal } from "@/components/scroll-reveal";

const steps = [
  {
    number: "01",
    title: "Paste your script",
    description:
      "Drop your story in. AI analyzes narrative structure and splits it into shots with descriptions, camera angles, and dialogue.",
  },
  {
    number: "02",
    title: "Define characters",
    description:
      "Upload reference images. AI extracts visual features and keeps every character consistent across all shots.",
  },
  {
    number: "03",
    title: "Generate & export",
    description:
      "AI generates video for each shot. Edit independently. Add voiceover. Export in 1080p for YouTube or TikTok.",
  },
];

export default function Workflow() {
  const sectionRef = useScrollReveal();

  return (
    <section id="how-it-works" ref={sectionRef} className="pt-24 md:pt-32 pb-12 md:pb-16 relative">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="mb-16 reveal text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
            Three steps. That&apos;s it.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <div key={step.number} className={`reveal reveal-delay-${i + 1}`}>
              <span className="text-5xl md:text-6xl font-extrabold text-white/[0.06] block mb-4 font-mono-brand">
                {step.number}
              </span>
              <h3 className="text-xl font-bold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
