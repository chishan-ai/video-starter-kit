import {
  type ReferenceImage,
  STYLE_MODIFIERS,
  buildReferenceVideoInput,
  buildReferenceVideoPrompt,
  buildVideoPrompt,
} from "@/lib/prompt-enhancer";

// Re-export for backward compat
export { STYLE_MODIFIERS, buildReferenceVideoInput, type ReferenceImage };
export { CAMERA_MODIFIERS } from "@/lib/prompt-enhancer";

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
};

export interface ComposeContext {
  shotDescription: string;
  style: string;
  cameraType: string;
  characterTags: string[];
  narrativeIntent?: string;
  cameraReason?: string;
}

export interface ReferenceComposeContext {
  shotDescription: string;
  style: string;
  cameraType: string;
  characters: { name: string; description: string }[];
  provider: "kling" | "vidu";
  narrativeIntent?: string;
  cameraReason?: string;
}

export function composeVideoPrompt(ctx: ComposeContext): string {
  const base = buildVideoPrompt({
    shotDescription: ctx.shotDescription,
    style: ctx.style,
    cameraType: ctx.cameraType,
    characterTags: ctx.characterTags,
  });

  if (!ctx.narrativeIntent) {
    return base;
  }

  const narrativeMod = NARRATIVE_MODIFIERS[ctx.narrativeIntent];
  if (!narrativeMod) {
    return base;
  }

  return `${base}, ${narrativeMod}`;
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

  if (!ctx.narrativeIntent) {
    return base;
  }

  const narrativeMod = NARRATIVE_MODIFIERS[ctx.narrativeIntent];
  if (!narrativeMod) {
    return base;
  }

  return `${base}, ${narrativeMod}`;
}
