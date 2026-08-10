import { createClient } from "@/lib/supabase/server";
import { GalleryPanel, type GalleryPhoto } from "./gallery-panel";

export default async function GalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: photos }, { data: profiles }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
    supabase
      .from("gallery_photos")
      .select("id, url, caption, created_at, uploader_id")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, photo_url"),
  ]);

  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const enriched: GalleryPhoto[] = (photos ?? []).map((ph) => {
    const up = pmap.get(ph.uploader_id);
    return { ...ph, uploader: up ? { full_name: up.full_name, photo_url: up.photo_url } : null };
  });

  return <GalleryPanel photos={enriched} currentUserId={user?.id ?? ""} isAdmin={me?.role === "admin"} />;
}
