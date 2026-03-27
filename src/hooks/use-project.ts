"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types inferred from schema
interface Project {
  id: string;
  userId: string;
  name: string;
  style: string;
  aspectRatio: string;
  status: string;
  script: string;
  characterIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Shot {
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
  createdAt: string;
}

interface ShotVersion {
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

export function useCreditsBalance() {
  return useQuery<{ balance: number }>({
    queryKey: ["credits"],
    queryFn: () => fetchJson("/api/credits"),
    staleTime: 10_000,
  });
}
