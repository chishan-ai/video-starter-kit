interface CharacterInfo {
  name: string;
  description: string;
}

interface PromptContext {
  shotDescription: string;
  style: string; // "anime" | "realistic" | "3d" | "mixed"
  cameraType: string;
  characterTags: string[]; // promptTag from character analysis
}

export const STYLE_MODIFIERS: Record<string, string> = {
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

interface ReferencePromptContext {
  shotDescription: string;
  style: string;
  cameraType: string;
  characters: CharacterInfo[];
  provider: "kling" | "vidu";
}

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

/**
 * Build a prompt for reference-to-video endpoints.
 * Kling uses @Element1, @Element2 tags to bind characters to reference images.
 * Vidu relies on semantic matching — character descriptions are embedded directly.
 */
export function buildReferenceVideoPrompt(ctx: ReferencePromptContext): string {
  const parts: string[] = [];

  if (ctx.provider === "kling") {
    // Kling: insert @Element tags for each character
    let desc = ctx.shotDescription;
    ctx.characters.forEach((c, i) => {
      const tag = `@Element${i + 1}`;
      if (c.name && desc.includes(c.name)) {
        desc = desc.replaceAll(c.name, `${c.name} (${tag})`);
      } else {
        parts.push(`${tag} is ${c.name || c.description.slice(0, 50)}`);
      }
    });
    parts.push(desc);
  } else {
    // Vidu: embed character descriptions directly for semantic matching
    ctx.characters.forEach((c) => {
      if (c.description) {
        parts.push(c.description);
      }
    });
    parts.push(ctx.shotDescription);
  }

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

  parts.push("high quality, smooth motion, detailed");

  return parts.join(", ");
}

/** Build the provider-specific input payload for reference-to-video models. */
export function buildReferenceVideoInput(
  provider: "kling" | "vidu",
  charData: { referenceImages: string[] }[],
): Record<string, unknown> {
  if (provider === "kling") {
    return {
      elements: charData.slice(0, 3).map((c) => ({
        frontal_image_url: c.referenceImages[0],
        reference_image_urls: c.referenceImages.slice(0, 3),
      })),
    };
  }
  const allRefs = charData.flatMap((c) => c.referenceImages.slice(0, 3));
  return { reference_image_urls: allRefs.slice(0, 7) };
}
