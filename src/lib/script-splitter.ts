import { getGeminiModel } from "@/lib/gemini";

export interface ShotSuggestion {
  order: number;
  description: string;
  cameraType: "wide" | "medium" | "close-up" | "overhead" | "low-angle";
  duration: number; // 3-10 seconds
  characterIds: string[];
  voiceover?: string;
}

export interface SplitResult {
  shots: ShotSuggestion[];
  totalDuration: number;
  summary: string;
}

function buildPrompt(
  script: string,
  style: string,
  characterDescriptions: { id: string; name: string; promptTag: string }[],
): string {
  const characterList = characterDescriptions
    .map(
      (c) => `- ID: "${c.id}", Name: "${c.name}", Appearance: "${c.promptTag}"`,
    )
    .join("\n");

  return `You are an expert anime storyboard director. Split the following script into 5-8 shots (scenes) for a short video.

## Style
${style} animation style

## Available Characters
${characterList || "No specific characters defined — use generic descriptions."}

## Script
${script}

## Rules
1. Each shot should be 3-10 seconds (default 4s)
2. Use varied camera types for visual interest: wide, medium, close-up, overhead, low-angle
3. Start with an establishing wide shot
4. End with a memorable close-up or wide shot
5. Each shot description should be a detailed visual prompt suitable for AI video generation
6. Include the character's appearance details in each shot description (don't just use names)
7. If a character is in the shot, include their ID in characterIds
8. Optionally add a short voiceover line for TTS

Return ONLY a JSON object:
{
  "shots": [
    {
      "order": 0,
      "description": "Detailed visual description of the shot, including character appearance, action, environment, lighting, mood",
      "cameraType": "wide",
      "duration": 4,
      "characterIds": ["character-uuid"],
      "voiceover": "Optional narration or dialogue for this shot"
    }
  ],
  "totalDuration": 28,
  "summary": "Brief 1-sentence summary of the storyboard"
}`;
}

export async function splitScript(
  script: string,
  style: string,
  characters: { id: string; name: string; promptTag: string }[],
): Promise<SplitResult> {
  const model = getGeminiModel("gemini-2.0-flash");

  const prompt = buildPrompt(script, style, characters);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse storyboard response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as SplitResult;

  // Validate and normalize
  parsed.shots = parsed.shots.map((shot, i) => ({
    ...shot,
    order: i,
    duration: Math.max(3, Math.min(10, shot.duration ?? 4)),
    cameraType: shot.cameraType ?? "medium",
    characterIds: shot.characterIds ?? [],
  }));
  parsed.totalDuration = parsed.shots.reduce((sum, s) => sum + s.duration, 0);

  return parsed;
}
