"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { CalendarClock, Plus, Trash2, Pencil, ChevronDown, ArrowRight } from "lucide-react";
import { AddressLink } from "@/components/shared/address-link";
import { FORUM_TZ, isoToTzDateInput, isoToTzTimeInput } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { createMeeting, updateMeeting, deleteMeeting } from "./actions";

type Meeting = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
};

function MeetingDialog({
  meeting,
  trigger,
}: {
  meeting?: Meeting;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!meeting;

  function handleSubmit(formData: FormData) {
    setError(null);
    if (meeting) formData.set("id", meeting.id);
    startTransition(async () => {
      const res = isEdit ? await updateMeeting({ ok: false }, formData) : await createMeeting({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? (isEdit ? "Meeting updated." : "Meeting added."));
        setOpen(false);
      } else {
        setError(res.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit meeting" : "Add a forum meeting"}</DialogTitle>
            <DialogDescription>Visible to every member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={meeting?.title ?? "Forum Meeting"} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required defaultValue={meeting ? isoToTzDateInput(meeting.starts_at) : undefined} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="time">Start time</Label>
                <Input id="time" name="time" type="time" defaultValue={meeting ? isoToTzTimeInput(meeting.starts_at) : undefined} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End time</Label>
                <Input id="end_time" name="end_time" type="time" defaultValue={meeting ? isoToTzTimeInput(meeting.ends_at) : undefined} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Address or venue" defaultValue={meeting?.location ?? undefined} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={meeting?.notes ?? undefined} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatTimeRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const startTime = start.toLocaleTimeString("en-US", { timeZone: FORUM_TZ, hour: "numeric", minute: "2-digit" });
  if (!endsAt) return startTime;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString("en-US", { timeZone: FORUM_TZ, hour: "numeric", minute: "2-digit" });
  return `${startTime}–${endTime}`;
}

function DateBlock({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
        {d.toLocaleDateString("en-US", { timeZone: FORUM_TZ, month: "short" })}
      </span>
      <span className="font-display text-xl font-semibold leading-none">{d.toLocaleDateString("en-US", { timeZone: FORUM_TZ, day: "numeric" })}</span>
    </div>
  );
}

export function MeetingsPanel({
  upcoming,
  past,
  isAdmin,
}: {
  upcoming: Meeting[];
  past: Meeting[];
  isAdmin: boolean;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [showPast, setShowPast] = useState(false);
  const next = upcoming[0];

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: "radial-gradient(circle at 85% 20%, var(--accent) 0%, transparent 45%)" }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
              <CalendarClock className="h-3.5 w-3.5" /> EO Fort Worth · Q4 Forum
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Upcoming Meetings
            </h1>
            {next && (
              <p className="mt-2 text-sm text-muted-foreground">
                {new Date(next.starts_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
                {formatTimeRange(next.starts_at, next.ends_at)}
                {next.location && ` · ${next.location}`}
              </p>
            )}
          </div>
          {isAdmin && (
            <MeetingDialog
              trigger={
                <Button variant="secondary" className="shrink-0">
                  <Plus className="mr-1.5 h-4 w-4" /> Add meeting
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="space-y-3">
        {upcoming.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No upcoming meetings scheduled yet.
            </CardContent>
          </Card>
        )}
        {upcoming.map((m) => (
          <Card key={m.id} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-start justify-between gap-4 py-5">
              <div className="flex gap-4">
                <DateBlock iso={m.starts_at} />
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(m.starts_at).toLocaleDateString(undefined, { weekday: "long" })} ·{" "}
                    {formatTimeRange(m.starts_at, m.ends_at)}
                  </p>
                  {m.location && (
                    <AddressLink address={m.location} className="mt-1 text-sm text-accent" iconClassName="mt-0.5 h-3.5 w-3.5" />
                  )}
                  {m.notes && <p className="mt-2 text-sm text-muted-foreground">{m.notes}</p>}
                  <Link href={`/meetings/${m.id}`} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                    View agenda &amp; schedule <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <MeetingDialog
                    meeting={m}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Edit meeting">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete meeting"
                    disabled={pendingId === m.id}
                    onClick={() => {
                      setPendingId(m.id);
                      startTransition(async () => {
                        const res = await deleteMeeting(m.id);
                        setPendingId(null);
                        if (!res.ok) toast.error(res.message ?? "Could not delete meeting.");
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {past.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
            Past meetings ({past.length})
          </button>
          {showPast && (
            <div className="mt-3 space-y-2 opacity-70">
              {past.map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.starts_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} ·{" "}
                        {formatTimeRange(m.starts_at, m.ends_at)}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete meeting"
                        disabled={pendingId === m.id}
                        onClick={() => {
                          setPendingId(m.id);
                          startTransition(async () => {
                            const res = await deleteMeeting(m.id);
                            setPendingId(null);
                            if (!res.ok) toast.error(res.message ?? "Could not delete meeting.");
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
