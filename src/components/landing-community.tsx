import { Frown, Shuffle, Clock, DollarSign } from "lucide-react";

const painPoints = [
  {
    icon: Shuffle,
    title: "Too Many Tools",
    description:
      "ChatGPT for scripts, Midjourney for images, RunwayML for video, ElevenLabs for voice... the workflow is fragmented.",
  },
  {
    icon: Frown,
    title: "Characters Never Match",
    description:
      "Every generation gives you a different face. Maintaining character consistency across shots is nearly impossible.",
  },
  {
    icon: Clock,
    title: "Hours of Manual Work",
    description:
      "Switching between tools, re-uploading assets, and manually syncing audio eats up your creative time.",
  },
  {
    icon: DollarSign,
    title: "Costs Add Up Fast",
    description:
      "Separate subscriptions for each tool. One short video can cost $50+ across multiple platforms.",
  },
];

export default function Community() {
  return (
    <section className="py-20 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Tired of juggling 4-6 AI tools?
          </h2>
          <p className="text-gray-400">
            Most AI animation creators face these problems every day.
            Mozoria solves them all in one place.
          </p>
        </div>

        <div className="max-w-screen-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="p-6 rounded-lg border border-red-500/10 bg-gradient-to-b from-red-500/5 to-transparent"
            >
              <point.icon className="w-10 h-10 mb-4 text-red-400/80" />
              <h3 className="text-xl font-semibold mb-2">{point.title}</h3>
              <p className="text-gray-400">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
