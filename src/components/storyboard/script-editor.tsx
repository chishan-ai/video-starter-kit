"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

interface ScriptEditorProps {
  script: string;
  onSave: (script: string) => void;
  onSplit: (currentScript: string) => void;
  onCreateVideo: () => void;
  isSplitting: boolean;
  isCreating: boolean;
  saving: boolean;
}

export function ScriptEditor({
  script: initialScript,
  onSave,
  onSplit,
  onCreateVideo,
  isSplitting,
  isCreating,
  saving,
}: ScriptEditorProps) {
  const [script, setScript] = useState(initialScript);
  const isDirty = script !== initialScript;
  const wordCount = script.trim().split(/\s+/).length;
  const estimatedShots = script.trim() ? Math.max(3, Math.min(8, Math.ceil(wordCount / 30))) : 5;
  const estimatedCost = estimatedShots * 10;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Script</h3>
        <div className="flex gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={() => onSave(script)}
              disabled={saving}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Script"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onSplit(script)}
            disabled={isSplitting || script.trim().length === 0}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSplitting ? "Splitting..." : "Split to Shots"}
          </button>
        </div>
      </div>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Write your story here... The AI will split it into 5-8 shots for video generation."
        rows={8}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <p className="text-xs text-muted-foreground">
        {script.length} characters
        {script.trim().length > 0 &&
          ` · ~${Math.ceil(script.trim().split(/\s+/).length / 150)} min read`}
      </p>

      <button
        type="button"
        onClick={onCreateVideo}
        disabled={script.trim().length === 0 || isCreating}
        className="flex w-full flex-col items-center gap-0.5 rounded-md bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          {isCreating ? "Preparing..." : "Create My Video"}
        </span>
        <span className="text-[10px] text-emerald-200">
          ~{estimatedCost} credits est.
        </span>
      </button>
    </div>
  );
}
