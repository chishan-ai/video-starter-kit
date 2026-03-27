import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const user = await requireUser();

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">Mozoria</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Projects</h2>
          <Link
            href="/projects/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Project
          </Link>
        </div>

        {userProjects.length === 0 ? (
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
            {userProjects.map((project) => (
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
      </main>
    </div>
  );
}
