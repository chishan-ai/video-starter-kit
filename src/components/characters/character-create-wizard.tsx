"use client";

import { useState, useCallback } from "react";
import { Loader2, Upload, Wand2, ArrowLeft, Check, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateCharacter,
  useGenerateCharacterDesign,
  useUpdateProject,
  useAnalyzeCharacter,
  type Character,
} from "@/hooks/use-project";
import { useRouter } from "next/navigation";

interface CharacterCreateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

type WizardStep = 1 | 2 | 3;

export function CharacterCreateWizard({
  open,
  onOpenChange,
  projectId,
}: CharacterCreateWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<"anime" | "realistic" | "3d">("anime");
  const [entryMode, setEntryMode] = useState<"text" | "upload">("text");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [createdCharacter, setCreatedCharacter] = useState<Character | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCharacter = useCreateCharacter();
  const updateProject = projectId ? useUpdateProject(projectId) : null;

  function reset() {
    setStep(1);
    setName("");
    setDescription("");
    setStyle("anime");
    setEntryMode("text");
    setUploadedUrl(null);
    setCreatedCharacter(null);
    setGeneratedImageUrl(null);
    setGenerating(false);
    setError(null);
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  // Upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/characters/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Upload failed (${res.status})` }));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      setUploadedUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  // Step 1 → Step 2: Create character then generate design
  async function handleNext() {
    setError(null);
    setGenerating(true);

    try {
      // Create the character
      const char = await createCharacter.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        referenceImages: uploadedUrl ? [uploadedUrl] : undefined,
        thumbnailUrl: uploadedUrl || undefined,
      });
      setCreatedCharacter(char);

      // If upload mode and no description, analyze first
      if (entryMode === "upload" && uploadedUrl && !description.trim()) {
        try {
          const analyzeRes = await fetch(`/api/characters/${char.id}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: uploadedUrl }),
          });
          if (analyzeRes.ok) {
            const { features } = await analyzeRes.json();
            if (features?.overallDescription) {
              setDescription(features.overallDescription);
            }
          }
        } catch {
          // Analysis failure is non-blocking
        }
      }

      // Generate design
      if (description.trim() || (entryMode === "upload" && uploadedUrl)) {
        const designRes = await fetch(`/api/characters/${char.id}/generate-design`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style, generateSheet: true }),
        });

        if (designRes.ok) {
          const data = await designRes.json();
          setGeneratedImageUrl(data.mainImageUrl);
          setCreatedCharacter(data.character);
        } else {
          const err = await designRes.json().catch(() => ({ error: `Design generation failed (${designRes.status})` }));
          if (err.error) setError(err.error);
        }
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create character");
    } finally {
      setGenerating(false);
    }
  }

  // Regenerate in step 2
  async function handleRegenerate() {
    if (!createdCharacter) return;
    setError(null);
    setGenerating(true);

    try {
      const res = await fetch(`/api/characters/${createdCharacter.id}/generate-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style, generateSheet: true }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedImageUrl(data.mainImageUrl);
        setCreatedCharacter(data.character);
      } else {
        const err = await res.json().catch(() => ({ error: `Regeneration failed (${res.status})` }));
        setError(err.error || "Regeneration failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setGenerating(false);
    }
  }

  // Step 3 → Done
  function handleConfirm() {
    if (!createdCharacter) return;

    // Auto-link to project if created from project editor
    if (projectId && updateProject) {
      updateProject.mutate({
        characterIds: [createdCharacter.id],
      });
    }

    handleClose(false);

    // If created from dashboard, navigate to detail page
    if (!projectId) {
      router.push(`/characters/${createdCharacter.id}`);
    }
  }

  const canProceedStep1 =
    name.trim().length > 0 &&
    (entryMode === "text"
      ? description.trim().length >= 10
      : !!uploadedUrl);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Create Character"}
            {step === 2 && "Generate Design"}
            {step === 3 && "Confirm"}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Character name"
                maxLength={50}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <Tabs
              value={entryMode}
              onValueChange={(v) => setEntryMode(v as "text" | "upload")}
            >
              <TabsList className="w-full">
                <TabsTrigger value="text" className="flex-1">
                  ✏️ Text Description
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex-1">
                  📷 Upload Image
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the character's appearance, age, hair color, body type, outfit..."
                    rows={4}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    The more detailed, the better the result.{" "}
                    {description.trim().length < 10 && description.trim().length > 0 && (
                      <span className="text-yellow-500">
                        At least 10 characters required.
                      </span>
                    )}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-4 space-y-4">
                {uploadedUrl ? (
                  <div className="flex items-start gap-4">
                    <img
                      src={uploadedUrl}
                      alt="Uploaded"
                      className="h-32 w-24 rounded-md border border-border object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Image uploaded. AI will analyze and generate a description.
                      </p>
                      <button
                        type="button"
                        onClick={() => setUploadedUrl(null)}
                        className="mt-2 text-xs text-red-500 hover:text-red-400"
                      >
                        Remove and re-upload
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-10 transition-colors hover:border-primary/50 hover:bg-card">
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="mt-2 text-sm text-muted-foreground">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground/50" />
                        <span className="mt-2 text-sm text-muted-foreground">
                          Drag and drop or click to upload
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground/60">
                          PNG/JPG, front-facing recommended
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                )}

                {/* Optional description for upload mode */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                    Description (optional, AI will auto-generate)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optionally describe the character..."
                    rows={2}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Style selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Style</label>
              <div className="flex gap-3">
                {(["anime", "realistic", "3d"] as const).map((s) => (
                  <label key={s} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="wizard-style"
                      value={s}
                      checked={style === s}
                      onChange={() => setStyle(s)}
                      className="accent-primary"
                    />
                    <span className="capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceedStep1 || generating || createCharacter.isPending}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {(generating || createCharacter.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {entryMode === "text"
                  ? "Next: Generate Design →"
                  : "Next: AI Analyze & Generate →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: AI Generation */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {generating
                ? `Generating design for "${name}"...`
                : `Design generated for "${name}"`}
            </p>

            {/* Generated image */}
            <div className="flex justify-center">
              {generating ? (
                <div className="space-y-3">
                  <Skeleton className="mx-auto aspect-[3/4] w-[240px] rounded-lg" />
                  <p className="text-center text-xs text-muted-foreground">
                    Generating... ~15-30 seconds
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    Cost: 8 credits
                  </p>
                </div>
              ) : generatedImageUrl ? (
                <div className="text-center">
                  <img
                    src={generatedImageUrl}
                    alt={name}
                    className="mx-auto aspect-[3/4] w-[240px] rounded-lg border-2 border-primary object-cover"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Generated with 8 credits
                  </p>
                </div>
              ) : (
                <div className="flex aspect-[3/4] w-[240px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    Generation skipped
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {error || "You can generate from the detail page"}
                  </p>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Actions */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={generating}
                className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Edit Info
              </button>
              <div className="flex gap-2">
                {!generating && generatedImageUrl && (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Regenerate — 8 cr
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={generating}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && createdCharacter && (
          <div className="space-y-5">
            <div className="flex gap-6">
              {/* Preview */}
              <div className="w-[180px] shrink-0">
                {(generatedImageUrl || createdCharacter.thumbnailUrl) ? (
                  <img
                    src={generatedImageUrl ?? createdCharacter.thumbnailUrl!}
                    alt={name}
                    className="aspect-[3/4] w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="flex-1 space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">Name</span>
                  <p className="font-medium">{name}</p>
                </div>
                {description && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Description
                    </span>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground">Style</span>
                  <p className="text-sm capitalize">{style}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">
                    Reference Images
                  </span>
                  <p className="text-sm">
                    {createdCharacter.referenceImages.length} image(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
                {projectId ? "Save & Add to Project" : "Save Character"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
