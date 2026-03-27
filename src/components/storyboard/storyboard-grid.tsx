"use client";

import { ShotCard } from "./shot-card";

interface Shot {
  id: string;
  order: number;
  description: string;
  duration: number;
  cameraType: string;
  status: string;
  selectedVersionId: string | null;
  ttsAudioUrl: string | null;
}

interface StoryboardGridProps {
  shots: Shot[];
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
}

export function StoryboardGrid({
  shots,
  selectedShotId,
  onSelectShot,
}: StoryboardGridProps) {
  if (shots.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            No shots yet. Write a script and click "Split to Shots" to generate
            your storyboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {shots.map((shot) => (
        <ShotCard
          key={shot.id}
          shot={shot}
          isSelected={shot.id === selectedShotId}
          onClick={() => onSelectShot(shot.id)}
        />
      ))}
    </div>
  );
}
