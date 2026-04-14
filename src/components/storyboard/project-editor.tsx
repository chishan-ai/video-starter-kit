"use client";

import { CreditsBadge } from "@/components/billing/credits-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCharacters,
  useCreditsBalance,
  useDeleteShot,
  useGenerateAll,
  useProject,
  useShots,
  useSplitPreview,
  useSplitScript,
  useUpdateProject,
} from "@/hooks/use-project";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, Play, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CharacterPanel } from "./character-panel";
import { ExportDialog } from "./export-dialog";
import { MusicPanel } from "./music-panel";
import { ScriptEditor } from "./script-editor";
import { ShotDetailPanel } from "./shot-detail-panel";
import { StoryboardGrid } from "./storyboard-grid";
import { VideoPreviewDialog } from "./video-preview-dialog";

const INTENT_COLORS: Record<string, string> = {
  establishing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  rising_action: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  emotional_climax: "bg-red-500/20 text-red-400 border-red-500/30",
  action_peak: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  resolution: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  transition: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  detail: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  overview: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  step: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  item: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  reveal: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  cta: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const MODEL_OPTIONS = [
  { value: "vidu-q3-i2v", label: "Vidu Q3", cost: 10 },
  { value: "vidu-q3-t2v", label: "Vidu Q3 (T2V)", cost: 10 },
  { value: "kling-3-pro-i2v", label: "Kling 3 Pro", cost: 30 },
  { value: "kling-3-pro-t2v", label: "Kling 3 Pro (T2V)", cost: 30 },
];

const REF_MODEL_OPTIONS = [
  { value: "kling-o1-ref", label: "Kling O1 Ref", cost: 20 },
  { value: "vidu-q1-ref", label: "Vidu Q1 Ref", cost: 15 },
  { value: "vidu-q2-ref", label: "Vidu Q2 Ref", cost: 15 },
];

interface ProjectEditorProps {
  projectId: string;
}

export function ProjectEditor({ projectId }: ProjectEditorProps) {
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("vidu-q3-i2v");
  const prevGeneratingRef = useRef(false);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: shots = [], isLoading: shotsLoading } = useShots(projectId);
  const updateProject = useUpdateProject(projectId);
  const splitScript = useSplitScript(projectId);
  const splitPreview = useSplitPreview(projectId);
  const generateAll = useGenerateAll(projectId);
  const deleteShot = useDeleteShot(projectId);
  const { data: allCharacters = [] } = useCharacters();
  const { data: creditsData } = useCreditsBalance();
  const qc = useQueryClient();
  const { toast } = useToast();
  const isCommitting = splitScript.isPending || generateAll.isPending;

  const selectedShot = shots.find((s) => s.id === selectedShotId) ?? null;

  const handleSaveScript = useCallback(
    (script: string) => {
      updateProject.mutate({ script });
    },
    [updateProject],
  );

  const handleSplit = useCallback(
    async (currentScript: string) => {
      await updateProject.mutateAsync({ script: currentScript });
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

  // "Create My Video" flow: save script → preview → show dialog
  const handleCreateVideo = useCallback(async () => {
    if (!project?.script?.trim()) return;
    // Save script first if needed, then preview
    splitPreview.mutate(undefined, {
      onSuccess: () => {
        setSelectedModel("vidu-q3-i2v");
        setConfirmOpen(true);
      },
    });
  }, [project, splitPreview]);

  // Confirm: commit shots → generate all
  const handleConfirmCreate = useCallback(async () => {
    try {
      // 1. Commit shots to DB
      await splitScript.mutateAsync(undefined);
      // 2. Generate all with selected model
      await generateAll.mutateAsync(selectedModel);
      setConfirmOpen(false);
    } catch {
      // errors shown via mutation error state
    }
  }, [splitScript, generateAll, selectedModel]);

  // Determine if characters have reference images (show ref models)
  const hasRefImages = useMemo(() => {
    if (!project?.characterIds?.length || !allCharacters.length) return false;
    return allCharacters.some(
      (c) =>
        project.characterIds.includes(c.id) && c.referenceImages?.length > 0,
    );
  }, [project, allCharacters]);

  const availableModels = useMemo(
    () =>
      hasRefImages ? [...MODEL_OPTIONS, ...REF_MODEL_OPTIONS] : MODEL_OPTIONS,
    [hasRefImages],
  );

  const selectedCost =
    availableModels.find((m) => m.value === selectedModel)?.cost ?? 10;

  const {
    pendingCount,
    generatingCount,
    completedCount,
    completedShots,
    totalDuration,
  } = useMemo(() => {
    type ShotWithVideo = (typeof shots)[number] & { videoUrl: string };
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

  // Toast when all generating shots finish
  const isGenerating = generatingCount > 0;
  useEffect(() => {
    if (
      prevGeneratingRef.current &&
      !isGenerating &&
      shots.length > 0 &&
      completedCount > 0
    ) {
      toast({
        title: "Generation complete",
        description: `All ${completedCount} shots generated!`,
      });
    }
    prevGeneratingRef.current = isGenerating;
  }, [isGenerating, shots.length, completedCount, toast]);

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
            <Accordion
              type="multiple"
              defaultValue={["characters"]}
              className="px-3 py-2"
            >
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
                    onCreateVideo={handleCreateVideo}
                    isSplitting={splitScript.isPending}
                    isCreating={splitPreview.isPending}
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

          {generatingCount > 0 && (
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-400">
                  Generating... {completedCount} of {shots.length} complete
                </span>
                <span className="text-muted-foreground">
                  {Math.round((completedCount / (shots.length || 1)) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                  style={{
                    width: `${(completedCount / (shots.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

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

      {/* Create My Video confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-xl border-border bg-[#141b2d]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Create My Video
            </AlertDialogTitle>
            <AlertDialogDescription>
              {splitPreview.data
                ? `AI split your script into ${splitPreview.data.costEstimate.shotCount} shots`
                : "Loading preview..."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {splitPreview.data && (
            <div className="space-y-4">
              {/* Shot list table */}
              <div className="max-h-48 overflow-y-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0f1629]">
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Intent</th>
                      <th className="px-3 py-2 font-medium">Camera</th>
                      <th className="px-3 py-2 font-medium text-right">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {splitPreview.data.shots.map((shot) => (
                      <tr
                        key={shot.order}
                        className="border-b border-border/50"
                      >
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {shot.order}
                        </td>
                        <td className="px-3 py-1.5">
                          <Badge
                            variant="outline"
                            className={
                              INTENT_COLORS[shot.narrativeIntent ?? ""] ??
                              INTENT_COLORS.transition
                            }
                          >
                            {(shot.narrativeIntent ?? "transition").replace(
                              "_",
                              " ",
                            )}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5 capitalize text-muted-foreground">
                          {shot.cameraType}
                        </td>
                        <td className="px-3 py-1.5 text-right text-muted-foreground">
                          {shot.duration}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cost section */}
              <div className="space-y-3 rounded-md border border-border bg-[#0f1629] p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Model</span>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger className="h-8 w-48 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((m) => (
                        <SelectItem
                          key={m.value}
                          value={m.value}
                          className="text-xs"
                        >
                          {m.label} ({m.cost} cr/shot)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span>
                    {splitPreview.data.costEstimate.shotCount} shots &times;{" "}
                    {selectedCost} cr ={" "}
                    <span className="font-semibold text-white">
                      {splitPreview.data.costEstimate.shotCount * selectedCost}{" "}
                      credits
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Your balance</span>
                  <span className="font-semibold">
                    {creditsData?.balance ?? 0} credits
                  </span>
                </div>

                {creditsData &&
                  creditsData.balance <
                    splitPreview.data.costEstimate.shotCount * selectedCost && (
                    <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Only {Math.floor(creditsData.balance / selectedCost)} of{" "}
                      {splitPreview.data.costEstimate.shotCount} shots can
                      generate
                    </div>
                  )}
              </div>

              {/* Errors */}
              {(splitScript.error || generateAll.error) && (
                <p className="text-xs text-red-500">
                  {splitScript.error?.message || generateAll.error?.message}
                </p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCommitting}>
              Cancel
            </AlertDialogCancel>
            <button
              type="button"
              onClick={handleConfirmCreate}
              disabled={isCommitting || !splitPreview.data}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isCommitting
                ? "Creating..."
                : `Confirm (${splitPreview.data ? splitPreview.data.costEstimate.shotCount * selectedCost : 0} cr)`}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
