"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types inferred from schema
export interface Project {
  id: string;
  userId: string;
  name: string;
  style: string;
  aspectRatio: string;
  status: string;
  script: string;
  characterIds: string[];
  musicPrompt: string | null;
  musicUrl: string | null;
  musicRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Shot {
  id: string;
  projectId: string;
  order: number;
  description: string;
  duration: number;
  cameraType: string;
  characterIds: string[];
  status: string;
  selectedVersionId: string | null;
  voiceoverText: string | null;
  ttsAudioUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
}

export interface ShotVersion {
  id: string;
  shotId: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  prompt: string;
  model: string;
  creditsUsed: number;
  externalTaskId: string | null;
  generatedAt: string;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  gender: string | null;
  description: string;
  referenceImages: string[];
  characterSheetUrl: string | null;
  outfitDescription: string | null;
  accessories: { type: string; description: string; imageUrl?: string }[];
  thumbnailUrl: string | null;
  createdAt: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => fetchJson("/api/projects"),
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ["projects", id],
    queryFn: () => fetchJson(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useShots(projectId: string) {
  return useQuery<Shot[]>({
    queryKey: ["projects", projectId, "shots"],
    queryFn: () => fetchJson(`/api/projects/${projectId}/shots`),
    enabled: !!projectId,
    refetchInterval: (query) =>
      query.state.data?.some((s) => s.status === "generating") ? 5000 : false,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      style?: string;
      aspectRatio?: string;
    }) =>
      fetchJson<Project>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) =>
      fetchJson<Project>(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSplitScript(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetchJson<{ shots: Shot[]; totalDuration: number; summary: string }>(
        `/api/projects/${projectId}/split-script`,
        { method: "POST" },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["projects", projectId, "shots"] }),
  });
}

export function useGenerateVideo(projectId: string, shotId: string) {
  return useMutation({
    mutationFn: (model: string = "vidu-q3-i2v") =>
      fetchJson<{
        requestId: string;
        shotId: string;
        model: string;
        creditsUsed: number;
        balance: number;
      }>(`/api/projects/${projectId}/shots/${shotId}/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      }),
  });
}

export function useGenerateAll(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (model: string = "vidu-q3-i2v") =>
      fetchJson<{ submitted: number; failed: number; jobs: unknown[] }>(
        `/api/projects/${projectId}/generate-all`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model }),
        },
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["projects", projectId, "shots"] }),
  });
}

export function useCheckGenerationStatus() {
  return useMutation({
    mutationFn: (data: { requestId: string; shotId: string; model: string }) =>
      fetchJson<{
        status: string;
        version?: ShotVersion;
        videoUrl?: string;
        audioUrl?: string;
        error?: string;
      }>("/api/generation/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });
}

export function useGenerateTTS(projectId: string, shotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { text?: string; model?: string }) =>
      fetchJson<{
        requestId: string;
        shotId: string;
        model: string;
        creditsUsed: number;
        balance: number;
      }>(`/api/projects/${projectId}/shots/${shotId}/generate-tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["projects", projectId, "shots"] }),
  });
}

// ── Music hooks ──

export function useGenerateMusic(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { prompt: string; duration?: number }) =>
      fetchJson<{
        requestId: string;
        model: string;
        creditsUsed: number;
        balance: number;
      }>(`/api/projects/${projectId}/generate-music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function usePollMusicStatus(projectId: string, requestId: string | null) {
  return useQuery<{ status: string; musicUrl?: string }>({
    queryKey: ["projects", projectId, "music-status"],
    queryFn: () =>
      fetchJson(`/api/projects/${projectId}/music-status`, {
        method: "POST",
      }),
    enabled: !!requestId,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "generating" || !s ? 5000 : false;
    },
  });
}

export function useCreditsBalance() {
  return useQuery<{ balance: number }>({
    queryKey: ["credits"],
    queryFn: () => fetchJson("/api/credits"),
    staleTime: 10_000,
  });
}

// ── Character hooks ──

export function useCharacters() {
  return useQuery<Character[]>({
    queryKey: ["characters"],
    queryFn: () => fetchJson("/api/characters"),
  });
}

export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      gender?: string;
      description?: string;
      referenceImages?: string[];
      thumbnailUrl?: string;
    }) =>
      fetchJson<Character>("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["characters"] }),
  });
}

export function useAnalyzeCharacter(characterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageUrl: string) =>
      fetchJson<{ features: Record<string, unknown>; description: string }>(
        `/api/characters/${characterId}/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["characters"] }),
  });
}

export function useGenerateCharacterDesign(characterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { style?: "anime" | "realistic" | "3d"; generateSheet?: boolean }) =>
      fetchJson<{
        character: Character;
        mainImageUrl: string;
        characterSheetUrl?: string;
        creditsUsed: number;
        balance: number;
      }>(`/api/characters/${characterId}/generate-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["characters"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

export function useEditCharacterOutfit(characterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { instruction: string; model?: "flux-kontext-pro" | "flux-kontext-max" }) =>
      fetchJson<{
        character: Character;
        editedImageUrl: string;
        creditsUsed: number;
        balance: number;
      }>(`/api/characters/${characterId}/edit-outfit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["characters"] });
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}

// ── Shot mutations ──

export function useDeleteShot(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shotId: string) =>
      fetchJson(`/api/projects/${projectId}/shots/${shotId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["projects", projectId, "shots"] }),
  });
}

export function useCreateShot(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      description?: string;
      order?: number;
      duration?: number;
      cameraType?: string;
    }) =>
      fetchJson<Shot>(`/api/projects/${projectId}/shots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["projects", projectId, "shots"] }),
  });
}

export function useReorderShots(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      fetchJson(`/api/projects/${projectId}/shots/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["projects", projectId, "shots"] }),
  });
}

// ── Shot version hooks ──

export function useShotVersions(projectId: string, shotId: string | null) {
  return useQuery<ShotVersion[]>({
    queryKey: ["projects", projectId, "shots", shotId, "versions"],
    queryFn: () =>
      fetchJson(`/api/projects/${projectId}/shots/${shotId}/versions`),
    enabled: !!shotId,
  });
}

export function useSelectVersion(projectId: string, shotId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      fetchJson(`/api/projects/${projectId}/shots/${shotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedVersionId: versionId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "shots"] });
      qc.invalidateQueries({
        queryKey: ["projects", projectId, "shots", shotId, "versions"],
      });
    },
  });
}
