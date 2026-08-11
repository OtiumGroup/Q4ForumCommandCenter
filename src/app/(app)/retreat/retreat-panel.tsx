"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Trash2, Plane, MapPin, CalendarDays, Upload, FileText, Check, ExternalLink,
  ListChecks, Clock, Home, PlaneLanding, PlaneTakeoff, Trophy, Vote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentViewer } from "@/components/document-viewer";
import { createClient } from "@/lib/supabase/client";
import {
  addPollOption, deletePollOption, castVote, clearVote, setRetreatDetails,
  addFlight, deleteFlight, addActivity, deleteActivity, addScheduleItem, deleteScheduleItem,
  recordRetreatDocument, deleteRetreatDocument,
} from "./actions";

type Retreat = { id: number; title: string; status: "voting" | "booked"; chosen_location: string | null; start_date: string | null; end_date: string | null; lodging_label: string | null; lodging_link: string | null; location_notes: string | null };
type Option = { id: string; label: string; created_by: string | null; created_at: string };
type VoteRow = { member_id: string; option_id: string };
type Flight = { id: string; member_id: string; direction: "arrive" | "depart"; airline: string | null; flight_no: string | null; when_text: string | null; notes: string | null; created_at: string };
type Activity = { id: string; title: string; description: string | null; link: string | null; created_by: string | null; created_at: string };
type ScheduleItem = { id: string; day_label: string; time: string | null; title: string; detail: string | null; sort_order: number; created_at: string };
type RetreatDoc = { id: string; title: string; file_path: string; file_type: string | null; uploaded_by: string | null; created_at: string; url: string | null };
type Member = { id: string; full_name: string | null; photo_url: string | null };

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function safeUrl(u?: string | null) {
  if (!u) return null;
  const t = u.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(t)) return `https://${t}`;
  return null;
}
function fmtDate(iso: string | null) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return null;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MemberChip({ m }: { m?: Member }) {
  if (!m) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Avatar className="h-5 w-5">
        {m.photo_url ? <AvatarImage src={m.photo_url} alt={m.full_name ?? ""} /> : null}
        <AvatarFallback className="bg-secondary text-[9px] text-secondary-foreground">{initials(m.full_name)}</AvatarFallback>
      </Avatar>
      <span className="text-xs text-muted-foreground">{m.full_name}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────── Location / Poll
function LocationTab({ retreat, options, votes, members, currentUserId, isAdmin }: {
  retreat: Retreat; options: Option[]; votes: VoteRow[]; members: Member[]; currentUserId: string; isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newIdea, setNewIdea] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const myVote = votes.find((v) => v.member_id === currentUserId)?.option_id ?? null;
  const totalVotes = votes.length;

  const counts = useMemo(() => {
    const c = new Map<string, string[]>();
    for (const o of options) c.set(o.id, []);
    for (const v of votes) c.get(v.option_id)?.push(v.member_id);
    return c;
  }, [options, votes]);

  const ranked = useMemo(
    () => [...options].sort((a, b) => (counts.get(b.id)?.length ?? 0) - (counts.get(a.id)?.length ?? 0)),
    [options, counts]
  );
  const leaderId = ranked[0] && (counts.get(ranked[0].id)?.length ?? 0) > 0 ? ranked[0].id : null;

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, okMsg?: string) =>
    startTransition(async () => {
      const r = await fn();
      if (r.ok) { if (okMsg) toast.success(okMsg); router.refresh(); }
      else toast.error(r.message ?? "Something went wrong.");
    });

  return (
    <div className="space-y-6">
      {retreat.status === "booked" && retreat.chosen_location ? (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/85 p-6 text-primary-foreground shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">It&apos;s booked — we&apos;re going to</p>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">{retreat.chosen_location}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-primary-foreground/80">
            {(retreat.start_date || retreat.end_date) && (
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmtDate(retreat.start_date)}{retreat.end_date ? ` – ${fmtDate(retreat.end_date)}` : ""}</span>
            )}
            {retreat.lodging_link && safeUrl(retreat.lodging_link) && (
              <a href={safeUrl(retreat.lodging_link)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary-foreground underline underline-offset-2">
                <Home className="h-4 w-4" />{retreat.lodging_label || "Where we're staying"} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {retreat.location_notes && <p className="mt-3 text-sm text-primary-foreground/75">{retreat.location_notes}</p>}
          {isAdmin && <Button variant="secondary" size="sm" className="mt-4" onClick={() => setPlanOpen(true)}>Edit the plan</Button>}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Vote className="h-5 w-5 text-accent" /> Where should we go?</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Add ideas and vote — {totalVotes} of {members.length} have voted.</p>
            </div>
            {isAdmin && <Button variant="outline" size="sm" onClick={() => setPlanOpen(true)}>Set the plan</Button>}
          </div>

          <div className="mt-4 space-y-2.5">
            {ranked.map((o) => {
              const voters = counts.get(o.id) ?? [];
              const pct = totalVotes ? Math.round((voters.length / totalVotes) * 100) : 0;
              const mine = myVote === o.id;
              return (
                <div key={o.id} className={`rounded-xl border p-3 transition-colors ${mine ? "border-accent bg-accent/5" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => (mine ? clearVote() : castVote(o.id)))}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${mine ? "border-accent bg-accent text-white" : "border-muted-foreground/40 hover:border-accent"}`}
                      aria-label={mine ? "Remove vote" : `Vote for ${o.label}`}
                    >
                      {mine && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          {o.id === leaderId && <Trophy className="h-3.5 w-3.5 text-accent" />}
                          {o.label}
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground">{voters.length} {voters.length === 1 ? "vote" : "votes"}</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      {voters.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {voters.map((mid) => <span key={mid} className="inline-flex"><Avatar className="h-5 w-5"><AvatarImage src={memberById.get(mid)?.photo_url ?? undefined} /><AvatarFallback className="bg-secondary text-[9px]">{initials(memberById.get(mid)?.full_name ?? null)}</AvatarFallback></Avatar></span>)}
                        </div>
                      )}
                    </div>
                    {(o.created_by === currentUserId || isAdmin) && (
                      <button type="button" disabled={pending} onClick={() => run(() => deletePollOption(o.id))} aria-label="Remove option" className="shrink-0 p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                  {isAdmin && retreat.status !== "booked" && (
                    <div className="mt-2 pl-9">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-accent" disabled={pending}
                        onClick={() => run(() => setRetreatDetails({ chosen_location: o.label, status: "booked" }), `Locked in ${o.label}!`)}>
                        Lock in {o.label}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <Input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} placeholder="Suggest a location…" onKeyDown={(e) => { if (e.key === "Enter" && newIdea.trim()) { run(() => addPollOption(newIdea)); setNewIdea(""); } }} />
            <Button disabled={pending || newIdea.trim().length < 2} onClick={() => { run(() => addPollOption(newIdea)); setNewIdea(""); }}><Plus className="mr-1 h-4 w-4" /> Add</Button>
          </div>
        </div>
      )}

      {isAdmin && <PlanDialog open={planOpen} onOpenChange={setPlanOpen} retreat={retreat} options={options} onSaved={() => router.refresh()} />}
    </div>
  );
}

function PlanDialog({ open, onOpenChange, retreat, options, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; retreat: Retreat; options: Option[]; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    chosen_location: retreat.chosen_location ?? "",
    start_date: retreat.start_date ?? "",
    end_date: retreat.end_date ?? "",
    lodging_label: retreat.lodging_label ?? "",
    lodging_link: retreat.lodging_link ?? "",
    location_notes: retreat.location_notes ?? "",
    status: retreat.status,
  });
  const set = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set the retreat plan</DialogTitle>
          <DialogDescription>Lock in the location, dates, and where we&apos;re staying.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input list="opts" value={form.chosen_location} onChange={(e) => set("chosen_location", e.target.value)} placeholder="e.g. Cabo San Lucas" />
            <datalist id="opts">{options.map((o) => <option key={o.id} value={o.label} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Lodging name</Label><Input value={form.lodging_label} onChange={(e) => set("lodging_label", e.target.value)} placeholder="Hotel or VRBO name" /></div>
          <div className="space-y-1.5"><Label>Lodging link (hotel / VRBO)</Label><Input value={form.lodging_link} onChange={(e) => set("lodging_link", e.target.value)} placeholder="https://…" /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.location_notes} onChange={(e) => set("location_notes", e.target.value)} placeholder="Anything the group should know" /></div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          {retreat.status === "booked" && (
            <Button variant="ghost" disabled={pending} onClick={() => startTransition(async () => { const r = await setRetreatDetails({ status: "voting" }); if (r.ok) { toast.success("Reopened voting."); onOpenChange(false); onSaved(); } })}>Reopen voting</Button>
          )}
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button disabled={pending} onClick={() => startTransition(async () => {
            const r = await setRetreatDetails({ ...form, status: form.chosen_location.trim() ? "booked" : "voting" });
            if (r.ok) { toast.success("Saved."); onOpenChange(false); onSaved(); } else toast.error(r.message ?? "Could not save.");
          })}>{pending ? "Saving…" : "Save plan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────────── Flights
function FlightsTab({ flights, members, currentUserId, isAdmin }: { flights: Flight[]; members: Member[]; currentUserId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Everyone&apos;s flights in one place — no more &quot;what time do you land?&quot; texts.</p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add my flight</Button>
      </div>
      {flights.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No flights added yet.</div>
      ) : (
        <div className="space-y-2.5">
          {flights.map((f) => (
            <div key={f.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.direction === "arrive" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                {f.direction === "arrive" ? <PlaneLanding className="h-[18px] w-[18px]" /> : <PlaneTakeoff className="h-[18px] w-[18px]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{f.direction === "arrive" ? "Arriving" : "Departing"}{f.when_text ? ` · ${f.when_text}` : ""}</p>
                <p className="text-sm text-muted-foreground">{[f.airline, f.flight_no].filter(Boolean).join(" ") || "Flight details TBD"}{f.notes ? ` — ${f.notes}` : ""}</p>
                <div className="mt-1"><MemberChip m={memberById.get(f.member_id)} /></div>
              </div>
              {(f.member_id === currentUserId || isAdmin) && (
                <button type="button" disabled={pending} onClick={() => startTransition(async () => { const r = await deleteFlight(f.id); if (r.ok) router.refresh(); else toast.error(r.message ?? "Failed."); })} aria-label="Delete flight" className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
      )}
      <FlightDialog open={open} onOpenChange={setOpen} onSaved={() => router.refresh()} />
    </div>
  );
}

function FlightDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={(fd) => startTransition(async () => { const r = await addFlight(fd); if (r.ok) { toast.success("Flight added."); onOpenChange(false); onSaved(); } else toast.error(r.message ?? "Failed."); })}>
          <DialogHeader><DialogTitle>Add a flight</DialogTitle><DialogDescription>So everyone knows when you&apos;re in and out.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select name="direction" defaultValue="arrive"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="arrive">Arriving</SelectItem><SelectItem value="depart">Departing</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="when_text">When</Label><Input id="when_text" name="when_text" placeholder="e.g. Thu Mar 27 · 2:15 PM" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="airline">Airline</Label><Input id="airline" name="airline" placeholder="American" /></div>
              <div className="space-y-1.5"><Label htmlFor="flight_no">Flight #</Label><Input id="flight_no" name="flight_no" placeholder="AA 1234" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Input id="notes" name="notes" placeholder="Optional — e.g. happy to share a ride" /></div>
          </div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose><Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add flight"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ────────────────────────────────────────────────────────────────── Activities
function ActivitiesTab({ activities, members, currentUserId, isAdmin }: { activities: Activity[]; members: Member[]; currentUserId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Ideas for things to do together while we&apos;re there.</p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add an idea</Button>
      </div>
      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No activity ideas yet — add the first.</div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {activities.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{a.title}</p>
                {(a.created_by === currentUserId || isAdmin) && (
                  <button type="button" disabled={pending} onClick={() => startTransition(async () => { const r = await deleteActivity(a.id); if (r.ok) router.refresh(); else toast.error(r.message ?? "Failed."); })} aria-label="Delete" className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
              {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
              {a.link && safeUrl(a.link) && <a href={safeUrl(a.link)!} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-accent underline-offset-2 hover:underline">Link <ExternalLink className="h-3 w-3" /></a>}
              <div className="mt-2"><MemberChip m={a.created_by ? memberById.get(a.created_by) : undefined} /></div>
            </div>
          ))}
        </div>
      )}
      <ActivityDialog open={open} onOpenChange={setOpen} onSaved={() => router.refresh()} />
    </div>
  );
}

function ActivityDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ title: "", description: "", link: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add an activity idea</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sunset catamaran cruise" /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details" /></div>
          <div className="space-y-1.5"><Label>Link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Optional — booking or info link" /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button disabled={pending || form.title.trim().length < 2} onClick={() => startTransition(async () => { const r = await addActivity(form); if (r.ok) { toast.success("Added."); setForm({ title: "", description: "", link: "" }); onOpenChange(false); onSaved(); } else toast.error(r.message ?? "Failed."); })}>{pending ? "Adding…" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────── Schedule
function ScheduleTab({ schedule, isAdmin }: { schedule: ScheduleItem[]; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const byDay = useMemo(() => {
    const m = new Map<string, ScheduleItem[]>();
    for (const s of schedule) { if (!m.has(s.day_label)) m.set(s.day_label, []); m.get(s.day_label)!.push(s); }
    return [...m.entries()];
  }, [schedule]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">The day-by-day plan{isAdmin ? " — you build it, everyone sees it." : "."}</p>
        {isAdmin && <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add item</Button>}
      </div>
      {schedule.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">{isAdmin ? "Build the schedule once the trip is set." : "The schedule is being put together."}</div>
      ) : (
        <div className="space-y-5">
          {byDay.map(([day, items]) => (
            <div key={day}>
              <h3 className="mb-2 font-display text-base font-semibold text-accent">{day}</h3>
              <div className="space-y-2">
                {items.map((s) => (
                  <div key={s.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="w-20 shrink-0 text-sm font-medium text-muted-foreground">{s.time || "—"}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.title}</p>
                      {s.detail && <p className="text-sm text-muted-foreground">{s.detail}</p>}
                    </div>
                    {isAdmin && <button type="button" disabled={pending} onClick={() => startTransition(async () => { const r = await deleteScheduleItem(s.id); if (r.ok) router.refresh(); else toast.error(r.message ?? "Failed."); })} aria-label="Delete" className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {isAdmin && <ScheduleDialog open={open} onOpenChange={setOpen} days={byDay.map(([d]) => d)} onSaved={() => router.refresh()} />}
    </div>
  );
}

function ScheduleDialog({ open, onOpenChange, days, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; days: string[]; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ day_label: "", time: "", title: "", detail: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a schedule item</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Day</Label><Input list="days" value={form.day_label} onChange={(e) => setForm({ ...form, day_label: e.target.value })} placeholder="e.g. Day 1 · Thu Mar 27" /><datalist id="days">{days.map((d) => <option key={d} value={d} />)}</datalist></div>
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <div className="space-y-1.5"><Label>Time</Label><Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="9:00 AM" /></div>
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Workshop, dinner, etc." /></div>
          </div>
          <div className="space-y-1.5"><Label>Details</Label><Textarea rows={2} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="Optional" /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
          <Button disabled={pending || !form.day_label.trim() || !form.title.trim()} onClick={() => startTransition(async () => { const r = await addScheduleItem(form); if (r.ok) { toast.success("Added."); setForm({ day_label: form.day_label, time: "", title: "", detail: "" }); onOpenChange(false); onSaved(); } else toast.error(r.message ?? "Failed."); })}>{pending ? "Adding…" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────── Documents
function DocumentsTab({ documents, members, currentUserId, isAdmin }: { documents: RetreatDoc[]; members: Member[]; currentUserId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(documents[0]?.id ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const selected = documents.find((d) => d.id === selectedId) ?? null;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("retreat-documents").upload(path, file);
      if (error) throw error;
      const res = await recordRetreatDocument({ title: file.name.replace(/\.[^.]+$/, ""), file_path: path, file_type: file.name.split(".").pop() || "" });
      if (!res.ok) throw new Error(res.message);
      toast.success("Uploaded.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Shared docs for the retreat only — workshop materials, itineraries, waivers.</p>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}</Button>
      </div>
      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No retreat documents yet.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="space-y-1.5">
            {documents.map((d) => (
              <div key={d.id} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${selectedId === d.id ? "border-accent bg-accent/5" : "border-border"}`}>
                <button type="button" onClick={() => setSelectedId(d.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{d.title}</span><span className="block truncate text-xs text-muted-foreground">{memberById.get(d.uploaded_by ?? "")?.full_name ?? "Member"}</span></span>
                </button>
                {(d.uploaded_by === currentUserId || isAdmin) && (
                  <button type="button" disabled={pending} onClick={() => startTransition(async () => { const r = await deleteRetreatDocument(d.id, d.file_path); if (r.ok) { if (selectedId === d.id) setSelectedId(null); router.refresh(); } else toast.error(r.message ?? "Failed."); })} aria-label="Delete" className="shrink-0 p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                )}
              </div>
            ))}
          </div>
          <DocumentViewer url={selected?.url ?? null} title={selected?.title ?? ""} fileType={selected?.file_type} className="min-h-[60vh]" />
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────── Panel
export function RetreatPanel(props: {
  currentUserId: string; isAdmin: boolean; retreat: Retreat;
  options: Option[]; votes: VoteRow[]; flights: Flight[]; activities: Activity[];
  schedule: ScheduleItem[]; documents: RetreatDoc[]; members: Member[];
}) {
  const { retreat } = props;
  const desc = retreat.status === "booked" && retreat.chosen_location
    ? `We're headed to ${retreat.chosen_location}. Flights, plans, and docs — all here.`
    : "Vote on where to go, then plan flights, activities, schedule, and docs — all in one place.";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader eyebrow="Annual Retreat" title="Forum Retreat" description={desc} />
      <Tabs defaultValue="location">
        <TabsList className="flex-wrap">
          <TabsTrigger value="location"><MapPin className="mr-1.5 h-3.5 w-3.5" />Location</TabsTrigger>
          <TabsTrigger value="flights"><Plane className="mr-1.5 h-3.5 w-3.5" />Flights</TabsTrigger>
          <TabsTrigger value="activities"><ListChecks className="mr-1.5 h-3.5 w-3.5" />Activities</TabsTrigger>
          <TabsTrigger value="schedule"><Clock className="mr-1.5 h-3.5 w-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="mr-1.5 h-3.5 w-3.5" />Docs</TabsTrigger>
        </TabsList>
        <TabsContent value="location" className="mt-4"><LocationTab retreat={retreat} options={props.options} votes={props.votes} members={props.members} currentUserId={props.currentUserId} isAdmin={props.isAdmin} /></TabsContent>
        <TabsContent value="flights" className="mt-4"><FlightsTab flights={props.flights} members={props.members} currentUserId={props.currentUserId} isAdmin={props.isAdmin} /></TabsContent>
        <TabsContent value="activities" className="mt-4"><ActivitiesTab activities={props.activities} members={props.members} currentUserId={props.currentUserId} isAdmin={props.isAdmin} /></TabsContent>
        <TabsContent value="schedule" className="mt-4"><ScheduleTab schedule={props.schedule} isAdmin={props.isAdmin} /></TabsContent>
        <TabsContent value="documents" className="mt-4"><DocumentsTab documents={props.documents} members={props.members} currentUserId={props.currentUserId} isAdmin={props.isAdmin} /></TabsContent>
      </Tabs>
    </div>
  );
}
