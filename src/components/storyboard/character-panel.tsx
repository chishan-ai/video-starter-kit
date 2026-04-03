"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Image,
  Wand2,
  Shirt,
  Loader2,
} from "lucide-react";
import {
  useCharacters,
  useCreateCharacter,
  useUpdateProject,
  useGenerateCharacterDesign,
  useEditCharacterOutfit,
  type Character,
} from "@/hooks/use-project";

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
  const createCharacter = useCreateCharacter();
  const [showLibrary, setShowLibrary] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

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

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const char = await createCharacter.mutateAsync({
        name: newName.trim(),
      });
      updateProject.mutate({
        characterIds: [...projectCharacterIds, char.id],
      });
      setNewName("");
      setShowCreate(false);
    } catch {
      // createCharacter.error is surfaced by React Query
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Characters
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            title="New character"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {availableCharacters.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLibrary((v) => !v)}
              title="Link existing character"
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Create new character */}
      {showCreate && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Character name..."
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || createCharacter.isPending}
              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
            >
              {createCharacter.isPending ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewName("");
              }}
              className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Library picker */}
      {showLibrary && availableCharacters.length > 0 && (
        <div className="space-y-1 rounded-md border border-border bg-muted/30 p-2">
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

      {/* Project characters list */}
      {projectCharacters.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No characters yet. Add characters to use in video generation.
        </p>
      ) : (
        <div className="space-y-1">
          {projectCharacters.map((char) => (
            <CharacterItem
              key={char.id}
              character={char}
              projectStyle={projectStyle}
              onUnlink={() => unlinkCharacter(char.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CharacterItem({
  character,
  projectStyle,
  onUnlink,
}: {
  character: Character;
  projectStyle: string;
  onUnlink: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [outfitInput, setOutfitInput] = useState("");
  const generateDesign = useGenerateCharacterDesign(character.id);
  const editOutfit = useEditCharacterOutfit(character.id);

  const hasRefImages = character.referenceImages.length > 0;
  const hasDescription = character.description.trim().length > 0;

  return (
    <div className="rounded-md border border-border bg-background">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <CharacterAvatar character={character} size="sm" />
        <span className="flex-1 truncate text-xs font-medium">
          {character.name}
        </span>
        {generateDesign.isPending || editOutfit.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : null}
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border px-2 py-2 text-xs">
          {/* Reference images */}
          {hasRefImages && (
            <div className="flex gap-1 overflow-x-auto">
              {character.referenceImages.slice(0, 4).map((img, i) => (
                <img
                  key={`ref-${character.id}-${i}`}
                  src={img.url}
                  alt={`${character.name} ref ${i + 1}`}
                  className="h-12 w-12 rounded object-cover"
                />
              ))}
            </div>
          )}

          {/* Character Sheet */}
          {character.characterSheetUrl && (
            <div>
              <p className="mb-1 text-[10px] text-muted-foreground">
                Character Sheet:
              </p>
              <img
                src={character.characterSheetUrl}
                alt={`${character.name} character sheet`}
                className="w-full rounded border border-border"
              />
            </div>
          )}

          {/* Description */}
          {hasDescription && (
            <p className="text-muted-foreground line-clamp-3">
              {character.description}
            </p>
          )}

          {/* Generate Design button */}
          {hasDescription && (
            <button
              type="button"
              onClick={() =>
                generateDesign.mutate({
                  style: projectStyle as "anime" | "realistic" | "3d",
                  generateSheet: true,
                })
              }
              disabled={generateDesign.isPending}
              className="flex w-full items-center justify-center gap-1.5 rounded border border-purple-500/30 bg-purple-500/10 px-2 py-1.5 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
            >
              {generateDesign.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  {hasRefImages
                    ? "Regenerate Design — 8 credits"
                    : "Generate Design — 8 credits"}
                </>
              )}
            </button>
          )}

          {generateDesign.error && (
            <p className="text-[10px] text-red-500">
              {generateDesign.error.message}
            </p>
          )}

          {/* Edit Outfit */}
          {hasRefImages && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Shirt className="h-3 w-3" />
                Edit Outfit / Accessories
              </div>
              <input
                value={outfitInput}
                onChange={(e) => setOutfitInput(e.target.value)}
                placeholder="e.g. Change to a red evening dress..."
                className="w-full rounded border border-border bg-background px-2 py-1 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && outfitInput.trim()) {
                    editOutfit.mutate({ instruction: outfitInput.trim() });
                    setOutfitInput("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  editOutfit.mutate({ instruction: outfitInput.trim() });
                  setOutfitInput("");
                }}
                disabled={!outfitInput.trim() || editOutfit.isPending}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
              >
                {editOutfit.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Shirt className="h-3 w-3" />
                    Apply Change — 3 credits
                  </>
                )}
              </button>
              {editOutfit.error && (
                <p className="text-[10px] text-red-500">
                  {editOutfit.error.message}
                </p>
              )}
            </div>
          )}

          {/* Outfit description if set */}
          {character.outfitDescription && (
            <p className="text-[10px] italic text-muted-foreground">
              Current outfit: {character.outfitDescription}
            </p>
          )}

          <button
            type="button"
            onClick={onUnlink}
            className="text-[10px] text-red-500 hover:text-red-400"
          >
            Remove from project
          </button>
        </div>
      )}
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
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const src =
    character.thumbnailUrl ?? character.referenceImages[0]?.url ?? null;

  if (src) {
    return (
      <img
        src={src}
        alt={character.name}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full bg-secondary text-secondary-foreground`}
    >
      <Image className="h-3 w-3" />
    </div>
  );
}
