import { ProjectEditor } from "@/components/storyboard/project-editor";
import { Providers } from "@/components/providers";

export default function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Providers>
      <ProjectEditor projectId={params.id} />
    </Providers>
  );
}
