import { createClient } from "@/lib/supabase/server";
import { ConstitutionPanel } from "./constitution-panel";

export default async function ConstitutionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const { data: constitution } = await supabase
    .from("constitution")
    .select("file_path, updated_at")
    .eq("id", 1)
    .maybeSingle();

  let url: string | null = null;
  if (constitution?.file_path) {
    const { data: signed } = await supabase.storage
      .from("constitution")
      .createSignedUrl(constitution.file_path, 3600);
    url = signed?.signedUrl ?? null;
  }

  return (
    <ConstitutionPanel url={url} updatedAt={constitution?.updated_at ?? null} isAdmin={profile?.role === "admin"} />
  );
}
