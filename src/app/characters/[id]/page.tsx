import { requireUser } from "@/lib/auth";
import { CharacterDetail } from "./character-detail";

interface Props {
  params: { id: string };
}

export default async function CharacterPage({ params }: Props) {
  await requireUser();
  return <CharacterDetail characterId={params.id} />;
}
