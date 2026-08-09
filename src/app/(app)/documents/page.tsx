import { createClient } from "@/lib/supabase/server";
import { DocumentsPanel } from "./documents-panel";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const [{ data: categories }, { data: documents }, { data: links }] = await Promise.all([
    supabase.from("document_categories").select("id, name, sort_order").order("sort_order"),
    supabase
      .from("documents")
      .select("id, title, description, category_id, file_path, file_type, uploaded_by, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("resource_links")
      .select("id, title, url, description, category_id, added_by, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const paths = (documents ?? []).map((d) => d.file_path);
  let signedUrlByPath: Record<string, string> = {};
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from("documents").createSignedUrls(paths, 3600);
    signedUrlByPath = Object.fromEntries(
      (signed ?? []).map((s) => [s.path ?? "", s.signedUrl ?? ""]).filter(([p]) => p)
    );
  }

  return (
    <DocumentsPanel
      categories={categories ?? []}
      documents={(documents ?? []).map((d) => ({ ...d, url: signedUrlByPath[d.file_path] ?? null }))}
      links={links ?? []}
      currentUserId={user?.id ?? ""}
      isAdmin={profile?.role === "admin"}
    />
  );
}
