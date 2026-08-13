import { createClient } from "@/lib/supabase/server";
import { GoalsPanel } from "./goals-panel";

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: goals }, { data: profiles }, { data: nudges }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, member_id, area, title, details, due_date, status, needs_help, reminder_date, created_at")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("profiles").select("id, full_name, photo_url"),
    supabase.from("goal_nudges").select("goal_id"),
  ]);

  const nudgeCounts: Record<string, number> = {};
  (nudges ?? []).forEach((n) => {
    nudgeCounts[n.goal_id] = (nudgeCounts[n.goal_id] ?? 0) + 1;
  });

  return (
    <GoalsPanel goals={goals ?? []} profiles={profiles ?? []} currentUserId={user?.id ?? ""} nudgeCounts={nudgeCounts} initialGoalId={sp.goal ?? null} />
  );
}
