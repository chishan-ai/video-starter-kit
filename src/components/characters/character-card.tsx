"use client";

import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import { type Character } from "@/hooks/use-project";

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const hasRefImages = character.referenceImages.length > 0;
  const hasDescription = character.description.trim().length > 0;
  const imgSrc = character.thumbnailUrl ?? character.referenceImages[0]?.url ?? null;

  // Status indicator
  const statusColor = hasRefImages
    ? "bg-green-500"
    : hasDescription
      ? "bg-yellow-500"
      : "bg-gray-300";

  return (
    <Link
      href={`/characters/${character.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md hover:border-primary/50"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-[4/5] w-full bg-muted">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={character.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="truncate text-sm font-medium">{character.name}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
          <span>
            {hasRefImages
              ? `${character.referenceImages.length} refs`
              : hasDescription
                ? "Needs design"
                : "New"}
          </span>
        </div>
      </div>
    </Link>
  );
}
