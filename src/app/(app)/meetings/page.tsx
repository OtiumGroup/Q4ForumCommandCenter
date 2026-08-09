import { createClient } from "@/lib/supabase/server";
import { splitUpcoming } from "@/lib/time";
import { MeetingsPanel } from "./meetings-panel";

export default async function MeetingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, starts_at, ends_at, location, notes")
    .order("starts_at", { ascending: true });

  const { upcoming, past } = splitUpcoming(meetings ?? []);

  return <MeetingsPanel upcoming={upcoming} past={past} isAdmin={profile?.role === "admin"} />;
}
