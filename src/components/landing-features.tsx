import { FileText, Users, Video, Mic } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Script to Storyboard",
    description:
      "Paste your script and AI splits it into shots with descriptions, camera angles, and voiceover text automatically.",
  },
  {
    icon: Users,
    title: "Character Consistency",
    description:
      "Upload reference images and AI extracts features. Every generated shot keeps your characters looking the same.",
  },
  {
    icon: Video,
    title: "AI Video Generation",
    description:
      "Generate video for each shot using Vidu Q3, Kling 3 Pro, and more. Preview, iterate, and pick the best take.",
  },
  {
    icon: Mic,
    title: "AI Voiceover",
    description:
      "Generate natural voiceovers with F5-TTS directly from your shot scripts. No separate tools needed.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Everything you need, in one workflow
          </h2>
          <p className="text-gray-400">
            Stop juggling 4-6 different tools. Mozoria handles the entire
            pipeline from script to final video.
          </p>
        </div>

        <div className="max-w-screen-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-lg border border-white/10 bg-gradient-to-b from-white/5 to-transparent hover:border-purple-500/30 transition-colors"
            >
              <feature.icon className="w-10 h-10 mb-4 text-purple-400" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
