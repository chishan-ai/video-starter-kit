import {
  buildReferenceVideoPrompt,
  buildVideoPrompt,
} from "@/lib/prompt-enhancer";

const NARRATIVE_MODIFIERS: Record<string, string> = {
  establishing:
    "cinematic establishing shot, atmospheric, environmental storytelling",
  rising_action:
    "dynamic composition, building tension, purposeful camera movement",
  emotional_climax:
    "intimate framing, emotional depth, shallow depth of field, dramatic lighting",
  action_peak: "dynamic action shot, fast-paced, high energy, dramatic angles",
  resolution: "peaceful composition, visual closure, atmospheric calm",
  transition: "smooth transition shot, visual bridge between scenes",
  detail: "macro detail shot, precise focus, texture emphasis",
  overview: "wide overview shot, comprehensive scene context",
  step: "clear instructional framing, focused on action",
  item: "balanced showcase framing, clean presentation",
  reveal: "dramatic reveal shot, building anticipation",
  cta: "direct address framing, engaging call to action",
};

function appendNarrativeModifier(
  base: string,
  narrativeIntent?: string,
): string {
  if (!narrativeIntent) return base;
  const mod = NARRATIVE_MODIFIERS[narrativeIntent];
  return mod ? `${base}, ${mod}` : base;
}

export interface ComposeContext {
  shotDescription: string;
  style: string;
  cameraType: string;
  characterTags: string[];
  narrativeIntent?: string;
}

export interface ReferenceComposeContext {
  shotDescription: string;
  style: string;
  cameraType: string;
  characters: { name: string; description: string }[];
  provider: "kling" | "vidu";
  narrativeIntent?: string;
}

export function composeVideoPrompt(ctx: ComposeContext): string {
  const base = buildVideoPrompt({
    shotDescription: ctx.shotDescription,
    style: ctx.style,
    cameraType: ctx.cameraType,
    characterTags: ctx.characterTags,
  });
  return appendNarrativeModifier(base, ctx.narrativeIntent);
}

export function composeReferenceVideoPrompt(
  ctx: ReferenceComposeContext,
): string {
  const base = buildReferenceVideoPrompt({
    shotDescription: ctx.shotDescription,
    style: ctx.style,
    cameraType: ctx.cameraType,
    characters: ctx.characters,
    provider: ctx.provider,
  });
  return appendNarrativeModifier(base, ctx.narrativeIntent);
}
