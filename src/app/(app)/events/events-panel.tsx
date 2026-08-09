"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CalendarPlus,
  MapPin,
  Link as LinkIcon,
  Trash2,
  Check,
  HelpCircle,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { createEvent, deleteEvent, setRsvp } from "./actions";

type EventRow = {
  id: string;
  source: "eo" | "member";
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  address: string | null;
  link: string | null;
  created_by: string | null;
  notify_forum: boolean;
};

type Rsvp = { event_id: string; member_id: string; status: "attending" | "interested" | "not_attending" };
type ProfileLite = { id: string; full_name: string | null };

function formatRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const dateStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const startTime = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!endsAt) return `${dateStr} · ${startTime}`;
  const endTime = new Date(endsAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${startTime}–${endTime}`;
}

function AddEventDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createEvent({ ok: false }, formData);
      if (res.ok) {
        toast.success(res.message ?? "Event created.");
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
          <CalendarPlus className="mr-1.5 h-4 w-4" /> Add event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add an event</DialogTitle>
            <DialogDescription>An EO event link or a member get-together — party, lake day, whatever.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="Lake day at the Wallaces'" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Type</Label>
              <Select name="source" defaultValue="member">
                <SelectTrigger id="source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member event</SelectItem>
                  <SelectItem value="eo">EO event</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="address">Address (optional)</Label>
              <Input id="address" name="address" placeholder="123 Main St, Fort Worth" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link (optional)</Label>
              <Input id="link" name="link" type="url" placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Details (optional)</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Notify the forum</p>
                <p className="text-xs text-muted-foreground">Flag this on everyone&apos;s home dashboard.</p>
              </div>
              <Switch name="notify_forum" />
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
              {pending ? "Saving…" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const RSVP_OPTIONS: { value: Rsvp["status"]; label: string; icon: typeof Check }[] = [
  { value: "attending", label: "Attending", icon: Check },
  { value: "interested", label: "Interested", icon: HelpCircle },
  { value: "not_attending", label: "Can't make it", icon: X },
];

function RsvpControls({
  eventId,
  myStatus,
}: {
  eventId: string;
  myStatus: Rsvp["status"] | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {RSVP_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = myStatus === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await setRsvp(eventId, opt.value);
                if (!res.ok) toast.error(res.message ?? "Could not update your RSVP.");
              })
            }
          >
            <Icon className="mr-1 h-3.5 w-3.5" /> {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

function EventCard({
  event,
  attendeeNames,
  myStatus,
  canManage,
}: {
  event: EventRow;
  attendeeNames: string[];
  myStatus: Rsvp["status"] | null;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="space-y-3 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="font-medium">{event.title}</p>
              {event.source === "eo" && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" /> EO
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{formatRange(event.starts_at, event.ends_at)}</p>
            {event.address && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {event.address}
              </p>
            )}
            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1 text-sm text-accent underline underline-offset-2"
              >
                <LinkIcon className="h-3.5 w-3.5" /> Event link
              </a>
            )}
            {event.description && <p className="mt-2 text-sm">{event.description}</p>}
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete event"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await deleteEvent(event.id);
                  if (!res.ok) toast.error(res.message ?? "Could not delete event.");
                })
              }
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>

        <RsvpControls eventId={event.id} myStatus={myStatus} />

        {attendeeNames.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Attending: {attendeeNames.join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function EventsPanel({
  upcoming,
  past,
  rsvps,
  profiles,
  currentUserId,
  isAdmin,
}: {
  upcoming: EventRow[];
  past: EventRow[];
  rsvps: Rsvp[];
  profiles: ProfileLite[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach((p) => m.set(p.id, p.full_name ?? "Member"));
    return m;
  }, [profiles]);

  const rsvpsByEvent = useMemo(() => {
    const m = new Map<string, Rsvp[]>();
    rsvps.forEach((r) => {
      const list = m.get(r.event_id) ?? [];
      list.push(r);
      m.set(r.event_id, list);
    });
    return m;
  }, [rsvps]);

  function renderEvent(event: EventRow) {
    const eventRsvps = rsvpsByEvent.get(event.id) ?? [];
    const myStatus = eventRsvps.find((r) => r.member_id === currentUserId)?.status ?? null;
    const attendeeNames = eventRsvps
      .filter((r) => r.status === "attending")
      .map((r) => nameById.get(r.member_id) ?? "Member");
    const canManage = event.created_by === currentUserId || isAdmin;

    return (
      <EventCard
        key={event.id}
        event={event}
        attendeeNames={attendeeNames}
        myStatus={myStatus}
        canManage={canManage}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Upcoming Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            EO events and member get-togethers — RSVP so everyone knows who&apos;s in.
          </p>
        </div>
        <AddEventDialog />
      </div>

      <div className="space-y-3">
        {upcoming.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No upcoming events yet — add one to get started.
            </CardContent>
          </Card>
        )}
        {upcoming.map(renderEvent)}
      </div>

      {past.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Past events</h2>
          <div className="space-y-2 opacity-70">{past.map(renderEvent)}</div>
        </div>
      )}
    </div>
  );
}
