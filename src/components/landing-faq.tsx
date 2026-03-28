"use client";

import Script from "next/script";
import { useScrollReveal } from "@/components/scroll-reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What can I create with Mozoria?",
    a: "Mozoria lets you create AI anime shorts, storyboard sequences, and animated videos for YouTube and TikTok. Paste a script, define characters with reference images, and Mozoria splits it into shots, generates video for each one, adds voiceover, and exports a finished video.",
  },
  {
    q: "Is Mozoria beginner-friendly? Do I need drawing or editing skills?",
    a: "No drawing or video editing skills required. Mozoria is built for creators who work with scripts and ideas. You write the story, upload character references, and AI handles all the visual production. You just review outputs and pick the best versions.",
  },
  {
    q: "Which AI models does Mozoria use?",
    a: "Mozoria supports Vidu Q3 and Kling 3.0 Pro for video generation, Google Gemini for script analysis and shot splitting, and F5-TTS for voiceover. You can compare outputs from different models side-by-side for each shot and pick the best one.",
  },
  {
    q: "How do you keep characters consistent across scenes?",
    a: "Upload 1–7 reference images per character. Mozoria's AI extracts visual features — facial structure, hair color, outfit, accessories — and injects them into every shot's generation prompt. Characters stay visually consistent from the first frame to the last.",
  },
  {
    q: "Can I edit individual shots without redoing everything?",
    a: "Yes — shot-level editing is Mozoria's core feature. Every shot is independent. Change a description, regenerate video, switch AI models, or adjust voiceover for any single shot without affecting the rest of your project.",
  },
  {
    q: "How do credits work? Do they expire?",
    a: "You get 50 free credits when you sign up — no credit card required. Each video generation costs credits depending on the model and duration. Credits never expire. Paid plans start at $29/month with 500 credits.",
  },
  {
    q: "How long does generation take?",
    a: "A single shot typically generates in 30–90 seconds depending on the AI model. A full 10-shot storyboard can be generated in under 5 minutes. You can generate multiple shots in parallel to speed things up.",
  },
  {
    q: "What aspect ratios and export formats are supported?",
    a: "Mozoria supports 16:9 (landscape for YouTube), 9:16 (portrait for TikTok/Reels), and 1:1 (square for Instagram). Export in 1080p MP4 format ready for direct upload to any platform.",
  },
  {
    q: "Can I use the generated content commercially?",
    a: "Yes. All content generated with Mozoria is yours to use commercially — publish on YouTube, TikTok, or any platform. Paid plans include full commercial usage rights for all generated videos and assets.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function FAQ() {
  const sectionRef = useScrollReveal();

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section ref={sectionRef} className="pt-12 md:pt-16 pb-24 md:pb-32 relative">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <div className="mb-12 reveal text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
              Frequently asked questions
            </h2>
          </div>

          <div className="reveal reveal-delay-1">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-6 transition-colors data-[state=open]:bg-white/[0.06]"
                >
                  <AccordionTrigger className="text-base font-semibold text-gray-200 hover:text-white py-5 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-400 leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
