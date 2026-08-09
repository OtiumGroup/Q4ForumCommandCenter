"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarClock, MapPin, Plus, Trash2 } from "lucide-react";
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
import { createMeeting, deleteMeeting } from "./actions";

type Meeting = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
};

function AddMeetingDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createMeeting({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Meeting added.");
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
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" /> Add meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add a forum meeting</DialogTitle>
            <DialogDescription>Visible to every member.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue="Forum Meeting" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Start time</Label>
                <Input id="time" name="time" type="time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End time (optional)</Label>
              <Input id="end_time" name="end_time" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Address or venue" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" name="notes" rows={3} />
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
              {pending ? "Saving…" : "Add meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const dateStr = start.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!endsAt) return `${dateStr} · ${startTime}`;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${startTime}–${endTime}`;
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Upcoming Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Forum meeting dates, times, and locations.
          </p>
        </div>
        {isAdmin && <AddMeetingDialog />}
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
          <Card key={m.id}>
            <CardContent className="flex items-start justify-between gap-4 py-5">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-sm text-muted-foreground">{formatRange(m.starts_at, m.ends_at)}</p>
                  {m.location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {m.location}
                    </p>
                  )}
                  {m.notes && <p className="mt-2 text-sm">{m.notes}</p>}
                </div>
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

      {past.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Past meetings</h2>
          <div className="space-y-2 opacity-70">
            {past.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{formatRange(m.starts_at, m.ends_at)}</p>
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
        </div>
      )}
    </div>
  );
}
