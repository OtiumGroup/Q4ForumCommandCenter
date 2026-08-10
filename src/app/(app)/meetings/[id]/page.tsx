import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarClock, User } from "lucide-react";
import { AddressLink } from "@/components/shared/address-link";
import { FORUM_TZ } from "@/lib/time";
import { PrintButton } from "./print-button";
import { MeetingRsvp } from "./meeting-rsvp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

type Block = { time?: string; title: string; speaker?: string; detail?: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: FORUM_TZ, weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { timeZone: FORUM_TZ, hour: "numeric", minute: "2-digit" });
}

export default async function MeetingAgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: meeting }, { data: me }, { data: rsvps }, { data: profiles }] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", id).single(),
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
    supabase.from("meeting_rsvps").select("member_id, status").eq("meeting_id", id),
    supabase.from("profiles").select("id, full_name, photo_url"),
  ]);

  if (!meeting) notFound();
  const isAdmin = me?.role === "admin";
  const agenda = (Array.isArray(meeting.agenda) ? meeting.agenda : []) as Block[];
  const myStatus = (rsvps ?? []).find((r) => r.member_id === user?.id)?.status ?? null;
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const attendees = (rsvps ?? [])
    .filter((r) => r.status === "attending")
    .map((r) => pmap.get(r.member_id))
    .filter((p): p is { id: string; full_name: string | null; photo_url: string | null } => Boolean(p));
  const timeStr = meeting.ends_at
    ? `${fmtTime(meeting.starts_at)} – ${fmtTime(meeting.ends_at)}`
    : fmtTime(meeting.starts_at);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <div className="mb-5 flex items-center justify-between gap-2 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link href="/meetings"><ArrowLeft className="mr-1.5 h-4 w-4" /> All meetings</Link>
        </Button>
        <div className="flex gap-2">
          <PrintButton />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 print:rounded-none print:border-0 print:p-0">
        <div className="flex items-center gap-3 border-b border-border pb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/q4-mark.png" alt="Q4" className="h-12 w-12 shrink-0 rounded-lg object-contain" />
          <div>
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">EO Fort Worth · Q4 Forum</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{meeting.theme || meeting.title}</h1>
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2 text-foreground"><CalendarClock className="h-4 w-4 shrink-0 text-accent" /> {fmtDate(meeting.starts_at)} · {timeStr}</p>
          {meeting.location && <AddressLink address={meeting.location} className="text-foreground" iconClassName="mt-0 h-4 w-4 text-accent" />}
          {meeting.facilitator && <p className="flex items-center gap-2 text-foreground"><User className="h-4 w-4 shrink-0 text-accent" /> Facilitated by {meeting.facilitator}</p>}
        </div>

        {meeting.notes && <p className="mt-4 border-l-2 border-accent/40 pl-3 text-sm text-muted-foreground">{meeting.notes}</p>}

        <div className="mt-6 border-t border-border pt-5">
          <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-accent">Who&apos;s coming</h2>
          <div className="mt-3 print:hidden">
            <MeetingRsvp meetingId={id} myStatus={myStatus} />
          </div>
          {attendees.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {attendees.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2.5">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={p.photo_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-secondary text-[9px] text-secondary-foreground">{initials(p.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{p.full_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No RSVPs yet.</p>
          )}
        </div>

        <div className="mt-7">
          <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-accent">Schedule</h2>
          {agenda.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No agenda posted yet{isAdmin ? " — build it from Admin → Meetings." : ". Check back closer to the meeting."}
            </p>
          ) : (
            <ol className="mt-3">
              {agenda.map((b, i) => (
                <li key={i} className="flex gap-4 border-b border-border py-3 last:border-0">
                  <div className="w-28 shrink-0 text-sm font-medium tabular-nums text-accent">{b.time || ""}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {b.title}
                      {b.speaker && <span className="font-normal text-muted-foreground"> · {b.speaker}</span>}
                    </p>
                    {b.detail && <p className="mt-0.5 text-sm text-muted-foreground">{b.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
