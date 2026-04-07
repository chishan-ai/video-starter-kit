"use client";

import { useMemo, useState } from "react";
import { Plus, UserPlus, Wand2, Loader2, ExternalLink } from "lucide-react";
import {
  useCharacters,
  useCreateCharacter,
  useUpdateProject,
  useGenerateCharacterDesign,
  type Character,
} from "@/hooks/use-project";
import { CharacterCreateWizard } from "@/components/characters/character-create-wizard";

interface CharacterPanelProps {
  projectId: string;
  projectCharacterIds: string[];
  projectStyle?: string;
}

export function CharacterPanel({
  projectId,
  projectCharacterIds,
  projectStyle = "anime",
}: CharacterPanelProps) {
  const { data: allCharacters = [] } = useCharacters();
  const updateProject = useUpdateProject(projectId);
  const [showLibrary, setShowLibrary] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { projectCharacters, availableCharacters } = useMemo(() => {
    const idSet = new Set(projectCharacterIds);
    const project: Character[] = [];
    const available: Character[] = [];
    for (const c of allCharacters) {
      (idSet.has(c.id) ? project : available).push(c);
    }
    return { projectCharacters: project, availableCharacters: available };
  }, [allCharacters, projectCharacterIds]);

  function linkCharacter(characterId: string) {
    updateProject.mutate({
      characterIds: [...projectCharacterIds, characterId],
    });
    setShowLibrary(false);
  }

  function unlinkCharacter(characterId: string) {
    updateProject.mutate({
      characterIds: projectCharacterIds.filter((id) => id !== characterId),
    });
  }

  return (
    <div className="space-y-2">
      {/* Project characters */}
      {projectCharacters.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No characters yet. Add characters for video generation.
        </p>
      ) : (
        <div className="space-y-1.5">
          {projectCharacters.map((char) => (
            <ProjectCharacterCard
              key={char.id}
              character={char}
              projectStyle={projectStyle}
              onUnlink={() => unlinkCharacter(char.id)}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
        {availableCharacters.length > 0 && (
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <UserPlus className="h-3 w-3" />
            Link
          </button>
        )}
      </div>

      {/* Library picker */}
      {showLibrary && availableCharacters.length > 0 && (
        <div className="space-y-1 rounded-md border border-border bg-card p-2">
          <p className="text-[10px] text-muted-foreground">
            Link from your library:
          </p>
          {availableCharacters.map((char) => (
            <button
              key={char.id}
              type="button"
              onClick={() => linkCharacter(char.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent"
            >
              <CharacterAvatar character={char} size="sm" />
              <span>{char.name}</span>
            </button>
          ))}
        </div>
      )}

      <CharacterCreateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        projectId={projectId}
      />
    </div>
  );
}

function ProjectCharacterCard({
  character,
  projectStyle,
  onUnlink,
}: {
  character: Character;
  projectStyle: string;
  onUnlink: () => void;
}) {
  const generateDesign = useGenerateCharacterDesign(character.id);
  const hasRefImages = character.referenceImages.length > 0;
  const hasDescription = character.description.trim().length > 0;

  const statusColor = hasRefImages
    ? "bg-green-500"
    : hasDescription
      ? "bg-yellow-500"
      : "bg-gray-300";

  return (
    <div className="group flex items-start gap-2 rounded-md border border-border bg-secondary p-2">
      {/* Avatar */}
      <CharacterAvatar character={character} size="md" />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium">{character.name}</span>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColor}`} />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {hasRefImages
            ? `${character.referenceImages.length} refs`
            : hasDescription
              ? "Needs design"
              : "New"}
        </p>

        {/* Action buttons */}
        <div className="mt-1.5 flex gap-1">
          {hasDescription && !generateDesign.isPending && (
            <button
              type="button"
              onClick={() =>
                generateDesign.mutate({
                  style: projectStyle as "anime" | "realistic" | "3d",
                  generateSheet: true,
                })
              }
              className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-400 hover:bg-purple-500/20"
            >
              <Wand2 className="mr-0.5 inline h-2.5 w-2.5" />
              Generate
            </button>
          )}
          {generateDesign.isPending && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Generating...
            </span>
          )}
          <a
            href={`/characters/${character.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="mr-0.5 inline h-2.5 w-2.5" />
            Detail
          </a>
          <button
            type="button"
            onClick={onUnlink}
            className="rounded px-1.5 py-0.5 text-[10px] text-red-500/70 hover:bg-red-500/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function CharacterAvatar({
  character,
  size = "sm",
}: {
  character: Character;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-6 w-6" : "h-10 w-10";
  const textSize = size === "sm" ? "text-[10px]" : "text-sm";
  const src = character.thumbnailUrl ?? character.referenceImages[0]?.url ?? null;

  if (src) {
    return (
      <img
        src={src}
        alt={character.name}
        className={`${dim} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground ${textSize}`}
    >
      {character.name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export { CharacterAvatar };
