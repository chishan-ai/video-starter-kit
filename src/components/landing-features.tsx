"use client";

import { useEffect } from "react";
import { useScrollReveal } from "@/components/scroll-reveal";

const features = [
  {
    title: "Shot-Level Control",
    description:
      "Edit each shot independently — change description, regenerate video, adjust camera angle. No more starting over because one frame looks wrong.",
    video: "/mock/feature-shots.mp4",
  },
  {
    title: "Character Consistency",
    description:
      "Upload reference images. AI extracts facial features, hair, outfit and injects them into every shot. Characters look the same from beginning to end.",
    video: "/mock/feature-character.mp4",
  },
  {
    title: "Multi-Model Generation",
    description:
      "Generate with Vidu, Kling, and more. Compare outputs side-by-side for each shot and pick the best version. Built-in voiceover with F5-TTS.",
    video: "/mock/feature-multimodel.mp4",
  },
];

export default function Features() {
  const sectionRef = useScrollReveal();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const videos = el.querySelectorAll("video");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const video = e.target as HTMLVideoElement;
          if (e.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }),
      { threshold: 0.25 }
    );
    videos.forEach((v) => observer.observe(v));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 md:px-12 space-y-32">
        {features.map((feature, i) => (
          <div key={feature.title} className={`reveal reveal-delay-${(i % 3) + 1}`}>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-0 mb-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white md:w-2/5 shrink-0">
                {feature.title}
              </h3>
              <div className="hidden md:block w-px h-8 bg-gray-700 mx-8 self-center" />
              <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                {feature.description}
              </p>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06]">
              <video
                className="w-full h-full object-cover"
                src={feature.video}
                muted
                loop
                playsInline
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
