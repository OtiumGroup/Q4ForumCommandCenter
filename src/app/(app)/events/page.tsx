import { createClient } from "@/lib/supabase/server";
import { splitUpcoming } from "@/lib/time";
import { EventsPanel } from "./events-panel";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: events }, { data: rsvps }, { data: profiles }, { data: myProfile }] = await Promise.all([
    supabase
      .from("events")
      .select("id, source, title, description, starts_at, ends_at, address, link, created_by, notify_forum")
      .order("starts_at", { ascending: true }),
    supabase.from("event_rsvps").select("event_id, member_id, status"),
    supabase.from("profiles").select("id, full_name, photo_url"),
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
  ]);

  const { upcoming, past } = splitUpcoming(events ?? []);

  return (
    <EventsPanel
      upcoming={upcoming}
      past={past}
      rsvps={rsvps ?? []}
      profiles={profiles ?? []}
      currentUserId={user?.id ?? ""}
      isAdmin={myProfile?.role === "admin"}
    />
  );
}
