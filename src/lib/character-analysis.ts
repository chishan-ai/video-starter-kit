import { getGeminiModel } from "@/lib/gemini";

export interface CharacterFeatures {
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  clothing: string;
  bodyType: string;
  distinguishingFeatures: string[];
  overallDescription: string;
  promptTag: string; // Compact tag for video generation prompts
}

const ANALYSIS_PROMPT = `You are analyzing an anime/illustration character reference image. Extract the character's visual features in detail.

Return ONLY a JSON object with these fields:
{
  "hairColor": "specific hair color (e.g. 'pink', 'dark blue', 'silver-white')",
  "hairStyle": "hair style description (e.g. 'twin tails', 'short bob', 'long straight')",
  "eyeColor": "eye color (e.g. 'bright blue', 'emerald green')",
  "clothing": "clothing description (e.g. 'dark blue school uniform with white collar')",
  "bodyType": "body type (e.g. 'slim', 'athletic', 'petite')",
  "distinguishingFeatures": ["array of notable features like 'hair ribbon', 'scar on cheek'"],
  "overallDescription": "A 2-3 sentence description of the character's overall appearance",
  "promptTag": "A compact one-line tag for use in video generation prompts, e.g. 'pink twin-tail hair, blue eyes, dark school uniform'"
}

Be specific and accurate. Only describe what you can see in the image.`;

export async function analyzeCharacterImage(
  imageUrl: string,
): Promise<CharacterFeatures> {
  const model = getGeminiModel("gemini-2.0-flash");

  // Fetch image and convert to base64
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = response.headers.get("content-type") ?? "image/png";

  const result = await model.generateContent([
    ANALYSIS_PROMPT,
    {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
  ]);

  const text = result.response.text();
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse character analysis response");
  }

  return JSON.parse(jsonMatch[0]) as CharacterFeatures;
}
