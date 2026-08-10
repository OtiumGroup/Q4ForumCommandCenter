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
  PartyPopper,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useRouter } from "next/navigation";
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
  image_url: string | null;
  created_by: string | null;
  notify_forum: boolean;
};

type Rsvp = { event_id: string; member_id: string; status: "attending" | "interested" | "not_attending" };
type ProfileLite = { id: string; full_name: string | null; photo_url: string | null };

function formatRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const startTime = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!endsAt) return startTime;
  const endTime = new Date(endsAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${startTime}–${endTime}`;
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DateBlock({ iso, accent }: { iso: string; accent: boolean }) {
  const d = new Date(iso);
  return (
    <div
      className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg shadow-sm ${
        accent ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
      }`}
    >
      <span className={`text-[11px] font-semibold uppercase tracking-wide ${accent ? "text-accent-foreground/90" : "text-accent"}`}>
        {d.toLocaleDateString(undefined, { month: "short" })}
      </span>
      <span className="font-display text-xl font-semibold leading-none">{d.getDate()}</span>
    </div>
  );
}

function AddEventDialog() {
  const router = useRouter();
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
        router.refresh();
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
  attendees,
  myStatus,
  canManage,
}: {
  event: EventRow;
  attendees: ProfileLite[];
  myStatus: Rsvp["status"] | null;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const isEo = event.source === "eo";

  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${isEo ? "border-l-4 border-l-accent" : ""}`}>
      <CardContent className="space-y-3 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <DateBlock iso={event.starts_at} accent={isEo} />
            <div>
              <div className="mb-1 flex items-center gap-2">
                <p className="font-medium">{event.title}</p>
                {isEo && (
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" /> EO
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(event.starts_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
                {formatRange(event.starts_at, event.ends_at)}
              </p>
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
              {event.description && <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-2">
          {event.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.image_url} alt="" className="h-20 w-20 rounded-lg border border-border object-cover sm:h-24 sm:w-24" />
          )}
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
        </div>

        <RsvpControls eventId={event.id} myStatus={myStatus} />

        {attendees.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {attendees.slice(0, 8).map((p) => (
                <Avatar key={p.id} className="h-6 w-6 border-2 border-card">
                  {p.photo_url ? <AvatarImage src={p.photo_url} alt={p.full_name ?? ""} /> : null}
                  <AvatarFallback className="bg-secondary text-[9px] text-secondary-foreground">
                    {initials(p.full_name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendees.length === 1 ? attendees[0].full_name ?? "1 attending" : `${attendees.length} attending`}
            </p>
          </div>
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
  const profileById = useMemo(() => {
    const m = new Map<string, ProfileLite>();
    profiles.forEach((p) => m.set(p.id, p));
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

  const [showPast, setShowPast] = useState(false);

  function renderEvent(event: EventRow) {
    const eventRsvps = rsvpsByEvent.get(event.id) ?? [];
    const myStatus = eventRsvps.find((r) => r.member_id === currentUserId)?.status ?? null;
    const attendees = eventRsvps
      .filter((r) => r.status === "attending")
      .map((r) => profileById.get(r.member_id))
      .filter((p): p is ProfileLite => !!p);
    const canManage = event.created_by === currentUserId || isAdmin;

    return (
      <EventCard
        key={event.id}
        event={event}
        attendees={attendees}
        myStatus={myStatus}
        canManage={canManage}
      />
    );
  }

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
              <PartyPopper className="h-3.5 w-3.5" /> EO Fort Worth · Q4 Forum
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Upcoming Events
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              EO events and member get-togethers — RSVP so everyone knows who&apos;s in.
            </p>
          </div>
          <AddEventDialog />
        </div>
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
        <div>
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
            Past events ({past.length})
          </button>
          {showPast && <div className="mt-3 space-y-2 opacity-70">{past.map(renderEvent)}</div>}
        </div>
      )}
    </div>
  );
}
