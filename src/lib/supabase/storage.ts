import { createClient } from "@/lib/supabase/server";

const BUCKET = "character-images";

export async function uploadCharacterImage(
  userId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function deleteCharacterImage(url: string): Promise<void> {
  const supabase = createClient();

  // Extract path from public URL
  const match = url.match(/character-images\/(.+)$/);
  if (!match) return;

  await supabase.storage.from(BUCKET).remove([match[1]]);
}
