import { createFalClient } from "@fal-ai/client";

export const falServer = createFalClient({
  credentials: process.env.FAL_KEY,
});

// Model mapping: internal key → fal.ai endpoint
export const VIDEO_MODELS = {
  "vidu-q3-i2v": "fal-ai/vidu/q3/image-to-video",
  "vidu-q3-t2v": "fal-ai/vidu/q3/text-to-video",
  "kling-3-pro-i2v": "fal-ai/kling-video/v3/pro/image-to-video",
  "kling-3-pro-t2v": "fal-ai/kling-video/v3/pro/text-to-video",
  // Reference-to-video: multi-character consistency
  "kling-o1-ref": "fal-ai/kling-video/o1/reference-to-video",
  "vidu-q1-ref": "fal-ai/vidu/q1/reference-to-video",
  "vidu-q2-ref": "fal-ai/vidu/q2/reference-to-video/pro",
} as const;

export type VideoModelKey = keyof typeof VIDEO_MODELS;

export function getModelEndpoint(key: VideoModelKey): string {
  return VIDEO_MODELS[key];
}

export function isReferenceModel(key: string): boolean {
  return key.endsWith("-ref");
}

// Image generation model mapping
export const IMAGE_MODELS = {
  "flux-kontext-pro": "fal-ai/flux-pro/kontext",
  "flux-kontext-max": "fal-ai/flux-pro/kontext/max",
  "kling-image-o1": "fal-ai/kling-image/o1",
  "flux-2-pro": "fal-ai/flux-pro/v1.1",
} as const;

export type ImageModelKey = keyof typeof IMAGE_MODELS;

export function getImageEndpoint(key: ImageModelKey): string {
  return IMAGE_MODELS[key];
}

/** Extract the first image URL from a fal.ai image generation result. */
export function extractImageUrl(result: { data: unknown }): string {
  const url = (result.data as { images: { url: string }[] })?.images?.[0]?.url;
  if (!url) throw new Error("Image generation returned no image");
  return url;
}

// TTS model mapping
export const TTS_MODELS = {
  "f5-tts": "fal-ai/f5-tts",
  "playht-v3": "fal-ai/playht/tts/v3",
} as const;

export type TtsModelKey = keyof typeof TTS_MODELS;

export function getTtsEndpoint(key: TtsModelKey): string {
  return TTS_MODELS[key];
}

export function isTtsModel(model: string): model is TtsModelKey {
  return model in TTS_MODELS;
}

// Music model mapping
export const MUSIC_MODELS = {
  "minimax-music": "fal-ai/minimax-music",
} as const;

export type MusicModelKey = keyof typeof MUSIC_MODELS;

export function getMusicEndpoint(key: MusicModelKey): string {
  return MUSIC_MODELS[key];
}

export function isMusicModel(model: string): model is MusicModelKey {
  return model in MUSIC_MODELS;
}
