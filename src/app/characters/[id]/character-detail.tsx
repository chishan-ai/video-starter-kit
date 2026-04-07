"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  Upload,
  Wand2,
  Loader2,
  Shirt,
  UserCircle,
  ChevronRight,
  Plus,
  X,
  Gem,
} from "lucide-react";
import {
  useCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useGenerateCharacterDesign,
  useEditCharacterOutfit,
} from "@/hooks/use-project";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CreditsBadge } from "@/components/billing/credits-badge";

interface CharacterDetailProps {
  characterId: string;
}

const ACCESSORY_TYPES = [
  "hat",
  "glasses",
  "necklace",
  "earrings",
  "bracelet",
  "bag",
  "scarf",
  "belt",
  "watch",
  "other",
] as const;

export function CharacterDetail({ characterId }: CharacterDetailProps) {
  const router = useRouter();
  const { data: character, isLoading } = useCharacter(characterId);
  const updateCharacter = useUpdateCharacter(characterId);
  const deleteCharacter = useDeleteCharacter(characterId);
  const generateDesign = useGenerateCharacterDesign(characterId);
  const editOutfit = useEditCharacterOutfit(characterId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [outfitDescription, setOutfitDescription] = useState("");
  const [style, setStyle] = useState<"anime" | "realistic" | "3d">("anime");
  const [outfitInput, setOutfitInput] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Accessory form state
  const [newAccessoryType, setNewAccessoryType] = useState<string>("hat");
  const [newAccessoryDesc, setNewAccessoryDesc] = useState("");

  // Initialize form when data loads
  if (character && !initialized) {
    setName(character.name);
    setDescription(character.description);
    setOutfitDescription(character.outfitDescription ?? "");
    setInitialized(true);
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Character not found</p>
      </div>
    );
  }

  const hasRefImages = character.referenceImages.length > 0;
  const mainImage =
    character.thumbnailUrl ?? character.referenceImages[0]?.url ?? null;

  const isDirty =
    name !== character.name ||
    description !== character.description ||
    outfitDescription !== (character.outfitDescription ?? "");

  async function handleSave() {
    await updateCharacter.mutateAsync({
      name: name.trim(),
      description: description.trim(),
      outfitDescription: outfitDescription.trim() || undefined,
    });
  }

  async function handleDelete() {
    if (!confirm("Delete this character? This cannot be undone.")) return;
    await deleteCharacter.mutateAsync();
    router.push("/dashboard");
  }

  async function handleEditOutfit() {
    if (!outfitInput.trim()) return;
    await editOutfit.mutateAsync({ instruction: outfitInput.trim() });
    setOutfitInput("");
  }

  function handleAddAccessory() {
    if (!newAccessoryDesc.trim()) return;
    const current = character?.accessories ?? [];
    const newAcc = {
      type: newAccessoryType,
      description: newAccessoryDesc.trim(),
    };
    updateCharacter.mutate({ accessories: [...current, newAcc] });
    setNewAccessoryDesc("");
  }

  function handleRemoveAccessory(index: number) {
    const current = character?.accessories ?? [];
    const updated = current.filter((_, i) => i !== index);
    updateCharacter.mutate({ accessories: updated });
  }

  // Group reference images by angle
  const angleOrder = ["front", "right", "back", "left", "custom"] as const;
  const refByAngle = angleOrder.map((angle) => ({
    angle,
    images: character.referenceImages.filter((img) => img.angle === angle),
  }));

  // Outfit-edited images from referenceImages history
  const outfitImages = character.referenceImages.filter(
    (img) => img.label === "outfit edit",
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Characters
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-semibold">{character.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <CreditsBadge />
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteCharacter.isPending}
              className="flex items-center gap-1 rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* L1: Main image + Basic info (two-column) */}
        <div className="flex gap-8">
          {/* Left: Main image */}
          <div className="w-[360px] shrink-0">
            {mainImage ? (
              <div className="group relative overflow-hidden rounded-lg border border-border">
                <img
                  src={mainImage}
                  alt={character.name}
                  className="aspect-[3/4] w-full object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() =>
                      generateDesign.mutate({
                        style,
                        generateSheet: true,
                      })
                    }
                    disabled={generateDesign.isPending}
                    className="mb-4 flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-white disabled:opacity-50"
                  >
                    {generateDesign.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border">
                <UserCircle className="h-16 w-16 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No image yet
                </p>
                {description.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      generateDesign.mutate({
                        style,
                        generateSheet: true,
                      })
                    }
                    disabled={generateDesign.isPending}
                    className="mt-3 flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {generateDesign.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate Design — 8 cr
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            {generateDesign.error && (
              <p className="mt-2 text-sm text-red-500">
                {generateDesign.error.message}
              </p>
            )}
          </div>

          {/* Right: Edit form */}
          <div className="flex-1 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe the character's appearance, age, outfit..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Style</label>
              <div className="flex gap-3">
                {(["anime", "realistic", "3d"] as const).map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <input
                      type="radio"
                      name="style"
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

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Outfit Description
              </label>
              <input
                value={outfitDescription}
                onChange={(e) => setOutfitDescription(e.target.value)}
                placeholder="e.g. dark blue school uniform with black leather shoes"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {isDirty && (
              <button
                type="button"
                onClick={handleSave}
                disabled={updateCharacter.isPending}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {updateCharacter.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save Changes
              </button>
            )}
            {updateCharacter.error && (
              <p className="text-sm text-red-500">
                {updateCharacter.error.message}
              </p>
            )}
          </div>
        </div>

        {/* L2: Multi-angle reference images */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Reference Images
              {hasRefImages && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({character.referenceImages.length})
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  generateDesign.mutate({ style, generateSheet: true })
                }
                disabled={
                  generateDesign.isPending ||
                  description.trim().length === 0
                }
                className="flex items-center gap-1.5 rounded-md bg-purple-500/10 px-3 py-1.5 text-sm text-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
              >
                {generateDesign.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Generate Design — 8 cr
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {refByAngle
              .filter((g) => g.angle !== "custom" || g.images.length > 0)
              .map(({ angle, images }) => (
                <div key={angle}>
                  {images.length > 0 ? (
                    <div className="overflow-hidden rounded-md border border-border">
                      <img
                        src={images[0].url}
                        alt={`${character.name} ${angle}`}
                        className="aspect-[3/4] w-full object-cover"
                      />
                      <div className="px-2 py-1.5 text-center text-xs capitalize text-muted-foreground">
                        {angle}
                        {images[0].label && ` · ${images[0].label}`}
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] flex-col items-center justify-center rounded-md border-2 border-dashed border-border">
                      <Upload className="h-5 w-5 text-muted-foreground/40" />
                      <span className="mt-1 text-xs capitalize text-muted-foreground">
                        {angle}
                      </span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* L3: Outfit Variants (collapsible, enhanced) */}
        {hasRefImages && (
          <Collapsible className="mt-8" defaultOpen={outfitImages.length > 0}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 text-left">
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90" />
              <Shirt className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Outfit Variants</h2>
              {outfitImages.length > 0 && (
                <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">
                  {outfitImages.length}
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              {/* Outfit history gallery */}
              {outfitImages.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Previous outfits (click to set as primary):
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {outfitImages.map((img, i) => {
                      const isCurrent = character.thumbnailUrl === img.url;
                      return (
                        <button
                          key={`outfit-${i}`}
                          type="button"
                          onClick={() => {
                            if (!isCurrent) {
                              updateCharacter.mutate({ thumbnailUrl: img.url });
                            }
                          }}
                          className={`relative shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                            isCurrent
                              ? "border-primary ring-1 ring-primary/30"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={`Outfit variant ${i + 1}`}
                            className="h-[120px] w-[90px] object-cover"
                          />
                          {isCurrent && (
                            <span className="absolute bottom-0 left-0 right-0 bg-primary/80 py-0.5 text-center text-[9px] text-primary-foreground">
                              Current
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New outfit input */}
              <div className="rounded-md border border-dashed border-border p-3">
                <div className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Shirt className="h-3.5 w-3.5" />
                  Change Outfit
                </div>
                <div className="flex gap-2">
                  <input
                    value={outfitInput}
                    onChange={(e) => setOutfitInput(e.target.value)}
                    placeholder="e.g. red evening dress with gold jewelry"
                    className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditOutfit();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleEditOutfit}
                    disabled={!outfitInput.trim() || editOutfit.isPending}
                    className="flex items-center gap-1.5 rounded bg-blue-500/10 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    {editOutfit.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5" />
                    )}
                    Generate — 3 cr
                  </button>
                </div>
                {editOutfit.error && (
                  <p className="mt-1 text-xs text-red-500">
                    {editOutfit.error.message}
                  </p>
                )}
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  Uses AI to edit the character&apos;s outfit while preserving their identity.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* L3: Accessories (collapsible) */}
        <Collapsible className="mt-6" defaultOpen={(character.accessories?.length ?? 0) > 0}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 text-left">
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90" />
            <Gem className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Accessories</h2>
            {(character.accessories?.length ?? 0) > 0 && (
              <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">
                {character.accessories.length}
              </span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {/* Existing accessories */}
            {character.accessories.length > 0 && (
              <div className="mb-3 space-y-2">
                {character.accessories.map((acc, i) => (
                  <div
                    key={`acc-${i}`}
                    className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
                  >
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] capitalize text-secondary-foreground">
                      {acc.type}
                    </span>
                    <span className="flex-1 text-sm">{acc.description}</span>
                    {acc.imageUrl && (
                      <img
                        src={acc.imageUrl}
                        alt={acc.description}
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAccessory(i)}
                      disabled={updateCharacter.isPending}
                      className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new accessory */}
            <div className="rounded-md border border-dashed border-border p-3">
              <div className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Plus className="h-3.5 w-3.5" />
                Add Accessory
              </div>
              <div className="flex gap-2">
                <select
                  value={newAccessoryType}
                  onChange={(e) => setNewAccessoryType(e.target.value)}
                  className="w-28 rounded border border-border bg-background px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {ACCESSORY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  value={newAccessoryDesc}
                  onChange={(e) => setNewAccessoryDesc(e.target.value)}
                  placeholder="Describe the accessory..."
                  className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddAccessory();
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddAccessory}
                  disabled={!newAccessoryDesc.trim() || updateCharacter.isPending}
                  className="flex items-center gap-1 rounded bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateCharacter.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Add
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Accessories are included in character descriptions for video generation prompts.
              </p>
            </div>

            {/* Apply accessories via outfit edit */}
            {hasRefImages && character.accessories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const accDesc = character.accessories
                    .map((a) => `${a.type}: ${a.description}`)
                    .join(", ");
                  editOutfit.mutate({
                    instruction: `Add these accessories: ${accDesc}`,
                  });
                }}
                disabled={editOutfit.isPending}
                className="mt-3 flex items-center gap-1.5 rounded-md bg-blue-500/10 px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
              >
                {editOutfit.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                Apply Accessories to Image — 3 cr
              </button>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* L3: Generation history (collapsible) */}
        {character.referenceImages.length > 1 && (
          <Collapsible className="mt-6">
            <CollapsibleTrigger className="flex w-full items-center gap-2 text-left">
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90" />
              <h2 className="text-base font-semibold">Generation History</h2>
              <span className="rounded-full bg-muted px-2 text-xs text-muted-foreground">
                {character.referenceImages.length}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[...character.referenceImages].reverse().map((img, i) => (
                  <div
                    key={`history-${i}`}
                    className="shrink-0"
                  >
                    <img
                      src={img.url}
                      alt={`Version ${character.referenceImages.length - i}`}
                      className="h-[80px] w-[64px] rounded border border-border object-cover"
                    />
                    <p className="mt-0.5 text-center text-[10px] text-muted-foreground">
                      {img.angle}
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Character sheet */}
        {character.characterSheetUrl && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Character Sheet</h2>
            <img
              src={character.characterSheetUrl}
              alt={`${character.name} character sheet`}
              className="max-w-[600px] rounded-lg border border-border"
            />
          </div>
        )}
      </main>
    </div>
  );
}
