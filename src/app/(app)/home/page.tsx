import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { splitUpcoming, birthdayCountdown, FORUM_TZ } from "@/lib/time";
import { Bell, Cake, CalendarDays, PartyPopper, Users, ArrowRight, HandHeart } from "lucide-react";
import { AddressLink } from "@/components/shared/address-link";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: FORUM_TZ, month: "short", day: "numeric", year: "numeric" });
}
function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function joinNames(names: string[]) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
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
      supabase.from("profiles").select("full_name, in_app_notifications").eq("id", user?.id ?? "").single(),
      supabase.from("broadcasts").select("id, title, body, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("meetings").select("id, title, starts_at, location").order("starts_at", { ascending: true }),
      supabase.from("events").select("id, title, starts_at, address, notify_forum, created_at").order("starts_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, birthday").not("birthday", "is", null),
      supabase.from("profiles").select("id, full_name, photo_url").order("full_name", { ascending: true, nullsFirst: false }),
      supabase.from("goals").select("id, member_id, title").eq("needs_help", true).neq("status", "done"),
    ]);

  const firstName = profile?.full_name?.split(" ")[0];

  type Notice = { id: string; title: string; body: string; created_at: string; kind: "broadcast" | "event" };
  const showInAppNotices = profile?.in_app_notifications !== false;
  const notices: Notice[] = !showInAppNotices
    ? []
    : [
        ...(broadcasts ?? []).map((b) => ({ id: `b-${b.id}`, title: b.title, body: b.body, created_at: b.created_at, kind: "broadcast" as const })),
        ...(events ?? []).filter((e) => e.notify_forum).map((e) => ({
          id: `e-${e.id}`, title: `New event: ${e.title}`,
          body: `Happening ${formatDate(e.starts_at)}${e.address ? ` at ${e.address}` : ""}.`,
          created_at: e.created_at, kind: "event" as const,
        })),
      ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 6);

  const { upcoming: upcomingMeetings } = splitUpcoming(meetings ?? []);
  const { upcoming: upcomingEvents } = splitUpcoming(events ?? []);

  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));
  const birthdayList = (birthdayProfiles ?? [])
    .map((p) => {
      const c = birthdayCountdown(p.birthday);
      if (!c || c.days > 60) return null;
      return { id: p.id, name: p.full_name ?? "Member", days: c.days, date: c.date, photo_url: memberMap.get(p.id)?.photo_url ?? null };
    })
    .filter((b): b is { id: string; name: string; days: number; date: Date; photo_url: string | null } => b !== null)
    .sort((a, b) => a.days - b.days);
  const todaysBirthdays = birthdayList.filter((b) => b.days === 0);
  const nextBirthday = birthdayList.find((b) => b.days > 0) ?? null;

  const nextUp = [
    ...upcomingMeetings.slice(0, 3).map((m) => ({ id: m.id, title: m.title, starts_at: m.starts_at, location: m.location, type: "meeting" as const })),
    ...upcomingEvents.slice(0, 3).map((e) => ({ id: e.id, title: e.title, starts_at: e.starts_at, location: e.address, type: "event" as const })),
    ...birthdayList.map((b) => ({ id: b.id, title: `${b.name}'s birthday`, starts_at: b.date.toISOString(), location: null as string | null, type: "birthday" as const })),
  ].sort((a, b) => (a.starts_at > b.starts_at ? 1 : -1)).slice(0, 6);

  const nextItem = nextUp[0];
  const memberList = (members ?? []).filter((m) => m.full_name);
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

      {/* Birthday today — celebration notice for everyone */}
      {todaysBirthdays.length > 0 && (
        <Link
          href={todaysBirthdays.length === 1 ? `/bio/${todaysBirthdays[0].id}` : "/bio"}
          className="group block overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent/80 p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4 text-white">
            <div className="flex -space-x-3">
              {todaysBirthdays.slice(0, 3).map((b) => (
                <div key={b.id} className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white/20">
                  {b.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.photo_url} alt={b.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-base">{initials(b.name)}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/90"><PartyPopper className="h-3.5 w-3.5" /> Today</p>
              <p className="mt-0.5 font-display text-lg font-semibold leading-tight">
                It&apos;s {joinNames(todaysBirthdays.map((b) => b.name.split(" ")[0]))}&apos;s birthday today! 🎉
              </p>
              <p className="text-sm text-white/85">Give them a shout and make their day.</p>
            </div>
            <ArrowRight className="hidden h-5 w-5 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5 sm:block" />
          </div>
        </Link>
      )}

      {/* Birthday countdown — the next one coming up */}
      {todaysBirthdays.length === 0 && nextBirthday && (
        <Link
          href={`/bio/${nextBirthday.id}`}
          className="group flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/5 p-4 transition-colors hover:bg-accent/10 sm:p-5"
        >
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent text-white shadow-sm">
            <span className="font-display text-2xl font-semibold leading-none">{nextBirthday.days}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-white/85">{nextBirthday.days === 1 ? "day" : "days"}</span>
          </div>
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border">
            {nextBirthday.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={nextBirthday.photo_url} alt={nextBirthday.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary font-display text-base text-primary-foreground">{initials(nextBirthday.name)}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent"><Cake className="h-3.5 w-3.5" /> Birthday countdown</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-foreground">{nextBirthday.name}</p>
            <p className="text-sm text-muted-foreground">
              {nextBirthday.days === 1 ? "Tomorrow" : `In ${nextBirthday.days} days`} · {nextBirthday.date.toLocaleDateString("en-US", { timeZone: FORUM_TZ, month: "long", day: "numeric" })} 🎂
            </p>
          </div>
          <ArrowRight className="hidden h-5 w-5 shrink-0 text-accent opacity-70 transition-transform group-hover:translate-x-0.5 sm:block" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Members" value={memberList.length} />
        <StatCard label="Next meeting" value={nextMeeting ? formatDate(nextMeeting.starts_at) : "—"} />
        <StatCard label="Birthdays · 60 days" value={birthdayList.length} />
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
                <Link href={`/goals?goal=${h.id}`} className="min-w-0 flex-1 group">
                  <p className="truncate text-sm font-medium text-foreground group-hover:text-accent">{h.member.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground group-hover:underline">{h.title}</p>
                </Link>
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
            ) : !showInAppNotices ? (
              <p className="text-sm text-muted-foreground">In-app notices are turned off. You can turn them back on in Settings.</p>
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
              <ul className="space-y-2.5">
                {nextUp.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link href={item.type === "meeting" ? "/meetings" : item.type === "event" ? "/events" : `/bio/${item.id}`} className="block rounded-xl border border-border bg-secondary/40 p-3 transition-colors hover:bg-secondary/70">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">{item.type === "birthday" && <Cake className="h-3.5 w-3.5 text-accent" />}{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(item.starts_at)}</p>
                      {item.location && <div className="mt-1"><AddressLink address={item.location} className="text-xs text-muted-foreground hover:text-foreground" iconClassName="h-3 w-3" /></div>}
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
