"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { type Shot } from "@/hooks/use-project";

type PreviewShot = Pick<Shot, "id" | "order" | "description" | "videoUrl" | "duration">;

interface VideoPreviewDialogProps {
  shots: PreviewShot[];
  musicUrl?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPreviewDialog({
  shots,
  musicUrl,
  open,
  onOpenChange,
}: VideoPreviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentShot = shots[currentIndex];

  // Reset to first shot when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open]);

  // Start/stop BGM with dialog
  useEffect(() => {
    if (!audioRef.current) return;
    if (open && musicUrl) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [open, musicUrl]);

  function handleEnded() {
    if (currentIndex < shots.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onOpenChange(v);
  }

  if (!currentShot) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl p-4">
        <VisuallyHidden>
          <DialogTitle>Video Preview</DialogTitle>
        </VisuallyHidden>

        {currentShot.videoUrl && (
          <video
            key={currentShot.id}
            src={currentShot.videoUrl}
            autoPlay
            controls
            onEnded={handleEnded}
            className="aspect-video w-full rounded-md bg-black"
          />
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">
              Shot {currentShot.order + 1}
            </span>
            <span className="text-muted-foreground">
              ({currentIndex + 1}/{shots.length})
            </span>
            {musicUrl && (
              <button
                type="button"
                onClick={() => {
                  setMusicMuted((m) => !m);
                  if (audioRef.current) audioRef.current.muted = !musicMuted;
                }}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                title={musicMuted ? "Unmute music" : "Mute music"}
              >
                {musicMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
            {currentShot.description}
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {shots.map((shot, i) => (
            <button
              key={shot.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`shrink-0 rounded border px-2 py-1 text-[10px] ${
                i === currentIndex
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {shot.order + 1}
            </button>
          ))}
        </div>

        {musicUrl && (
          <audio
            ref={audioRef}
            src={musicUrl}
            loop
            muted={musicMuted}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
