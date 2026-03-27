"use client";

import { useState, useCallback } from "react";
import {
  useProject,
  useShots,
  useUpdateProject,
  useSplitScript,
  useGenerateAll,
} from "@/hooks/use-project";
import { useQueryClient } from "@tanstack/react-query";
import { ScriptEditor } from "./script-editor";
import { StoryboardGrid } from "./storyboard-grid";
import { ShotDetailPanel } from "./shot-detail-panel";

interface ProjectEditorProps {
  projectId: string;
}

export function ProjectEditor({ projectId }: ProjectEditorProps) {
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: shots = [], isLoading: shotsLoading } = useShots(projectId);
  const updateProject = useUpdateProject(projectId);
  const splitScript = useSplitScript(projectId);
  const generateAll = useGenerateAll(projectId);
  const qc = useQueryClient();

  const selectedShot = shots.find((s) => s.id === selectedShotId) ?? null;

  const handleSaveScript = useCallback(
    (script: string) => {
      updateProject.mutate({ script });
    },
    [updateProject],
  );

  const handleSplit = useCallback(() => {
    splitScript.mutate(undefined, {
      onSuccess: () => {
        setSelectedShotId(null);
      },
    });
  }, [splitScript]);

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

  const handleGenerateAll = useCallback(() => {
    generateAll.mutate("vidu-q3-i2v");
  }, [generateAll]);

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

  const pendingCount = shots.filter((s) => s.status === "pending").length;
  const generatingCount = shots.filter((s) => s.status === "generating").length;
  const completedCount = shots.filter((s) => s.status === "completed").length;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-3">
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
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleGenerateAll}
              disabled={generateAll.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {generateAll.isPending
                ? "Submitting..."
                : `Generate All (${pendingCount} shots)`}
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Script + Storyboard */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Script */}
            <ScriptEditor
              script={project.script}
              onSave={handleSaveScript}
              onSplit={handleSplit}
              isSplitting={splitScript.isPending}
              saving={updateProject.isPending}
            />

            {/* Storyboard */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Storyboard
                  {shots.length > 0 && (
                    <span className="ml-2 text-muted-foreground">
                      ({shots.length} shots ·{" "}
                      {shots.reduce((s, shot) => s + shot.duration, 0)}s total)
                    </span>
                  )}
                </h3>
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
                />
              )}
            </div>

            {/* Generation errors */}
            {generateAll.error && (
              <p className="text-sm text-red-500">
                {generateAll.error.message}
              </p>
            )}
          </div>
        </div>

        {/* Right: Shot detail panel */}
        {selectedShot && (
          <div className="w-80 shrink-0">
            <ShotDetailPanel
              shot={selectedShot as any}
              projectId={projectId}
              onUpdate={handleShotUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
