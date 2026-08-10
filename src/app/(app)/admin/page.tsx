import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "./admin-panel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/home");
  }

  const [{ data: members }, { data: invites }, { data: broadcasts }, { data: meetings }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, status, photo_url, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("invites")
      .select("id, email, full_name, role, status, personal_note, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("broadcasts")
      .select("id, title, body, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("meetings")
      .select("id, title, starts_at, theme, agenda")
      .order("starts_at", { ascending: true }),
  ]);

  return (
    <AdminPanel
      currentUserId={user.id}
      members={members ?? []}
      invites={invites ?? []}
      broadcasts={broadcasts ?? []}
      meetings={meetings ?? []}
    />
  );
}
