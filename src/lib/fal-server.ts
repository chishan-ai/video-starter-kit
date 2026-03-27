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
} as const;

export type VideoModelKey = keyof typeof VIDEO_MODELS;

export function getModelEndpoint(key: VideoModelKey): string {
  return VIDEO_MODELS[key];
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
