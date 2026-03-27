"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Providers } from "@/components/providers";

function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [style, setStyle] = useState("anime");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, style, aspectRatio }),
    });

    if (res.ok) {
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-lg border border-border p-8"
      >
        <div>
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Dashboard
          </a>
          <h1 className="mt-4 text-2xl font-bold">New Project</h1>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Project Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="My Anime Short"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Style</label>
          <div className="grid grid-cols-2 gap-2">
            {["anime", "realistic", "3d", "mixed"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                  style === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Aspect Ratio</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "9:16", label: "9:16 (Vertical)" },
              { value: "16:9", label: "16:9 (Horizontal)" },
              { value: "1:1", label: "1:1 (Square)" },
            ].map((ar) => (
              <button
                key={ar.value}
                type="button"
                onClick={() => setAspectRatio(ar.value)}
                className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                  aspectRatio === ar.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || name.trim().length === 0}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Providers>
      <NewProjectForm />
    </Providers>
  );
}
