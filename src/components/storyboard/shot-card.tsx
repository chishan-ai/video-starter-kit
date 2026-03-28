"use client";

import { Mic, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Shot } from "@/hooks/use-project";

interface ShotCardProps {
  shot: Shot;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  generating: "bg-yellow-500/20 text-yellow-500",
  completed: "bg-green-500/20 text-green-500",
  failed: "bg-red-500/20 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  generating: "Generating...",
  completed: "Done",
  failed: "Failed",
};

export function ShotCard({
  shot,
  isSelected,
  onClick,
  onDelete,
}: ShotCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all cursor-pointer",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50",
      )}
    >
      {/* Thumbnail / Video Preview */}
      <div className="relative aspect-video w-full bg-muted">
        {shot.videoUrl ? (
          <video
            src={shot.videoUrl}
            muted
            playsInline
            className="h-full w-full object-cover"
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-muted-foreground">
            {shot.order + 1}
          </div>
        )}

        {/* Status badge */}
        <span
          className={cn(
            "absolute right-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
            STATUS_COLORS[shot.status],
          )}
        >
          {STATUS_LABELS[shot.status]}
        </span>

        {/* Duration badge */}
        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
          {shot.duration}s
        </span>

        {/* Audio indicator */}
        {shot.ttsAudioUrl && (
          <span className="absolute bottom-1 left-1 rounded bg-blue-500/80 p-0.5">
            <Mic className="h-2.5 w-2.5 text-white" />
          </span>
        )}

        {/* Generating animation */}
        {shot.status === "generating" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}

        {/* Delete button — visible on hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute left-1 top-1 rounded bg-red-500/80 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="capitalize">{shot.cameraType}</span>
          <span>·</span>
          <span>Shot {shot.order + 1}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed">
          {shot.description || "No description"}
        </p>
      </div>
    </div>
  );
}
