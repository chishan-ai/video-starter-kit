"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { Mic, Volume2, Users, Check } from "lucide-react";
import {
  useGenerateVideo,
  useGenerateTTS,
  useCharacters,
  useShotVersions,
  useSelectVersion,
  type Shot,
  type Character,
} from "@/hooks/use-project";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

interface ShotDetailPanelProps {
  shot: Shot;
  projectId: string;
  projectCharacterIds: string[];
  onUpdate: (data: Partial<Shot>) => void;
}

const CAMERA_TYPES = ["wide", "medium", "close-up", "overhead", "low-angle"];

export function ShotDetailPanel({
  shot,
  projectId,
  projectCharacterIds,
  onUpdate,
}: ShotDetailPanelProps) {
  const [description, setDescription] = useState(shot.description);
  const [voiceoverText, setVoiceoverText] = useState(shot.voiceoverText ?? "");
  const [mentionOpen, setMentionOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generateVideo = useGenerateVideo(projectId, shot.id);
  const generateTTS = useGenerateTTS(projectId, shot.id);
  const { data: allCharacters = [] } = useCharacters();
  const { data: versions = [] } = useShotVersions(projectId, shot.id);
  const selectVersion = useSelectVersion(projectId, shot.id);

  const isDirty = description !== shot.description;
  const isVoiceoverDirty = voiceoverText !== (shot.voiceoverText ?? "");

  const projectChars = useMemo(() => {
    const idSet = new Set(projectCharacterIds);
    return allCharacters.filter((c) => idSet.has(c.id));
  }, [allCharacters, projectCharacterIds]);

  function handleSave() {
    if (isDirty) {
      onUpdate({ description });
    }
  }

  function handleGenerate(model: string) {
    generateVideo.mutate(model);
  }

  function toggleShotCharacter(charId: string) {
    const current = shot.characterIds ?? [];
    const updated = current.includes(charId)
      ? current.filter((id) => id !== charId)
      : [...current, charId];
    onUpdate({ characterIds: updated } as Partial<Shot>);
  }

  const handleDescriptionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "@" || (e.key === "2" && e.shiftKey)) {
        // Will open after the @ character is inserted
        setTimeout(() => setMentionOpen(true), 0);
      }
    },
    [],
  );

  const handleMentionSelect = useCallback(
    (char: Character) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const pos = textarea.selectionStart;
      const before = description.slice(0, pos);
      const after = description.slice(pos);
      const newText = `${before}${char.name} ${after}`;
      setDescription(newText);
      setMentionOpen(false);

      // Add character to shot if not already included
      const current = shot.characterIds ?? [];
      if (!current.includes(char.id)) {
        onUpdate({ characterIds: [...current, char.id] } as Partial<Shot>);
      }

      // Restore focus
      setTimeout(() => {
        textarea.focus();
        const newPos = pos + char.name.length + 1;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [description, shot.characterIds, onUpdate],
  );

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
              <p className="text-xs text-muted-foreground">
                Generating video...
              </p>
            </div>
          </div>
        ) : null}

        {/* Version Browser */}
        {versions.length > 1 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Versions ({versions.length})
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {versions.map((v) => {
                const isSelected = shot.selectedVersionId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVersion.mutate(v.id)}
                    disabled={selectVersion.isPending}
                    className={`group/v relative shrink-0 overflow-hidden rounded border transition-colors ${
                      isSelected
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <video
                      src={v.videoUrl}
                      muted
                      playsInline
                      className="h-14 w-24 object-cover"
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1 text-[9px] text-white">
                      {v.model.split("/").pop()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description with @ mention */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Description
            <span className="ml-1.5 font-normal text-muted-foreground/60">
              (type @ to reference a character)
            </span>
          </label>
          <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
            <PopoverAnchor asChild>
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                rows={4}
                placeholder="Describe this shot... Type @ to reference a character"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </PopoverAnchor>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0"
              side="bottom"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command>
                <CommandInput placeholder="Search characters..." />
                <CommandList className="max-h-[200px]">
                  <CommandEmpty>No characters found</CommandEmpty>
                  {projectChars.map((char) => (
                    <CommandItem
                      key={char.id}
                      value={char.name}
                      onSelect={() => handleMentionSelect(char)}
                      className="flex items-center gap-2"
                    >
                      {(char.thumbnailUrl ?? char.referenceImages?.[0]?.url) ? (
                        <img
                          src={char.thumbnailUrl ?? char.referenceImages[0]?.url}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px]">
                          {char.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm">{char.name}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {char.referenceImages.length > 0
                          ? `${char.referenceImages.length} refs`
                          : "no refs"}
                      </span>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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

        {/* Characters in this shot */}
        {projectChars.length > 0 && (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="h-3 w-3" />
              Characters in this shot
            </label>
            <div className="flex flex-wrap gap-1.5">
              {projectChars.map((char) => {
                const isActive = (shot.characterIds ?? []).includes(char.id);
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => toggleShotCharacter(char.id)}
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {char.thumbnailUrl || char.referenceImages?.[0]?.url ? (
                      <img
                        src={char.thumbnailUrl ?? char.referenceImages?.[0]?.url}
                        alt=""
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : null}
                    {char.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

          {/* Reference-to-video: multi-character consistency */}
          {shot.characterIds.length > 0 && (
            <>
              <div className="pt-1">
                <p className="text-[10px] text-muted-foreground">
                  Multi-character consistency (uses character reference images):
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate("kling-o1-ref")}
                disabled={shot.status === "generating" || generateVideo.isPending}
                className="w-full rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
              >
                Generate (Kling O1 Ref) — 20 credits
              </button>
              <button
                type="button"
                onClick={() => handleGenerate("vidu-q2-ref")}
                disabled={shot.status === "generating" || generateVideo.isPending}
                className="w-full rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
              >
                Generate (Vidu Q2 Ref) — 15 credits
              </button>
            </>
          )}
        </div>

        {/* Error */}
        {generateVideo.error && (
          <p className="text-xs text-red-500">{generateVideo.error.message}</p>
        )}
      </div>
    </div>
  );
}
