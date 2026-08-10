import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { splitUpcoming, nextBirthdayWithin } from "@/lib/time";
import { Bell, Cake, CalendarDays, MapPin, PartyPopper, Users, ArrowRight, HandHeart } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: broadcasts }, { data: meetings }, { data: events }, { data: birthdayProfiles }, { data: members }, { data: helpGoals }] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user?.id ?? "").single(),
      supabase.from("broadcasts").select("id, title, body, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("meetings").select("id, title, starts_at, location").order("starts_at", { ascending: true }),
      supabase.from("events").select("id, title, starts_at, address, notify_forum, created_at").order("starts_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, birthday").not("birthday", "is", null),
      supabase.from("profiles").select("id, full_name, photo_url").order("full_name", { ascending: true, nullsFirst: false }),
      supabase.from("goals").select("id, member_id, title").eq("needs_help", true).neq("status", "done"),
    ]);

  const firstName = profile?.full_name?.split(" ")[0];

  type Notice = { id: string; title: string; body: string; created_at: string; kind: "broadcast" | "event" };
  const notices: Notice[] = [
    ...(broadcasts ?? []).map((b) => ({ id: `b-${b.id}`, title: b.title, body: b.body, created_at: b.created_at, kind: "broadcast" as const })),
    ...(events ?? []).filter((e) => e.notify_forum).map((e) => ({
      id: `e-${e.id}`, title: `New event: ${e.title}`,
      body: `Happening ${formatDate(e.starts_at)}${e.address ? ` at ${e.address}` : ""}.`,
      created_at: e.created_at, kind: "event" as const,
    })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6);

  const { upcoming: upcomingMeetings } = splitUpcoming(meetings ?? []);
  const { upcoming: upcomingEvents } = splitUpcoming(events ?? []);

  const upcomingBirthdays = (birthdayProfiles ?? [])
    .map((p) => {
      const next = nextBirthdayWithin(p.birthday, 60);
      return next ? { id: p.id, name: p.full_name ?? "Member", date: next } : null;
    })
    .filter((b): b is { id: string; name: string; date: Date } => b !== null);

  const nextUp = [
    ...upcomingMeetings.slice(0, 3).map((m) => ({ id: m.id, title: m.title, starts_at: m.starts_at, location: m.location, type: "meeting" as const })),
    ...upcomingEvents.slice(0, 3).map((e) => ({ id: e.id, title: e.title, starts_at: e.starts_at, location: e.address, type: "event" as const })),
    ...upcomingBirthdays.map((b) => ({ id: b.id, title: `${b.name}'s birthday`, starts_at: b.date.toISOString(), location: null as string | null, type: "birthday" as const })),
  ].sort((a, b) => (a.starts_at > b.starts_at ? 1 : -1)).slice(0, 6);

  const nextItem = nextUp[0];
  const memberList = (members ?? []).filter((m) => m.full_name);
  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));
  const needHelp = (helpGoals ?? [])
    .map((g) => ({ id: g.id, title: g.title, member: memberMap.get(g.member_id) }))
    .filter((h): h is { id: string; title: string; member: { id: string; full_name: string | null; photo_url: string | null } } => Boolean(h.member))
    .slice(0, 5);
  const nextMeeting = upcomingMeetings[0] ?? null;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 88% 12%, var(--accent) 0%, transparent 42%)" }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">EO Fort Worth · Q4 Forum</p>
            <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Here&apos;s what&apos;s happening in the forum.</p>
          </div>
          {nextItem && (
            <div className="rounded-xl border border-border bg-secondary/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Next up</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                {nextItem.type === "birthday" && <Cake className="h-3.5 w-3.5 text-accent" />}{nextItem.title}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(nextItem.starts_at)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Members" value={memberList.length} />
        <StatCard label="Next meeting" value={nextMeeting ? formatDate(nextMeeting.starts_at) : "—"} />
        <StatCard label="Birthdays · 60 days" value={upcomingBirthdays.length} />
      </div>

      {/* Lend a hand */}
      {needHelp.length > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <div className="mb-1 flex items-center gap-2">
            <HandHeart className="h-[18px] w-[18px] text-accent" />
            <h2 className="font-display text-[15px] font-semibold text-foreground">Lend a hand</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">Members who asked for help on a goal — reach out and check in on them.</p>
          <ul className="space-y-3">
            {needHelp.map((h) => (
              <li key={h.id} className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border">
                  {h.member.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.member.photo_url} alt={h.member.full_name ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-xs font-medium text-primary-foreground">{initials(h.member.full_name)}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{h.member.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{h.title}</p>
                </div>
                <Link href={`/bio/${h.member.id}`} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:underline">
                  Reach out <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* The forum */}
      {memberList.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><Users className="h-[18px] w-[18px] text-accent" /><h2 className="font-display text-[15px] font-semibold text-foreground">The forum</h2></div>
            <Link href="/bio" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            {memberList.slice(0, 12).map((m) => (
              <Link key={m.id} href={`/bio/${m.id}`} className="group flex w-16 flex-col items-center gap-1.5 text-center">
                <div className="h-14 w-14 overflow-hidden rounded-full border border-border transition-transform duration-200 group-hover:scale-105 group-hover:border-accent">
                  {m.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo_url} alt={m.full_name ?? ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary font-display text-lg text-primary-foreground">{initials(m.full_name)}</div>
                  )}
                </div>
                <span className="line-clamp-1 text-[11px] text-muted-foreground">{m.full_name?.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notices + Coming up */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2"><Bell className="h-[18px] w-[18px] text-accent" /><h2 className="font-display text-[15px] font-semibold text-foreground">Notices</h2></div>
          <p className="mt-0.5 text-sm text-muted-foreground">Updates from your moderator and the forum.</p>
          <div className="mt-4">
            {notices.length > 0 ? (
              <ul className="space-y-4">
                {notices.map((n) => (
                  <li key={n.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {n.kind === "event" && <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"><PartyPopper className="h-3 w-3" /> Event</span>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No notices yet — your moderator&apos;s updates will show up here.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><CalendarDays className="h-[18px] w-[18px] text-accent" /><h2 className="font-display text-[15px] font-semibold text-foreground">Coming up</h2></div>
          <p className="mt-0.5 text-sm text-muted-foreground">Meetings and events at a glance.</p>
          <div className="mt-4">
            {nextUp.length > 0 ? (
              <ul className="space-y-2">
                {nextUp.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link href={item.type === "meeting" ? "/meetings" : item.type === "event" ? "/events" : `/bio/${item.id}`} className="block rounded-lg p-2 -m-2 transition-colors hover:bg-secondary/60">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">{item.type === "birthday" && <Cake className="h-3.5 w-3.5 text-accent" />}{item.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.starts_at)}</p>
                      {item.location && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {item.location}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing on the calendar yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
