"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Play,
  Download,
  Sparkles,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  useProject,
  useShots,
  useUpdateProject,
  useSplitScript,
  useGenerateAll,
  useDeleteShot,
  useCharacters,
} from "@/hooks/use-project";
import { useQueryClient } from "@tanstack/react-query";
import { ScriptEditor } from "./script-editor";
import { StoryboardGrid } from "./storyboard-grid";
import { ShotDetailPanel } from "./shot-detail-panel";
import { CharacterPanel } from "./character-panel";
import { MusicPanel } from "./music-panel";
import { VideoPreviewDialog } from "./video-preview-dialog";
import { ExportDialog } from "./export-dialog";
import { CreditsBadge } from "@/components/billing/credits-badge";

interface ProjectEditorProps {
  projectId: string;
}

export function ProjectEditor({ projectId }: ProjectEditorProps) {
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: shots = [], isLoading: shotsLoading } = useShots(projectId);
  const updateProject = useUpdateProject(projectId);
  const splitScript = useSplitScript(projectId);
  const generateAll = useGenerateAll(projectId);
  const deleteShot = useDeleteShot(projectId);
  const { data: allCharacters = [] } = useCharacters();
  const qc = useQueryClient();

  const selectedShot = shots.find((s) => s.id === selectedShotId) ?? null;

  const handleSaveScript = useCallback(
    (script: string) => {
      updateProject.mutate({ script });
    },
    [updateProject],
  );

  const handleSplit = useCallback(
    async (currentScript: string) => {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: currentScript }),
      });
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      splitScript.mutate(undefined, {
        onSuccess: () => {
          setSelectedShotId(null);
        },
      });
    },
    [splitScript, projectId, qc],
  );

  const handleShotUpdate = useCallback(
    async (data: Record<string, unknown>) => {
      if (!selectedShotId) return;
      await fetch(`/api/projects/${projectId}/shots/${selectedShotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      qc.invalidateQueries({ queryKey: ["projects", projectId, "shots"] });
    },
    [selectedShotId, projectId, qc],
  );

  const handleDeleteShot = useCallback(
    (shotId: string) => {
      if (selectedShotId === shotId) setSelectedShotId(null);
      deleteShot.mutate(shotId);
    },
    [selectedShotId, deleteShot],
  );

  const handleGenerateAll = useCallback(() => {
    generateAll.mutate("vidu-q3-i2v");
  }, [generateAll]);

  const { pendingCount, generatingCount, completedCount, completedShots, totalDuration } =
    useMemo(() => {
      type ShotWithVideo = typeof shots[number] & { videoUrl: string };
      return shots.reduce(
        (acc, shot) => {
          if (shot.status === "pending") acc.pendingCount++;
          else if (shot.status === "generating") acc.generatingCount++;
          else if (shot.status === "completed") {
            acc.completedCount++;
            if (shot.videoUrl) acc.completedShots.push(shot as ShotWithVideo);
          }
          acc.totalDuration += shot.duration;
          return acc;
        },
        {
          pendingCount: 0,
          generatingCount: 0,
          completedCount: 0,
          completedShots: [] as ShotWithVideo[],
          totalDuration: 0,
        },
      );
    }, [shots]);

  if (projectLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back
          </a>
          <h1 className="text-lg font-semibold">{project.name}</h1>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground">
            {project.style}
          </span>
          <span className="text-xs text-muted-foreground">
            {project.aspectRatio}
          </span>
        </div>
        <CreditsBadge />
      </header>

      {/* Main 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Characters + Script + Music */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
          <div className="flex-1 overflow-y-auto">
            <Accordion type="multiple" defaultValue={["characters"]} className="px-3 py-2">
              <AccordionItem value="characters" className="border-none">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                  Characters
                  {(project.characterIds?.length ?? 0) > 0 && (
                    <span className="ml-auto mr-2 rounded-full bg-muted px-1.5 text-[10px] font-normal normal-case">
                      {project.characterIds?.length ?? 0}
                    </span>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <CharacterPanel
                    projectId={projectId}
                    projectCharacterIds={project.characterIds ?? []}
                    projectStyle={project.style}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="script" className="border-none">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                  Script
                  {project.script && (
                    <span className="ml-auto mr-2 font-normal normal-case text-[10px]">
                      {project.script.length}c
                    </span>
                  )}
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <ScriptEditor
                    script={project.script}
                    onSave={handleSaveScript}
                    onSplit={handleSplit}
                    isSplitting={splitScript.isPending}
                    saving={updateProject.isPending}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="music" className="border-none">
                <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline">
                  Music
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <MusicPanel project={project} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </aside>

        {/* Center: Shot Grid */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Storyboard
              {shots.length > 0 && (
                <span className="ml-2 text-muted-foreground">
                  ({shots.length} shots · {totalDuration}s total)
                </span>
              )}
            </h3>
            {shots.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {completedCount}/{shots.length} done
                </span>
                {generatingCount > 0 && (
                  <span className="text-yellow-500">
                    {generatingCount} generating
                  </span>
                )}
              </div>
            )}
          </div>

          {shotsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <StoryboardGrid
              shots={shots}
              selectedShotId={selectedShotId}
              onSelectShot={setSelectedShotId}
              onDeleteShot={handleDeleteShot}
              projectId={projectId}
              characters={allCharacters}
            />
          )}

          {/* Errors */}
          {splitScript.error && (
            <p className="mt-3 text-sm text-red-500">
              Split failed: {splitScript.error.message}
            </p>
          )}
          {generateAll.error && (
            <p className="mt-3 text-sm text-red-500">
              {generateAll.error.message}
            </p>
          )}
        </main>

        {/* Right Panel: Shot Detail */}
        {selectedShot && (
          <div className="w-80 shrink-0">
            <ShotDetailPanel
              shot={selectedShot}
              projectId={projectId}
              projectCharacterIds={project.characterIds ?? []}
              onUpdate={handleShotUpdate}
            />
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <footer className="flex items-center justify-between border-t border-border bg-card px-4 py-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {completedCount}/{shots.length} shots
          </span>
          <span>{totalDuration}s total</span>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={generateAll.isPending}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generateAll.isPending
                ? "Submitting..."
                : `Generate All (${pendingCount})`}
            </button>
          )}

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={completedShots.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            Preview
          </button>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            disabled={completedShots.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </footer>

      <VideoPreviewDialog
        shots={completedShots}
        musicUrl={project.musicUrl}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      <ExportDialog
        shots={completedShots}
        projectName={project.name}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </div>
  );
}
