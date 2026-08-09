import { createClient } from "@/lib/supabase/server";
import { BooksPanel } from "./books-panel";

export default async function BooksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const [{ data: items }, { data: profiles }] = await Promise.all([
    supabase
      .from("media_items")
      .select("id, type, title, author_or_host, topic, cover_image_url, source_url, external_link, description, added_by, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, photo_url"),
  ]);

  return (
    <BooksPanel
      items={items ?? []}
      profiles={profiles ?? []}
      currentUserId={user?.id ?? ""}
      isAdmin={profile?.role === "admin"}
    />
  );
}
