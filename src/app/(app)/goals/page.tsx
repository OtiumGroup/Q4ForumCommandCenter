import { createClient } from "@/lib/supabase/server";
import { GoalsPanel } from "./goals-panel";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: goals }, { data: profiles }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, member_id, area, title, details, due_date, status, needs_help, created_at")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("profiles").select("id, full_name, photo_url"),
  ]);

  return (
    <GoalsPanel goals={goals ?? []} profiles={profiles ?? []} currentUserId={user?.id ?? ""} />
  );
}
