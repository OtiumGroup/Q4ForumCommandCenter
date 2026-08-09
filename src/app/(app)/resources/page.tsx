import { createClient } from "@/lib/supabase/server";
import { ResourcesPanel } from "./resources-panel";

export default async function ResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const [{ data: categories }, { data: resources }] = await Promise.all([
    supabase.from("eo_resource_categories").select("id, name, sort_order").order("sort_order"),
    supabase
      .from("eo_resources")
      .select("id, title, category_id, file_path, file_type, sort_order, created_at")
      .order("sort_order"),
  ]);

  const paths = (resources ?? []).map((r) => r.file_path);
  let signedUrlByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("eo-resources").createSignedUrls(paths, 3600);
    signedUrlByPath = Object.fromEntries(
      (signed ?? []).map((s) => [s.path ?? "", s.signedUrl ?? ""]).filter(([p]) => p)
    );
  }

  return (
    <ResourcesPanel
      categories={categories ?? []}
      resources={(resources ?? []).map((r) => ({ ...r, url: signedUrlByPath[r.file_path] ?? null }))}
      isAdmin={profile?.role === "admin"}
    />
  );
}
