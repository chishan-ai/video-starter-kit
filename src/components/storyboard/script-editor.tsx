"use client";

import { useState } from "react";

interface ScriptEditorProps {
  script: string;
  onSave: (script: string) => void;
  onSplit: () => void;
  isSplitting: boolean;
  saving: boolean;
}

export function ScriptEditor({
  script: initialScript,
  onSave,
  onSplit,
  isSplitting,
  saving,
}: ScriptEditorProps) {
  const [script, setScript] = useState(initialScript);
  const isDirty = script !== initialScript;

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
            onClick={onSplit}
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
    </div>
  );
}
