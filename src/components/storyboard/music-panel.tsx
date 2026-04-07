"use client";

import { useState, useEffect } from "react";
import { Music, Loader2 } from "lucide-react";
import {
  useGenerateMusic,
  usePollMusicStatus,
  type Project,
} from "@/hooks/use-project";
import { useQueryClient } from "@tanstack/react-query";

interface MusicPanelProps {
  project: Project;
}

const MOOD_PRESETS = [
  "cinematic orchestral",
  "upbeat indie pop",
  "lo-fi chill",
  "epic dramatic",
  "gentle acoustic",
  "dark ambient",
];

export function MusicPanel({ project }: MusicPanelProps) {
  const [prompt, setPrompt] = useState(project.musicPrompt ?? "");
  const generateMusic = useGenerateMusic(project.id);
  const musicStatus = usePollMusicStatus(project.id, project.musicRequestId);
  const qc = useQueryClient();

  const isGenerating = !!project.musicRequestId && !project.musicUrl;

  useEffect(() => {
    if (musicStatus.data?.status === "completed" || musicStatus.data?.status === "failed") {
      qc.invalidateQueries({ queryKey: ["projects", project.id] });
    }
  }, [musicStatus.data?.status, project.id, qc]);

  function handleGenerate() {
    if (!prompt.trim()) return;
    generateMusic.mutate({ prompt: prompt.trim(), duration: 30 });
  }

  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Music className="h-3 w-3" />
        Background Music
      </label>

      {/* Mood presets */}
      <div className="mb-1.5 flex flex-wrap gap-1">
        {MOOD_PRESETS.map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => setPrompt(mood)}
            className={`rounded-full px-1.5 py-0.5 text-[10px] transition-colors ${
              prompt === mood
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {mood}
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder="Describe the mood..."
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating || generateMusic.isPending}
        className="mt-1.5 w-full rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {generateMusic.isPending
          ? "Submitting..."
          : isGenerating
            ? "Generating..."
            : "Generate Music — 3 credits"}
      </button>

      {/* Generating indicator */}
      {isGenerating && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating music...
        </div>
      )}

      {/* Audio player */}
      {project.musicUrl && (
        <div className="mt-2 rounded-md border border-border bg-secondary/50 p-1.5">
          <audio src={project.musicUrl} controls className="h-7 w-full" />
        </div>
      )}

      {/* Error */}
      {generateMusic.error && (
        <p className="mt-1 text-[10px] text-red-500">
          {generateMusic.error.message}
        </p>
      )}
    </div>
  );
}
