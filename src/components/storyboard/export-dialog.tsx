"use client";

import { useState, useCallback } from "react";
import { Download, Check, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import JSZip from "jszip";
import { type Shot } from "@/hooks/use-project";

type ExportShot = Pick<Shot, "id" | "order" | "description" | "videoUrl">;

interface ExportDialogProps {
  shots: ExportShot[];
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportState =
  | { phase: "idle" }
  | { phase: "downloading"; total: number }
  | { phase: "zipping" }
  | { phase: "done"; filename: string }
  | { phase: "error"; message: string };

export function ExportDialog({
  shots,
  projectName,
  open,
  onOpenChange,
}: ExportDialogProps) {
  const [state, setState] = useState<ExportState>({ phase: "idle" });

  const handleExportZip = useCallback(async () => {
    if (shots.length === 0) return;

    const zip = new JSZip();
    const total = shots.length;

    try {
      setState({ phase: "downloading", total });

      const blobs = await Promise.all(
        shots.map(async (shot) => {
          const res = await fetch(shot.videoUrl!);
          if (!res.ok) throw new Error(`Failed to download shot ${shot.order + 1}`);
          return res.blob();
        }),
      );

      blobs.forEach((blob, i) => {
        const mimeType = blob.type || "video/mp4";
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const name = `${String(shots[i].order + 1).padStart(2, "0")}_shot.${ext}`;
        zip.file(name, blob);
      });

      setState({ phase: "zipping" });
      const zipBlob = await zip.generateAsync({ type: "blob" });

      const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
      const filename = `${slug}-export.zip`;
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setState({ phase: "done", filename });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Export failed",
      });
    }
  }, [shots, projectName]);

  const isExporting = state.phase === "downloading" || state.phase === "zipping";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isExporting) onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-base font-semibold">Export Video</DialogTitle>

        {/* Shot summary */}
        <div className="rounded-md border border-border bg-card p-3">
          <div className="flex items-center justify-between text-sm">
            <span>{shots.length} shots ready</span>
            <span className="text-muted-foreground">
              {shots.reduce((sum, s) => sum + (s.description?.length > 0 ? 1 : 0), 0)} with descriptions
            </span>
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto">
            {shots.slice(0, 10).map((shot) => (
              <div
                key={shot.id}
                className="shrink-0 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                Shot {shot.order + 1}
              </div>
            ))}
            {shots.length > 10 && (
              <div className="shrink-0 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{shots.length - 10} more
              </div>
            )}
          </div>
        </div>

        {state.phase === "downloading" && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Downloading {state.total} shots...
          </div>
        )}

        {state.phase === "zipping" && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Compressing zip file...
          </div>
        )}

        {state.phase === "done" && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Saved as {state.filename}
          </div>
        )}

        {state.phase === "error" && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {state.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
          >
            {state.phase === "done" ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleExportZip}
            disabled={isExporting || shots.length === 0}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? "Exporting..." : "Download ZIP"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
