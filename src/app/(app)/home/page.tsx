import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { splitUpcoming } from "@/lib/time";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CalendarDays, MapPin, PartyPopper } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: broadcasts }, { data: meetings }, { data: events }] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user?.id ?? "").single(),
      supabase
        .from("broadcasts")
        .select("id, title, body, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("meetings")
        .select("id, title, starts_at, location")
        .order("starts_at", { ascending: true }),
      supabase
        .from("events")
        .select("id, title, starts_at, address, notify_forum, created_at")
        .order("starts_at", { ascending: true }),
    ]);

  const firstName = profile?.full_name?.split(" ")[0];

  // Merge admin broadcasts with member events flagged "notify the forum"
  // into one notices feed, newest first.
  type Notice = { id: string; title: string; body: string; created_at: string; kind: "broadcast" | "event" };
  const notices: Notice[] = [
    ...(broadcasts ?? []).map((b) => ({
      id: `b-${b.id}`,
      title: b.title,
      body: b.body,
      created_at: b.created_at,
      kind: "broadcast" as const,
    })),
    ...(events ?? [])
      .filter((e) => e.notify_forum)
      .map((e) => ({
        id: `e-${e.id}`,
        title: `New event: ${e.title}`,
        body: `Happening ${formatDate(e.starts_at)}${e.address ? ` at ${e.address}` : ""}.`,
        created_at: e.created_at,
        kind: "event" as const,
      })),
  ]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6);

  const { upcoming: upcomingMeetings } = splitUpcoming(meetings ?? []);
  const { upcoming: upcomingEvents } = splitUpcoming(events ?? []);
  const nextUp = [
    ...upcomingMeetings.slice(0, 3).map((m) => ({ id: m.id, title: m.title, starts_at: m.starts_at, location: m.location, type: "meeting" as const })),
    ...upcomingEvents.slice(0, 3).map((e) => ({ id: e.id, title: e.title, starts_at: e.starts_at, location: e.address, type: "event" as const })),
  ]
    .sort((a, b) => (a.starts_at > b.starts_at ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in the forum.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-accent" /> Notices
            </CardTitle>
            <CardDescription>Updates from your moderator and the forum.</CardDescription>
          </CardHeader>
          <CardContent>
            {notices.length > 0 ? (
              <ul className="space-y-4">
                {notices.map((n) => (
                  <li key={n.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.kind === "event" && (
                        <Badge variant="secondary" className="gap-1">
                          <PartyPopper className="h-3 w-3" /> Event
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No notices yet — check back soon.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-accent" /> Coming up
            </CardTitle>
            <CardDescription>Meetings &amp; events at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            {nextUp.length > 0 ? (
              <ul className="space-y-3">
                {nextUp.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link
                      href={item.type === "meeting" ? "/meetings" : "/events"}
                      className="block rounded-md p-2 -m-2 transition-colors hover:bg-secondary"
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.starts_at)}</p>
                      {item.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {item.location}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing on the calendar yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
