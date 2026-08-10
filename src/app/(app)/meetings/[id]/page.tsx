import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, MapPin, CalendarClock, User } from "lucide-react";
import { PrintButton } from "./print-button";

type Block = { time?: string; title: string; speaker?: string; detail?: string };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default async function MeetingAgendaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: meeting }, { data: me }] = await Promise.all([
    supabase.from("meetings").select("*").eq("id", id).single(),
    supabase.from("profiles").select("role").eq("id", user?.id ?? "").single(),
  ]);

  if (!meeting) notFound();
  const isAdmin = me?.role === "admin";
  const agenda = (Array.isArray(meeting.agenda) ? meeting.agenda : []) as Block[];
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
          {isAdmin && (
            <Button asChild size="sm">
              <Link href={`/meetings/${id}/edit`}><Pencil className="mr-1.5 h-4 w-4" /> Edit agenda</Link>
            </Button>
          )}
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
          {meeting.location && <p className="flex items-center gap-2 text-foreground"><MapPin className="h-4 w-4 shrink-0 text-accent" /> {meeting.location}</p>}
          {meeting.facilitator && <p className="flex items-center gap-2 text-foreground"><User className="h-4 w-4 shrink-0 text-accent" /> Facilitated by {meeting.facilitator}</p>}
        </div>

        {meeting.notes && <p className="mt-4 border-l-2 border-accent/40 pl-3 text-sm text-muted-foreground">{meeting.notes}</p>}

        <div className="mt-7">
          <h2 className="font-display text-xs font-semibold uppercase tracking-wide text-accent">Schedule</h2>
          {agenda.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No agenda posted yet{isAdmin ? " — click “Edit agenda” to build it." : ". Check back closer to the meeting."}
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
