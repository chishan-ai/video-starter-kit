"use client";

import { useState } from "react";
import { Mic, Volume2 } from "lucide-react";
import { useGenerateVideo, useGenerateTTS } from "@/hooks/use-project";

interface Shot {
  id: string;
  projectId: string;
  order: number;
  description: string;
  duration: number;
  cameraType: string;
  characterIds: string[];
  status: string;
  selectedVersionId: string | null;
  voiceoverText: string | null;
  ttsAudioUrl: string | null;
  videoUrl: string | null;
}

interface ShotDetailPanelProps {
  shot: Shot;
  projectId: string;
  onUpdate: (data: Partial<Shot>) => void;
}

const CAMERA_TYPES = ["wide", "medium", "close-up", "overhead", "low-angle"];

export function ShotDetailPanel({
  shot,
  projectId,
  onUpdate,
}: ShotDetailPanelProps) {
  const [description, setDescription] = useState(shot.description);
  const [voiceoverText, setVoiceoverText] = useState(shot.voiceoverText ?? "");
  const generateVideo = useGenerateVideo(projectId, shot.id);
  const generateTTS = useGenerateTTS(projectId, shot.id);

  const isDirty = description !== shot.description;
  const isVoiceoverDirty = voiceoverText !== (shot.voiceoverText ?? "");

  function handleSave() {
    if (isDirty) {
      onUpdate({ description });
    }
  }

  function handleGenerate(model: string) {
    generateVideo.mutate(model);
  }

  return (
    <div className="flex h-full flex-col border-l border-border bg-background">
      <div className="border-b border-border p-4">
        <h3 className="text-sm font-medium">Shot {shot.order + 1}</h3>
        <span className="text-xs capitalize text-muted-foreground">
          {shot.status}
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Video Preview */}
        {shot.videoUrl ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <video
              key={shot.videoUrl}
              src={shot.videoUrl}
              controls
              playsInline
              className="aspect-video w-full bg-black"
            />
          </div>
        ) : shot.status === "generating" ? (
          <div className="flex aspect-video items-center justify-center rounded-lg border border-border bg-muted">
            <div className="text-center">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">Generating video...</p>
            </div>
          </div>
        ) : null}

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              className="mt-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
            >
              Save
            </button>
          )}
        </div>

        {/* Camera Type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Camera
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CAMERA_TYPES.map((cam) => (
              <button
                key={cam}
                type="button"
                onClick={() =>
                  onUpdate({ cameraType: cam as Shot["cameraType"] })
                }
                className={`rounded-full px-2.5 py-1 text-xs capitalize transition-colors ${
                  shot.cameraType === cam
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cam}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Duration: {shot.duration}s
          </label>
          <input
            type="range"
            min={3}
            max={10}
            value={shot.duration}
            onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>3s</span>
            <span>10s</span>
          </div>
        </div>

        {/* Voiceover */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Mic className="h-3 w-3" />
            Voiceover
          </label>
          <textarea
            value={voiceoverText}
            onChange={(e) => setVoiceoverText(e.target.value)}
            rows={3}
            placeholder="Enter narration text for this shot..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-1.5 flex items-center gap-2">
            {isVoiceoverDirty && (
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    voiceoverText: voiceoverText || null,
                  } as Partial<Shot>)
                }
                className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80"
              >
                Save Text
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                generateTTS.mutate({
                  text: voiceoverText || undefined,
                })
              }
              disabled={!voiceoverText || generateTTS.isPending}
              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {generateTTS.isPending
                ? "Generating..."
                : "Generate Voice — 2 credits"}
            </button>
          </div>
          {shot.ttsAudioUrl && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-secondary/30 p-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <audio src={shot.ttsAudioUrl} controls className="h-8 flex-1" />
            </div>
          )}
          {generateTTS.error && (
            <p className="mt-1 text-xs text-red-500">
              {generateTTS.error.message}
            </p>
          )}
        </div>

        {/* Generate buttons */}
        <div className="space-y-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Generate Video
          </label>
          <button
            type="button"
            onClick={() => handleGenerate("vidu-q3-i2v")}
            disabled={shot.status === "generating" || generateVideo.isPending}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generateVideo.isPending
              ? "Submitting..."
              : "Generate (Vidu Q3) — 10 credits"}
          </button>
          <button
            type="button"
            onClick={() => handleGenerate("kling-3-pro-i2v")}
            disabled={shot.status === "generating" || generateVideo.isPending}
            className="w-full rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            Generate (Kling 3.0) — 30 credits
          </button>
        </div>

        {/* Error */}
        {generateVideo.error && (
          <p className="text-xs text-red-500">{generateVideo.error.message}</p>
        )}
      </div>
    </div>
  );
}
