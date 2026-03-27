interface PromptContext {
  shotDescription: string;
  style: string; // "anime" | "realistic" | "3d" | "mixed"
  cameraType: string;
  characterTags: string[]; // promptTag from character analysis
}

const STYLE_MODIFIERS: Record<string, string> = {
  anime: "anime style, vibrant colors, clean linework, expressive animation",
  realistic:
    "photorealistic, cinematic lighting, natural movement, high detail",
  "3d": "3D rendered, smooth shading, volumetric lighting, CGI quality",
  mixed:
    "stylized animation, semi-realistic, artistic rendering, dynamic motion",
};

const CAMERA_MODIFIERS: Record<string, string> = {
  wide: "wide establishing shot, full scene visible, environmental context",
  medium: "medium shot, waist-up framing, balanced composition",
  "close-up":
    "close-up shot, face detail, emotional expression, shallow depth of field",
  overhead: "overhead aerial shot, bird's eye view, top-down perspective",
  "low-angle":
    "low angle shot, looking up, dramatic perspective, empowering framing",
};

export function buildVideoPrompt(ctx: PromptContext): string {
  const parts: string[] = [];

  // Character appearance (most important for consistency)
  if (ctx.characterTags.length > 0) {
    parts.push(ctx.characterTags.join(", "));
  }

  // Shot description (the core visual content)
  parts.push(ctx.shotDescription);

  // Camera framing
  const cameraMod = CAMERA_MODIFIERS[ctx.cameraType];
  if (cameraMod) {
    parts.push(cameraMod);
  }

  // Style
  const styleMod = STYLE_MODIFIERS[ctx.style];
  if (styleMod) {
    parts.push(styleMod);
  }

  // Quality boosters
  parts.push("high quality, smooth motion, detailed");

  return parts.join(", ");
}
