"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, FolderOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProjects, useCharacters, type Character } from "@/hooks/use-project";
import { CharacterCard } from "@/components/characters/character-card";
import { CharacterCreateWizard } from "@/components/characters/character-create-wizard";

export function DashboardContent() {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: characters = [], isLoading: charsLoading } = useCharacters();
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <Tabs defaultValue="projects" className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderOpen className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="characters" className="gap-1.5">
            <Users className="h-4 w-4" />
            Characters
            {characters.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-xs">
                {characters.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="projects">
        {projectsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first AI animation project to get started.
            </p>
            <Link
              href="/projects/new"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium group-hover:text-primary">
                    {project.name}
                  </h3>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground">
                    {project.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{project.style}</span>
                  <span>{project.aspectRatio}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="characters">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium">
            My Characters
            {characters.length > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({characters.length})
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Character
          </button>
        </div>

        {charsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : characters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No characters yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first character to use in video generation.
            </p>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {characters.map((char) => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        )}

        <CharacterCreateWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
        />
      </TabsContent>
    </Tabs>
  );
}
