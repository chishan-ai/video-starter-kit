"use client";

import { useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ShotCard } from "./shot-card";
import { useCreateShot, useReorderShots, type Shot } from "@/hooks/use-project";

interface StoryboardGridProps {
  shots: Shot[];
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
  onDeleteShot: (shotId: string) => void;
  projectId: string;
}

export function StoryboardGrid({
  shots,
  selectedShotId,
  onSelectShot,
  onDeleteShot,
  projectId,
}: StoryboardGridProps) {
  const createShot = useCreateShot(projectId);
  const reorderShots = useReorderShots(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = shots.findIndex((s) => s.id === active.id);
      const newIndex = shots.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...shots];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      reorderShots.mutate(reordered.map((s) => s.id));
    },
    [shots, reorderShots],
  );

  function handleAddShot() {
    const maxOrder = shots.length > 0
      ? Math.max(...shots.map((s) => s.order))
      : -1;
    createShot.mutate({
      order: maxOrder + 1,
      description: "",
      duration: 4,
      cameraType: "medium",
    });
  }

  if (shots.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            No shots yet. Write a script and click &quot;Split to Shots&quot; to generate
            your storyboard.
          </p>
        </div>
      </div>
    );
  }

  const shotIds = useMemo(() => shots.map((s) => s.id), [shots]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={shotIds} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shots.map((shot) => (
            <SortableShotCard
              key={shot.id}
              shot={shot}
              isSelected={shot.id === selectedShotId}
              onClick={() => onSelectShot(shot.id)}
              onDelete={() => onDeleteShot(shot.id)}
            />
          ))}

          <button
            type="button"
            onClick={handleAddShot}
            disabled={createShot.isPending}
            className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <div className="text-center">
              <Plus className="mx-auto h-6 w-6" />
              <span className="mt-1 block text-xs">
                {createShot.isPending ? "Adding..." : "New Shot"}
              </span>
            </div>
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableShotCard({
  shot,
  isSelected,
  onClick,
  onDelete,
}: {
  shot: Shot;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ShotCard
        shot={shot}
        isSelected={isSelected}
        onClick={onClick}
        onDelete={onDelete}
      />
    </div>
  );
}
